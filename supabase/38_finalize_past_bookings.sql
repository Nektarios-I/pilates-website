-- =============================================================================
-- 38_finalize_past_bookings.sql
-- Marks past non-cancelled bookings as finished (auto session completion).
--
-- PREREQUISITES
--   • Scripts 01–37 applied.
--   • pg_cron enabled (same as 09_cron.sql / 23_recurring_prebook_cron.sql).
--
-- RUN ORDER: After 37_profiles_rls_staff_directory.sql. Safe to re-run.
-- =============================================================================

-- Allow 'finished' as a booking status (past booked sessions that completed).
alter table public.bookings
  drop constraint if exists bookings_status_check;

alter table public.bookings
  add constraint bookings_status_check
  check (status = any (array[
    'booked'::text,
    'waitlisted'::text,
    'cancelled'::text,
    'attended'::text,
    'no_show'::text,
    'finished'::text
  ]));

comment on column public.bookings.status is
  'booked/waitlisted = open; cancelled/no_show = voided; attended = staff-marked presence; finished = session ended without cancel (auto or manual).';

-- ---------------------------------------------------------------------------
-- finalize_past_bookings()
-- Sets status = finished when the linked session has ended and the booking
-- is still booked (not cancelled). Safe to call repeatedly.
-- ---------------------------------------------------------------------------
create or replace function public.finalize_past_bookings()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.bookings b
     set status = 'finished',
         updated_at = now()
    from public.sessions s
   where s.id = b.session_id
     and b.status = 'booked'
     and s.ends_at < now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.finalize_past_bookings() is
  'Marks booked bookings whose session has ended as finished. Returns rows updated.';

revoke all on function public.finalize_past_bookings() from public;
grant execute on function public.finalize_past_bookings() to postgres;
grant execute on function public.finalize_past_bookings() to service_role;
grant execute on function public.finalize_past_bookings() to authenticated;

-- One-shot backfill for existing past booked rows.
select public.finalize_past_bookings();

-- Hourly catch-up (idempotent unschedule + schedule).
do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
    from cron.job
   where jobname = 'finalize-past-bookings-hourly';

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
    raise notice 'Removed existing cron job id %', v_job_id;
  end if;
end;
$$;

select cron.schedule(
  'finalize-past-bookings-hourly',
  '15 * * * *',
  $$select public.finalize_past_bookings()$$
);

do $$
begin
  raise notice 'pg_cron job "finalize-past-bookings-hourly" scheduled (minute 15 each hour UTC).';
  raise notice 'Verify: select * from cron.job where jobname = ''finalize-past-bookings-hourly'';';
  raise notice 'Manual run: select public.finalize_past_bookings();';
end;
$$;
