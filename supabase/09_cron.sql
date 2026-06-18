-- =============================================================================
-- 09_cron.sql  —  Scheduled Jobs (pg_cron)
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- PREREQUISITES
--   • 01_schema.sql and 03_functions.sql applied.
--   • pg_cron enabled: Dashboard → Database → Extensions → pg_cron.
--
-- RUN ORDER: After 03_functions.sql. Safe to re-run (unschedules then reschedules).
-- =============================================================================

create extension if not exists pg_cron schema extensions;

grant usage on schema cron to postgres;

-- Idempotent: remove existing job before scheduling (cron.schedule has no ON CONFLICT).
do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
    from cron.job
   where jobname = 'expire-packages-daily';

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
    raise notice 'Removed existing cron job id %', v_job_id;
  end if;
end;
$$;

select cron.schedule(
  'expire-packages-daily',
  '0 2 * * *',
  $$select public.expire_packages()$$
);

do $$
begin
  raise notice 'pg_cron job "expire-packages-daily" scheduled. Verify: select * from cron.job;';
end;
$$;
