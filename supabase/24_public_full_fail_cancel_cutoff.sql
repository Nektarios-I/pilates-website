-- =============================================================================
-- 24_public_full_fail_cancel_cutoff.sql — No public waitlist + 2h client cancel
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- CHANGES:
--   • Public book_session / book_session_with_credits: allow_waitlist = false
--     (full capacity raises P0015, consistent with staff + recurring).
--   • cancel_booking: client self-cancel blocked within 2 hours of session start
--     (P0029). Staff may still cancel client bookings (operational override).
--
-- RUN ORDER: After 23_recurring_prebook_cron.sql (or after 21 if recurring skipped).
-- SAFE TO RE-RUN: Yes (CREATE OR REPLACE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- public.book_session — fail on full (no waitlist)
-- ---------------------------------------------------------------------------
create or replace function public.book_session(
  p_session_id     uuid,
  p_user_package_id uuid
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id            uuid;
  v_session            public.sessions%rowtype;
  v_package_class_type text;
  v_required_credits   integer;
  v_reformer_id        uuid;
  v_mat_id             uuid;
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
    false,  -- no waitlist: full sessions fail for public booking
    false,
    'client',
    null,
    null
  );
end;
$$;

comment on function public.book_session is
  'Atomically validates and creates a client booking. Full sessions fail (P0015).';

-- ---------------------------------------------------------------------------
-- public.book_session_with_credits — fail on full (no waitlist)
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
    false,
    false,
    'client',
    null,
    null
  );
end;
$$;

comment on function public.book_session_with_credits is
  'Books a session with explicit reformer/mat packages. Full sessions fail (P0015).';

-- ---------------------------------------------------------------------------
-- cancel_booking — 2-hour client self-cancel cutoff (staff exempt)
-- ---------------------------------------------------------------------------
create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_reason     text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id           uuid;
  v_booking           public.bookings%rowtype;
  v_cancelled         public.bookings%rowtype;
  v_session_starts_at timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  select * into v_booking
    from public.bookings
   where id = p_booking_id
     for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0010';
  end if;

  if v_booking.user_id != v_user_id then
    if not (select private.is_staff()) then
      raise exception 'Not authorised to cancel this booking'
        using errcode = 'P0011';
    end if;
  end if;

  if v_booking.status not in ('booked', 'waitlisted') then
    raise exception 'Booking cannot be cancelled (status: %)', v_booking.status
      using errcode = 'P0012';
  end if;

  select s.starts_at into v_session_starts_at
    from public.sessions s
   where s.id = v_booking.session_id;

  if v_booking.user_id = v_user_id
     and not (select private.is_staff())
     and v_session_starts_at is not null
     and v_session_starts_at <= now() + interval '2 hours' then
    raise exception
      'Cancellations must be made more than 2 hours before class start'
      using errcode = 'P0029';
  end if;

  if v_booking.status = 'booked' then
    if exists (
      select 1 from public.booking_credit_charges
       where booking_id = v_booking.id
    ) then
      update public.user_packages up
         set credits_remaining = case
               when up.credits_remaining is null then null
               else up.credits_remaining + charges.credits_used
             end,
             status = case
               when up.status = 'used_up' then 'active'
               else up.status
             end
        from public.booking_credit_charges charges
       where charges.booking_id = v_booking.id
         and charges.user_package_id = up.id
         and up.status in ('active', 'used_up');
    else
      update public.user_packages
         set credits_remaining = case
               when credits_remaining is null then null
               else credits_remaining + v_booking.credits_used
             end,
             status = case
               when status = 'used_up' then 'active'
               else status
             end
       where id = v_booking.user_package_id
         and status in ('active', 'used_up');
    end if;
  end if;

  update public.bookings
     set status              = 'cancelled',
         cancelled_at        = now(),
         cancellation_reason = p_reason
   where id = p_booking_id
  returning * into v_cancelled;

  return v_cancelled;
end;
$$;

comment on function public.cancel_booking is
  'Cancels a booking and refunds credits for confirmed bookings. Client self-cancel blocked within 2 hours of class start (P0029). Staff may cancel anytime.';
