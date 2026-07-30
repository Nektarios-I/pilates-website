-- =============================================================================
-- 39_package_lifecycle_alignment.sql
-- Package lifecycle: expiry equality alignment + durable audit events
--
-- WHAT THIS SCRIPT DOES
--   1. Aligns expiry checks so expires_at <= now() is treated (not only <).
--   2. Creates public.user_package_events for staff membership mutations.
--
-- DOES NOT: change credit-deduction math, capacity rules, or booking sources.
-- Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TABLE: user_package_events
-- ---------------------------------------------------------------------------
create table if not exists public.user_package_events (
  id               uuid        primary key default gen_random_uuid(),
  user_package_id  uuid        references public.user_packages(id) on delete set null,
  user_id          uuid        not null references public.profiles(id) on delete cascade,
  actor_user_id    uuid        not null references public.profiles(id) on delete restrict,
  action           text        not null
                     check (action in (
                       'package_applied',
                       'credits_adjusted',
                       'expiry_extended',
                       'package_reactivated',
                       'package_cancelled',
                       'package_removed',
                       'package_remove_failed'
                     )),
  previous_values  jsonb,
  new_values       jsonb,
  reason           text,
  created_at       timestamptz not null default now()
);

comment on table public.user_package_events is
  'Durable audit trail for staff membership/package lifecycle mutations.';

create index if not exists idx_user_package_events_user_created
  on public.user_package_events (user_id, created_at desc);

create index if not exists idx_user_package_events_package_created
  on public.user_package_events (user_package_id, created_at desc);

create index if not exists idx_user_package_events_action_created
  on public.user_package_events (action, created_at desc);

alter table public.user_package_events enable row level security;

grant select on public.user_package_events to authenticated;

drop policy if exists "user_package_events: staff reads all" on public.user_package_events;
create policy "user_package_events: staff reads all"
  on public.user_package_events for select
  to authenticated
  using ( (select private.is_staff()) );

-- Mutations go through service-role staff actions (admin client).
drop policy if exists "user_package_events: admin inserts" on public.user_package_events;
create policy "user_package_events: admin inserts"
  on public.user_package_events for insert
  to authenticated
  with check ( (select private.is_admin()) );

-- ---------------------------------------------------------------------------
-- expire_packages — treat expires_at <= now as expired
-- ---------------------------------------------------------------------------
create or replace function public.expire_packages()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.user_packages
     set status = 'expired'
   where status = 'active'
     and expires_at is not null
     and expires_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.expire_packages is
  'Marks active packages with expires_at <= now() as expired. Idempotent.';

-- ---------------------------------------------------------------------------
-- handle_user_package_status — same equality rule on UPDATE
-- ---------------------------------------------------------------------------
create or replace function public.handle_user_package_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.credits_remaining is not null and new.credits_remaining <= 0 then
    new.status := 'used_up';
  end if;

  if new.expires_at is not null
     and new.expires_at <= now()
     and new.status = 'active' then
    new.status := 'expired';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- book_session_core — reject expires_at <= now (P0007)
-- Only the expiry comparisons change; all other booking rules preserved.
-- ---------------------------------------------------------------------------
create or replace function private.book_session_core(
  p_user_id uuid,
  p_session_id uuid,
  p_reformer_user_package_id uuid,
  p_mat_user_package_id uuid,
  p_allow_waitlist boolean,
  p_enforce_public_horizon boolean,
  p_booking_source text,
  p_created_by_user_id uuid,
  p_recurring_materialization_log_id uuid
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session            public.sessions%rowtype;
  v_reformer_required  integer;
  v_mat_required       integer;
  v_reformer_package   public.user_packages%rowtype;
  v_mat_package        public.user_packages%rowtype;
  v_confirmed_count    integer;
  v_status             text;
  v_primary_package_id uuid;
  v_new_booking        public.bookings;
  v_schedule_date      date;
  v_start_time         time;
begin
  if p_user_id is null then
    raise exception 'User is required' using errcode = 'P0001';
  end if;

  if p_booking_source not in ('client', 'staff_manual', 'recurring') then
    raise exception 'Invalid booking source: %', p_booking_source using errcode = 'P0016';
  end if;

  select * into v_session
    from public.sessions
   where id = p_session_id
     for update;

  if not found then
    raise exception 'Session not found' using errcode = 'P0002';
  end if;

  if v_session.status != 'scheduled' then
    raise exception 'Session is not available for booking (status: %)', v_session.status
      using errcode = 'P0003';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'Cannot book a session that has already started'
      using errcode = 'P0004';
  end if;

  v_schedule_date := (v_session.starts_at at time zone 'Europe/Nicosia')::date;
  v_start_time := (v_session.starts_at at time zone 'Europe/Nicosia')::time;

  if p_enforce_public_horizon then
    if v_schedule_date > private.public_booking_window_end_date() then
      raise exception 'Cannot book more than % days in advance',
        private.public_booking_horizon_days()
        using errcode = 'P0014';
    end if;

    if private.recurring_blocks_public_booking(
      v_schedule_date,
      v_start_time,
      v_session.session_type
    ) then
      raise exception
        'This time slot is reserved until recurring prebookings are processed for this date'
        using errcode = 'P0032';
    end if;
  end if;

  if private.user_has_active_booking_at_slot(p_user_id, v_session.starts_at, v_session.ends_at) then
    raise exception 'You already have a booking at this time slot'
      using errcode = 'P0013';
  end if;

  v_reformer_required := coalesce(v_session.reformer_credits_required, 0);
  v_mat_required := coalesce(v_session.mat_credits_required, 0);

  if v_reformer_required <= 0 and v_mat_required <= 0 then
    raise exception 'This session has no credit requirement configured'
      using errcode = 'P0009';
  end if;

  if v_reformer_required > 0 then
    if p_reformer_user_package_id is null then
      raise exception 'A reformer package is required' using errcode = 'P0005';
    end if;

    select up.* into v_reformer_package
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.id = p_reformer_user_package_id
       and up.user_id = p_user_id
       and p.class_type = 'reformer'
     for update;

    if not found then
      raise exception 'Reformer package not found or does not belong to you'
        using errcode = 'P0005';
    end if;

    if v_reformer_package.status != 'active' then
      raise exception 'Reformer package is not active (status: %)', v_reformer_package.status
        using errcode = 'P0006';
    end if;

    if v_reformer_package.expires_at is not null and v_reformer_package.expires_at <= now() then
      raise exception 'Reformer package has expired' using errcode = 'P0007';
    end if;

    if v_reformer_package.credits_remaining is not null
       and v_reformer_package.credits_remaining < v_reformer_required then
      raise exception 'Insufficient reformer credits (have %, need %)',
        v_reformer_package.credits_remaining, v_reformer_required
        using errcode = 'P0008';
    end if;
  end if;

  if v_mat_required > 0 then
    if p_mat_user_package_id is null then
      raise exception 'A mat package is required' using errcode = 'P0005';
    end if;

    select up.* into v_mat_package
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.id = p_mat_user_package_id
       and up.user_id = p_user_id
       and p.class_type = 'mat'
     for update;

    if not found then
      raise exception 'Mat package not found or does not belong to you'
        using errcode = 'P0005';
    end if;

    if v_mat_package.status != 'active' then
      raise exception 'Mat package is not active (status: %)', v_mat_package.status
        using errcode = 'P0006';
    end if;

    if v_mat_package.expires_at is not null and v_mat_package.expires_at <= now() then
      raise exception 'Mat package has expired' using errcode = 'P0007';
    end if;

    if v_mat_package.credits_remaining is not null
       and v_mat_package.credits_remaining < v_mat_required then
      raise exception 'Insufficient mat credits (have %, need %)',
        v_mat_package.credits_remaining, v_mat_required
        using errcode = 'P0008';
    end if;
  end if;

  select count(*) into v_confirmed_count
    from public.bookings
   where session_id = p_session_id
     and status = 'booked';

  if v_confirmed_count >= v_session.capacity then
    if p_allow_waitlist then
      v_status := 'waitlisted';
    else
      raise exception 'Session is at capacity' using errcode = 'P0015';
    end if;
  else
    v_status := 'booked';
  end if;

  v_primary_package_id := coalesce(p_reformer_user_package_id, p_mat_user_package_id);

  if v_status = 'booked' then
    if v_reformer_required > 0 then
      update public.user_packages
         set credits_remaining = case
               when credits_remaining is null then null
               else credits_remaining - v_reformer_required
             end
       where id = p_reformer_user_package_id;
    end if;

    if v_mat_required > 0 then
      update public.user_packages
         set credits_remaining = case
               when credits_remaining is null then null
               else credits_remaining - v_mat_required
             end
       where id = p_mat_user_package_id;
    end if;
  end if;

  insert into public.bookings (
    user_id,
    session_id,
    user_package_id,
    status,
    credits_used,
    booked_at,
    booking_source,
    created_by_user_id,
    recurring_materialization_log_id
  )
  values (
    p_user_id,
    p_session_id,
    v_primary_package_id,
    v_status,
    v_reformer_required + v_mat_required,
    now(),
    p_booking_source,
    p_created_by_user_id,
    p_recurring_materialization_log_id
  )
  returning * into v_new_booking;

  if v_status = 'booked' and v_reformer_required > 0 then
    insert into public.booking_credit_charges (
      booking_id, user_package_id, class_type, credits_used
    )
    values (
      v_new_booking.id, p_reformer_user_package_id, 'reformer', v_reformer_required
    )
    on conflict (booking_id, class_type) do nothing;
  end if;

  if v_status = 'booked' and v_mat_required > 0 then
    insert into public.booking_credit_charges (
      booking_id, user_package_id, class_type, credits_used
    )
    values (
      v_new_booking.id, p_mat_user_package_id, 'mat', v_mat_required
    )
    on conflict (booking_id, class_type) do nothing;
  end if;

  return v_new_booking;
end;
$$;

comment on function private.book_session_core(
  uuid, uuid, uuid, uuid, boolean, boolean, text, uuid, uuid
) is
  'Internal booking enforcement: capacity, credits, slot conflict, provenance, optional horizon. Expiry uses expires_at <= now().';
