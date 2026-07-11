-- =============================================================================
-- 21_cancel_booking_staff_auth.sql — Staff cancel parity + package visibility
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- Extends cancel_booking so all staff (instructor/admin/owner) may cancel client
-- bookings. Extends get_active_packages so staff may view client packages.
-- Refund policy unchanged (no 2-hour cutoff in this phase).
--
-- RUN ORDER: After 20_staff_booking_rpc.sql.
-- SAFE TO RE-RUN: Yes (CREATE OR REPLACE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- cancel_booking — extend authorization to private.is_staff()
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
  'Cancels a booking and refunds credits for confirmed (non-waitlisted) bookings. Staff may cancel client bookings.';

-- ---------------------------------------------------------------------------
-- get_active_packages — staff may query any client user_id
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

  if p_user_id is not null
     and p_user_id != auth.uid()
     and not (select private.is_staff())
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

comment on function public.get_active_packages(uuid) is
  'Active packages for a user. Staff may pass any client user_id.';

grant execute on function public.get_active_packages(uuid) to authenticated;
