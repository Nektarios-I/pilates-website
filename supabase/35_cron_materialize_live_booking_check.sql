-- =============================================================================
-- 35_cron_materialize_live_booking_check.sql — Align cron skip guard with migration 30
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- Daily cron materialize_recurring_prebooks() previously skipped any occurrence
-- with status=succeeded on the materialization log, even when the booking was
-- cancelled. Migration 30 fixed staff batch materialization only; this aligns cron.
--
-- RUN ORDER: After 34_fix_duplicate_profile_phones.sql
-- SAFE TO RE-RUN: Yes
-- =============================================================================

create or replace function public.materialize_recurring_prebooks()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today     date;
  v_end       date;
  v_cursor    date;
  v_rule      record;
  v_line      record;
  v_end_time  time;
  v_starts_at timestamptz;
  v_ends_at   timestamptz;
  v_log_id    uuid;
  v_processed integer := 0;
  v_succeeded integer := 0;
  v_failed    integer := 0;
  v_skipped   integer := 0;
  v_log_status text;
  v_log       public.recurring_prebook_materialization_log%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext('materialize_recurring_prebooks'));

  v_today := private.studio_today();
  v_end   := private.recurring_window_end_date();

  for v_rule in
    select r.id as rule_id
      from public.recurring_prebook_rules r
     where r.status = 'active'
  loop
    for v_cursor in
      select d::date
        from generate_series(v_today, v_end, interval '1 day') as d
    loop
      for v_line in
        select sl.id as line_id,
               sl.start_time,
               sl.duration_minutes
          from public.recurring_prebook_schedule_lines sl
         where sl.rule_id = v_rule.rule_id
           and sl.is_active = true
           and sl.day_of_week = extract(isodow from v_cursor)::integer
      loop
        if exists (
          select 1
            from public.recurring_prebook_skipped_occurrences sk
           where sk.rule_id = v_rule.rule_id
             and sk.occurrence_date = v_cursor
             and sk.start_time = v_line.start_time
        ) then
          v_skipped := v_skipped + 1;
          continue;
        end if;

        v_end_time  := private.schedule_line_end_time(v_line.start_time, v_line.duration_minutes);
        v_starts_at := (v_cursor + v_line.start_time) at time zone 'Europe/Nicosia';
        v_ends_at   := (v_cursor + v_end_time) at time zone 'Europe/Nicosia';

        select lg.* into v_log
          from public.recurring_prebook_materialization_log lg
         where lg.rule_id = v_rule.rule_id
           and lg.occurrence_starts_at = v_starts_at
         limit 1;

        if found and private.recurring_log_has_active_booking(v_log) then
          continue;
        end if;

        v_processed := v_processed + 1;

        v_log_id := private.materialize_recurring_occurrence(
          v_rule.rule_id,
          v_line.line_id,
          v_cursor,
          v_starts_at,
          v_ends_at,
          case when found then v_log.id else null end
        );

        select status into v_log_status
          from public.recurring_prebook_materialization_log
         where id = v_log_id;

        if v_log_status = 'succeeded' then
          v_succeeded := v_succeeded + 1;
        elsif v_log_status = 'failed' then
          v_failed := v_failed + 1;
        end if;
      end loop;
    end loop;
  end loop;

  return jsonb_build_object(
    'processed', v_processed,
    'succeeded', v_succeeded,
    'failed', v_failed,
    'skipped', v_skipped,
    'window_start', v_today,
    'window_end', v_end
  );
end;
$$;

comment on function public.materialize_recurring_prebooks() is
  'Daily cron batch: materializes recurring occurrences in the rolling window. Skips only live booked occurrences.';
