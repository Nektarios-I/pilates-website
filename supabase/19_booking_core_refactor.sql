-- =============================================================================
-- 19_booking_core_refactor.sql — Shared booking core + public wrapper refactor
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- Extracts private.book_session_core() and refactors public book_session /
-- book_session_with_credits into thin wrappers. Public behavior preserved:
-- waitlist on full capacity, credit deduction, P0013 slot guard, provenance
-- defaults (booking_source = client).
--
-- RUN ORDER: After 18_recurring_prebook_schema.sql.
-- SAFE TO RE-RUN: Yes (CREATE OR REPLACE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: studio calendar date in Europe/Nicosia (for future horizon checks).
-- ---------------------------------------------------------------------------
create or replace function private.studio_today()
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (timezone('Europe/Nicosia', now()))::date;
$$;

comment on function private.studio_today() is
  'Current calendar date in the studio timezone (Europe/Nicosia).';

-- ---------------------------------------------------------------------------
-- private.book_session_core(...)
-- Single enforcement point for session lock, validation, capacity, credits,
-- slot conflict, provenance, and optional public horizon.
-- ---------------------------------------------------------------------------
create or replace function private.book_session_core(
  p_user_id                          uuid,
  p_session_id                       uuid,
  p_reformer_user_package_id         uuid,
  p_mat_user_package_id              uuid,
  p_allow_waitlist                   boolean,
  p_enforce_public_horizon           boolean,
  p_booking_source                   text,
  p_created_by_user_id               uuid,
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
  v_horizon_end        timestamptz;
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

  if p_enforce_public_horizon then
    v_horizon_end := ((private.studio_today() + interval '1 month')::timestamp
                      at time zone 'Europe/Nicosia');
    if v_session.starts_at > v_horizon_end then
      raise exception 'Cannot book more than one month in advance'
        using errcode = 'P0014';
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

    if v_reformer_package.expires_at is not null and v_reformer_package.expires_at < now() then
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

    if v_mat_package.expires_at is not null and v_mat_package.expires_at < now() then
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

comment on function private.book_session_core is
  'Internal booking enforcement: capacity, credits, slot conflict, provenance, optional horizon.';

-- ---------------------------------------------------------------------------
-- public.book_session — thin wrapper (public behavior unchanged)
-- ---------------------------------------------------------------------------
create or replace function public.book_session(
  p_session_id      uuid,
  p_user_package_id uuid
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id            uuid;
  v_package_class_type text;
  v_reformer_id        uuid;
  v_mat_id             uuid;
  v_required_credits   integer;
  v_session            public.sessions%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  select p.class_type into v_package_class_type
    from public.user_packages up
    join public.packages p on p.id = up.package_id
   where up.id = p_user_package_id
     and up.user_id = v_user_id;

  if not found then
    raise exception 'Package not found or does not belong to you'
      using errcode = 'P0005';
  end if;

  select * into v_session
    from public.sessions
   where id = p_session_id;

  if not found then
    raise exception 'Session not found' using errcode = 'P0002';
  end if;

  v_required_credits := case v_package_class_type
    when 'reformer' then coalesce(v_session.reformer_credits_required, v_session.credits_required)
    when 'mat' then coalesce(v_session.mat_credits_required, v_session.credits_required)
    else 0
  end;

  if v_required_credits <= 0 then
    raise exception 'Selected package type is not required for this session'
      using errcode = 'P0009';
  end if;

  v_reformer_id := case when v_package_class_type = 'reformer' then p_user_package_id else null end;
  v_mat_id      := case when v_package_class_type = 'mat' then p_user_package_id else null end;

  return private.book_session_core(
    v_user_id,
    p_session_id,
    v_reformer_id,
    v_mat_id,
    true,   -- p_allow_waitlist: preserve public waitlist semantics
    false,  -- p_enforce_public_horizon: unchanged until enabled in a later phase
    'client',
    null,
    null
  );
end;
$$;

comment on function public.book_session is
  'Atomically validates and creates a booking. Handles capacity, credits, expiry, and waitlist.';

-- ---------------------------------------------------------------------------
-- public.book_session_with_credits — thin wrapper (public behavior unchanged)
-- ---------------------------------------------------------------------------
create or replace function public.book_session_with_credits(
  p_session_id uuid,
  p_reformer_user_package_id uuid default null,
  p_mat_user_package_id uuid default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  return private.book_session_core(
    v_user_id,
    p_session_id,
    p_reformer_user_package_id,
    p_mat_user_package_id,
    true,
    false,
    'client',
    null,
    null
  );
end;
$$;

comment on function public.book_session_with_credits is
  'Books a session using explicit reformer and/or mat package deductions.';

grant execute on function public.book_session_with_credits(uuid, uuid, uuid)
  to authenticated;
