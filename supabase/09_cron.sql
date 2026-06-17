-- =============================================================================
-- 09_cron.sql  —  Scheduled Jobs (pg_cron)
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- WHAT THIS SCRIPT DOES
--   Enables the pg_cron extension and schedules the expire_packages() job
--   to run once per day. Without this, packages that pass their expiry date
--   will remain status='active' until the function is called manually.
--
-- PREREQUISITES
--   • 01_schema.sql and 03_functions.sql must have been applied first.
--   • pg_cron must be enabled in your Supabase project settings.
--     Supabase Dashboard → Database → Extensions → search "cron" → enable.
--
-- RUN ORDER: Run after 03_functions.sql. Safe to re-run (uses ON CONFLICT).
--
-- VERIFY AFTER RUNNING:
--   select * from cron.job;
-- =============================================================================

-- Enable pg_cron (Supabase bundles it; only needs enabling once per project)
create extension if not exists pg_cron schema extensions;

-- Grant usage so the cron scheduler can call functions in the public schema
grant usage on schema cron to postgres;

-- ---------------------------------------------------------------------------
-- Job: expire-packages-daily
--
-- Runs at 02:00 UTC every day.
-- Marks all user_packages where expires_at < now() as status='expired'.
-- Returns the count of rows updated (visible in cron.job_run_details).
--
-- Adjust the schedule using standard cron syntax:
--   '0 2 * * *'   = 02:00 UTC daily (current setting)
--   '*/30 * * * *' = every 30 minutes (for testing)
-- ---------------------------------------------------------------------------
select cron.schedule(
  'expire-packages-daily',          -- job name (unique key)
  '0 2 * * *',                      -- cron schedule: daily at 02:00 UTC
  $$ select public.expire_packages() $$
)
on conflict (jobname)
do update set schedule = excluded.schedule;  -- update schedule if job already exists

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
do $$
begin
  raise notice 'pg_cron job "expire-packages-daily" scheduled. Verify with: select * from cron.job;';
end;
$$;
