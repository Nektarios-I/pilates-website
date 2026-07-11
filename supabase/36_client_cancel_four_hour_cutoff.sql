-- =============================================================================
-- 36_client_cancel_four_hour_cutoff.sql — Client cancel cutoff 2h → 4h
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- Updates cancel_booking (P0029) to block client self-cancel within 4 hours
-- of class start. Staff may still cancel anytime.
--
-- RUN ORDER: After 35_cron_materialize_live_booking_check.sql
-- SAFE TO RE-RUN: Yes
-- =============================================================================

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
     and v_session_starts_at <= now() + interval '4 hours' then
    raise exception
      'Cancellations must be made more than 4 hours before class start'
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

  delete from public.recurring_prebook_materialization_log lg
   where lg.booking_id = p_booking_id
      or (
        v_booking.recurring_materialization_log_id is not null
        and lg.id = v_booking.recurring_materialization_log_id
      );

  return v_cancelled;
end;
$$;

comment on function public.cancel_booking is
  'Cancels a booking and refunds credits. Clears recurring materialization log when applicable. Client self-cancel blocked within 4 hours (P0029).';
