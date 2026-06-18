-- =============================================================================
-- 03_functions.sql  —  Business Logic Functions
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- WHAT THIS SCRIPT DOES
--   All functions use SECURITY DEFINER so they bypass RLS internally and run
--   atomically.  They are the single enforcement point for all booking rules.
--
--   book_session()      — create a booking, decrement credits, handle waitlist
--   cancel_booking()    — cancel and refund credits
--   get_active_packages() — list a user's usable packages with balances
--   get_session_roster()  — instructor / admin view of who booked a session
--   has_role()          — public helper: check if a user has a given role
--   expire_packages()   — scheduled/manual job to mark stale packages expired
--
-- RUN ORDER: Run after 02_rls.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- book_session(p_session_id, p_user_package_id)
--
-- Validates and creates a booking.  Returns the new booking row.
-- Raises exceptions with descriptive codes on every failure condition.
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
  v_user_id         uuid;
  v_session         public.sessions%rowtype;
  v_user_package    public.user_packages%rowtype;
  v_package_class_type text;
  v_confirmed_count integer;
  v_new_booking     public.bookings;
  v_status          text;
begin
  -- ── 1. Identify caller ──────────────────────────────────────────────────
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  -- ── 2. Load and validate the session ────────────────────────────────────
  select * into v_session
    from public.sessions
   where id = p_session_id
     for update;                        -- lock the row for capacity check

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

  -- ── 3. Load and validate the user_package ───────────────────────────────
  select * into v_user_package
    from public.user_packages
   where id = p_user_package_id
     and user_id = v_user_id
     for update;                        -- lock for credit decrement

  if not found then
    raise exception 'Package not found or does not belong to you'
      using errcode = 'P0005';
  end if;

  if v_user_package.status != 'active' then
    raise exception 'Package is not active (status: %)', v_user_package.status
      using errcode = 'P0006';
  end if;

  if v_user_package.expires_at is not null and v_user_package.expires_at < now() then
    raise exception 'Package has expired' using errcode = 'P0007';
  end if;

  select p.class_type into v_package_class_type
    from public.packages p
   where p.id = v_user_package.package_id;

  if v_package_class_type is distinct from v_session.session_type then
    raise exception 'Selected package is for %, but this is a % session',
      v_package_class_type, v_session.session_type
      using errcode = 'P0009';
  end if;

  if v_user_package.credits_remaining is not null
     and v_user_package.credits_remaining < v_session.credits_required then
    raise exception 'Insufficient credits (have %, need %)',
      v_user_package.credits_remaining, v_session.credits_required
      using errcode = 'P0008';
  end if;

  -- ── 4. Check capacity for waitlist logic ────────────────────────────────
  select count(*) into v_confirmed_count
    from public.bookings
   where session_id = p_session_id
     and status = 'booked';

  if v_confirmed_count >= v_session.capacity then
    v_status := 'waitlisted';
  else
    v_status := 'booked';
  end if;

  -- ── 5. Deduct credits (only for confirmed bookings, not waitlisted) ──────
  if v_status = 'booked' then
    update public.user_packages
       set credits_remaining = case
             when credits_remaining is null then null   -- unlimited
             else credits_remaining - v_session.credits_required
           end
     where id = p_user_package_id;
  end if;

  -- ── 6. Insert the booking ────────────────────────────────────────────────
  insert into public.bookings (
    user_id, session_id, user_package_id, status, credits_used, booked_at
  )
  values (
    v_user_id, p_session_id, p_user_package_id,
    v_status, v_session.credits_required, now()
  )
  returning * into v_new_booking;

  return v_new_booking;
end;
$$;

comment on function public.book_session is
  'Atomically validates and creates a booking. Handles capacity, credits, expiry, and waitlist.';

-- ---------------------------------------------------------------------------
-- cancel_booking(p_booking_id, p_reason)
--
-- Cancels a booking and refunds credits if the original status was 'booked'.
-- Waitlisted bookings are cancelled without any credit impact.
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
  v_user_id     uuid;
  v_booking     public.bookings%rowtype;
  v_cancelled   public.bookings%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  -- Load and lock booking
  select * into v_booking
    from public.bookings
   where id = p_booking_id
     for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0010';
  end if;

  -- Admins / owners can cancel any booking; clients only their own
  if v_booking.user_id != v_user_id then
    -- Allow if caller is admin or owner
    if not exists (
      select 1 from public.user_roles
       where user_id = v_user_id
         and role in ('admin', 'owner')
    ) then
      raise exception 'Not authorised to cancel this booking'
        using errcode = 'P0011';
    end if;
  end if;

  if v_booking.status not in ('booked', 'waitlisted') then
    raise exception 'Booking cannot be cancelled (status: %)', v_booking.status
      using errcode = 'P0012';
  end if;

  -- Refund credits and re-activate for confirmed (non-waitlisted) bookings.
  --
  -- Bug fixed: the previous two-UPDATE approach only ran the credits refund
  -- against status='active' packages. A 'used_up' package (credits=0) would
  -- never have credits restored, and the subsequent re-activation check on
  -- credits_remaining > 0 would always fail on the still-zero value.
  --
  -- This single UPDATE handles both states atomically:
  --   • 'active'   → credits restored, status unchanged
  --   • 'used_up'  → credits restored, status reset to 'active'
  if v_booking.status = 'booked' then
    update public.user_packages
       set credits_remaining = case
             when credits_remaining is null then null   -- unlimited: unchanged
             else credits_remaining + v_booking.credits_used
           end,
           status = case
             when status = 'used_up' then 'active'      -- re-activate on credit refund
             else status
           end
     where id = v_booking.user_package_id
       and status in ('active', 'used_up');
  end if;

  -- Mark cancelled
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
  'Cancels a booking and refunds credits for confirmed (non-waitlisted) bookings.';

-- ---------------------------------------------------------------------------
-- get_active_packages(p_user_id)
--
-- Returns the active, non-expired packages with remaining credits for a user.
-- Clients call this without arguments (defaults to auth.uid()).
-- Admins can pass any user_id.
-- ---------------------------------------------------------------------------
drop function if exists public.get_active_packages(uuid);
create or replace function public.get_active_packages(
  p_user_id uuid default null
)
returns table (
  user_package_id   uuid,
  package_id        uuid,
  package_name      text,
  class_type        text,
  package_type      text,
  credits_remaining integer,
  expires_at        timestamptz,
  status            text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_target_user uuid;
begin
  v_target_user := coalesce(p_user_id, auth.uid());

  -- Non-admins can only query their own packages
  if p_user_id is not null
     and p_user_id != auth.uid()
     and not exists (
       select 1 from public.user_roles
        where user_id = (select auth.uid())
          and role in ('owner', 'admin')
     )
  then
    raise exception 'Not authorised to view another user''s packages'
      using errcode = 'P0020';
  end if;

  return query
  select
    up.id,
    up.package_id,
    p.name,
    p.class_type,
    p.package_type,
    up.credits_remaining,
    up.expires_at,
    up.status
  from public.user_packages up
  join public.packages p on up.package_id = p.id
  where up.user_id = v_target_user
    and up.status = 'active'
    and (up.expires_at is null or up.expires_at > now())
    and (up.credits_remaining is null or up.credits_remaining > 0)
  order by up.expires_at asc nulls last;
end;
$$;

-- ---------------------------------------------------------------------------
-- get_session_roster(p_session_id)
--
-- Returns the confirmed + waitlisted attendees for a session.
-- Only accessible by the session's instructor, admins, or owners.
-- ---------------------------------------------------------------------------
create or replace function public.get_session_roster(
  p_session_id uuid
)
returns table (
  booking_id    uuid,
  user_id       uuid,
  full_name     text,
  email         text,
  status        text,
  booked_at     timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_caller uuid;
begin
  v_caller := auth.uid();

  -- Must be admin/owner OR the instructor of this specific session
  if not exists (
    select 1 from public.user_roles
     where user_id = v_caller
       and role in ('owner', 'admin')
  )
  and not exists (
    select 1 from public.sessions
     where id = p_session_id
       and instructor_id = v_caller
  ) then
    raise exception 'Not authorised to view this session roster'
      using errcode = 'P0030';
  end if;

  return query
  select
    b.id,
    b.user_id,
    pr.full_name,
    pr.email,
    b.status,
    b.booked_at
  from public.bookings b
  join public.profiles pr on pr.id = b.user_id
  where b.session_id = p_session_id
    and b.status in ('booked', 'waitlisted', 'attended', 'no_show')
  order by b.status, b.booked_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- has_role(p_user_id, p_role)
--
-- Public helper callable from the app layer to check a user's role.
-- Clients can only check their own role; admins can check any user.
-- ---------------------------------------------------------------------------
create or replace function public.has_role(
  p_user_id uuid,
  p_role    text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_user_id != (select auth.uid())
     and not exists (
       select 1 from public.user_roles
        where user_id = (select auth.uid())
          and role in ('owner', 'admin')
     )
  then
    raise exception 'Not authorised' using errcode = 'P0040';
  end if;

  return exists (
    select 1 from public.user_roles
     where user_id = p_user_id
       and role = p_role::public.app_role
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- expire_packages()
--
-- Marks all overdue packages as 'expired'.
-- Run on a schedule (e.g. Supabase pg_cron daily) or call manually.
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
   where status  = 'active'
     and expires_at is not null
     and expires_at < now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.expire_packages is
  'Marks all expired active packages. Safe to call repeatedly. Returns count of rows updated.';
