-- Record the account that cancels a booking.
-- Future cancels store auth.uid(). Existing cancelled rows are filled from a
-- client self-cancel reason or a unique recurring skip, otherwise marked as
-- unrecorded because actor tracking started after those cancels.

begin;

alter table public.bookings
  add column if not exists cancelled_by_user_id uuid
    references public.profiles(id) on delete set null,
  add column if not exists cancellation_actor_note text;

alter table public.bookings
  drop constraint if exists bookings_cancellation_actor_note_known;

alter table public.bookings
  add constraint bookings_cancellation_actor_note_known
  check (
    cancellation_actor_note is null
    or cancellation_actor_note in (
      'Backfilled from client self-cancel reason',
      'Backfilled from recurring skip',
      'Not recorded before 2026-10-26'
    )
  );

comment on column public.bookings.cancelled_by_user_id is
  'Account that cancelled the booking. Null when the account was not recorded.';

comment on column public.bookings.cancellation_actor_note is
  'How a historical cancelling account was recovered. Null when auth.uid() was stored at cancel time.';

create index if not exists idx_bookings_cancelled_by_user_id
  on public.bookings (cancelled_by_user_id)
  where cancelled_by_user_id is not null;

-- ---------------------------------------------------------------------------
-- cancel_booking — same rules as 40, plus the cancelling account
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
  v_is_staff          boolean;
  v_is_recurring      boolean;
  v_log               public.recurring_prebook_materialization_log%rowtype;
  v_start_time        time;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  v_is_staff := (select private.is_staff());

  select * into v_booking
    from public.bookings
   where id = p_booking_id
     for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0010';
  end if;

  if v_booking.user_id != v_user_id then
    if not v_is_staff then
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
     and not v_is_staff
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
     set status                  = 'cancelled',
         cancelled_at            = now(),
         cancellation_reason     = p_reason,
         cancelled_by_user_id    = v_user_id,
         cancellation_actor_note = null
   where id = p_booking_id
  returning * into v_cancelled;

  v_is_recurring := v_booking.booking_source = 'recurring'
    or v_booking.recurring_materialization_log_id is not null;

  if v_is_recurring and v_is_staff then
    select lg.* into v_log
      from public.recurring_prebook_materialization_log lg
     where lg.id = v_booking.recurring_materialization_log_id
        or lg.booking_id = p_booking_id
     order by case when lg.id = v_booking.recurring_materialization_log_id then 0 else 1 end
     limit 1;

    if found then
      select sl.start_time into v_start_time
        from public.recurring_prebook_schedule_lines sl
       where sl.id = v_log.schedule_line_id;

      if v_start_time is null then
        v_start_time := (v_log.occurrence_starts_at at time zone 'Europe/Nicosia')::time;
      end if;

      insert into public.recurring_prebook_skipped_occurrences (
        rule_id, occurrence_date, start_time, skipped_by, reason
      )
      values (
        v_log.rule_id,
        v_log.occurrence_date,
        v_start_time,
        v_user_id,
        coalesce(p_reason, 'Cancelled by staff')
      )
      on conflict (rule_id, occurrence_date, start_time) do nothing;

      update public.recurring_prebook_materialization_log
         set status          = 'skipped',
             health_status   = null,
             booking_id      = null,
             failure_code    = 'staff_cancelled',
             failure_message = coalesce(p_reason, 'Skipped after staff cancellation')
       where id = v_log.id;
    end if;
  elsif v_is_recurring then
    delete from public.recurring_prebook_materialization_log lg
     where lg.booking_id = p_booking_id
        or (
          v_booking.recurring_materialization_log_id is not null
          and lg.id = v_booking.recurring_materialization_log_id
        );
  end if;

  return v_cancelled;
end;
$$;

comment on function public.cancel_booking is
  'Cancels a booking, refunds credits, and stores auth.uid() as cancelled_by_user_id. Staff cancel of recurring bookings permanently skips that occurrence. Client self-cancel of recurring clears the log for rematerialize. Client self-cancel blocked within 4 hours (P0029).';

-- Client self-cancel stored the client as the reason text, not a user id.
update public.bookings
   set cancelled_by_user_id = user_id,
       cancellation_actor_note = 'Backfilled from client self-cancel reason'
 where status = 'cancelled'
   and cancellation_reason = 'Cancelled by client'
   and cancelled_by_user_id is null;

-- Recurring staff cancels stored the account on the skip row.
with matches as (
  select
    b.id as booking_id,
    min(sk.skipped_by::text)::uuid as skipped_by,
    count(distinct sk.skipped_by) as actor_count
  from public.bookings b
  join public.sessions s on s.id = b.session_id
  join public.recurring_prebook_rules r on r.client_user_id = b.user_id
  join public.recurring_prebook_skipped_occurrences sk
    on sk.rule_id = r.id
   and sk.occurrence_date = (s.starts_at at time zone 'Europe/Nicosia')::date
   and sk.start_time::time(0) = (s.starts_at at time zone 'Europe/Nicosia')::time(0)
  where b.status = 'cancelled'
    and b.cancelled_by_user_id is null
    and (
      b.booking_source = 'recurring'
      or b.recurring_materialization_log_id is not null
    )
  group by b.id
)
update public.bookings b
   set cancelled_by_user_id = matches.skipped_by,
       cancellation_actor_note = 'Backfilled from recurring skip'
  from matches
 where b.id = matches.booking_id
   and matches.actor_count = 1;

update public.bookings
   set cancellation_actor_note = 'Not recorded before 2026-10-26'
 where status = 'cancelled'
   and cancelled_by_user_id is null
   and cancellation_actor_note is null;

do $$
begin
  if exists (
    select 1
      from public.bookings
     where status = 'cancelled'
       and cancelled_by_user_id is null
       and cancellation_actor_note is distinct from 'Not recorded before 2026-10-26'
  ) then
    raise exception 'A cancelled booking was left without an account or the historical note';
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
