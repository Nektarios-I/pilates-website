-- =============================================================================
-- 23_recurring_prebook_cron.sql — Scheduled recurring materialization (pg_cron)
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- PREREQUISITES
--   • 22_recurring_prebook_functions.sql applied and verified on dev/staging.
--   • pg_cron enabled: Dashboard → Database → Extensions → pg_cron.
--
-- SCHEDULE
--   Daily at 04:00 UTC (~06:00 Europe/Nicosia standard time).
--   Runs before peak public booking traffic to materialize the rolling 14-day window.
--
-- ROLLOUT
--   Apply 22 first and run supabase/tests/recurring_prebook_regression.sql manually.
--   Apply this script only after materialize_recurring_prebooks() is verified.
--
-- RUN ORDER: After 22_recurring_prebook_functions.sql.
-- SAFE TO RE-RUN: Yes (unschedules then reschedules).
-- =============================================================================

create extension if not exists pg_cron schema extensions;

grant usage on schema cron to postgres;

do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
    from cron.job
   where jobname = 'materialize-recurring-prebooks-daily';

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
    raise notice 'Removed existing cron job id %', v_job_id;
  end if;
end;
$$;

select cron.schedule(
  'materialize-recurring-prebooks-daily',
  '0 4 * * *',
  $$select public.materialize_recurring_prebooks()$$
);

do $$
begin
  raise notice 'pg_cron job "materialize-recurring-prebooks-daily" scheduled (04:00 UTC daily).';
  raise notice 'Verify: select * from cron.job where jobname = ''materialize-recurring-prebooks-daily'';';
  raise notice 'Manual run: select public.staff_materialize_recurring_prebooks(); -- staff JWT';
  raise notice 'Or as postgres: select public.materialize_recurring_prebooks();';
end;
$$;
