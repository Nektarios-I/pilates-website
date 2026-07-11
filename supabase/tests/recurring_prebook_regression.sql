-- =============================================================================
-- recurring_prebook_regression.sql — Manual regression for migrations 22–23
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- Run after 22_recurring_prebook_functions.sql on dev/staging.
-- Adapt UUIDs to your seed users/packages/session cards.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Sanity: required objects exist
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'materialize_recurring_prebooks') then
    raise exception 'FAIL: run 22_recurring_prebook_functions.sql first';
  end if;

  if not exists (select 1 from pg_proc where proname = 'retry_recurring_materialization') then
    raise exception 'FAIL: retry_recurring_materialization missing';
  end if;

  raise notice 'PASS: recurring RPC objects present';
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Staff rule CRUD (run as instructor/owner/admin JWT)
-- ---------------------------------------------------------------------------
-- select public.create_recurring_prebook_rule(
--   '<client_uuid>', '<session_card_uuid>', 'Weekly reformer');
-- select public.add_recurring_prebook_schedule_line(
--   '<rule_uuid>', 1, '18:00'::time, 60, 0);
-- select * from public.list_recurring_prebook_rules('<client_uuid>');
-- select * from public.get_recurring_prebook_forecast('<rule_uuid>');
-- expect: health_status ready or insufficient_tokens; no bookings created

-- ---------------------------------------------------------------------------
-- 2. Materialization window (14 days only)
-- ---------------------------------------------------------------------------
-- select public.staff_materialize_recurring_prebooks();
-- expect JSON with window_start = studio today, window_end = today + 14
-- select max(occurrence_date) from recurring_prebook_materialization_log;
-- expect <= private.recurring_window_end_date()

-- ---------------------------------------------------------------------------
-- 3. Idempotent re-run
-- ---------------------------------------------------------------------------
-- Run staff_materialize_recurring_prebooks() twice.
-- expect: succeeded count stable; no duplicate bookings for same occurrence_starts_at

-- ---------------------------------------------------------------------------
-- 4. Capacity full → failed log, not waitlist
-- ---------------------------------------------------------------------------
-- Fill session to capacity, run materialize for client with recurring rule on that slot.
-- expect: log status=failed, failure_code=capacity_full
-- expect: no waitlisted booking row for that client/session

-- ---------------------------------------------------------------------------
-- 5. Provenance on success
-- ---------------------------------------------------------------------------
-- select b.booking_source, b.created_by_user_id, b.recurring_materialization_log_id
--   from bookings b
--  where b.booking_source = 'recurring'
--  order by b.booked_at desc limit 1;
-- expect: booking_source=recurring, created_by_user_id is null, log id set

-- ---------------------------------------------------------------------------
-- 6. Retry after resolving blocker
-- ---------------------------------------------------------------------------
-- select public.retry_recurring_materialization('<failed_log_uuid>');
-- expect: status succeeded if tokens/capacity now available; attempt_count incremented

-- ---------------------------------------------------------------------------
-- 7. Skip occurrence
-- ---------------------------------------------------------------------------
-- select public.add_recurring_prebook_skip('<rule_uuid>', '<date>', '18:00'::time, 'away');
-- run materialize; expect no log/booking for that occurrence

-- ---------------------------------------------------------------------------
-- 8. Client blocked from staff RPCs
-- ---------------------------------------------------------------------------
-- As client JWT: select public.create_recurring_prebook_rule(...);
-- expect: ERROR P0011

-- ---------------------------------------------------------------------------
-- 9. Deactivate rule stops future materialization
-- ---------------------------------------------------------------------------
-- select public.deactivate_recurring_prebook_rule('<rule_uuid>');
-- run materialize; expect no new logs for that rule

-- ---------------------------------------------------------------------------
-- Window helper check
-- ---------------------------------------------------------------------------
select
  private.studio_today() as window_start,
  private.recurring_window_end_date() as window_end,
  private.recurring_materialization_horizon_days() as horizon_days;
