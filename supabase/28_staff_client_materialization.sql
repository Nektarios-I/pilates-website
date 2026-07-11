-- =============================================================================
-- 28_staff_client_materialization.sql — Run materialization for one client + exclusions
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- Staff can materialize all recurring occurrences for a client inside the rolling
-- 14-day window, optionally excluding specific occurrences for this run only.
--
-- RUN ORDER: After 27_booking_horizon_recurring_priority_forecast.sql.
-- SAFE TO RE-RUN: Yes (CREATE OR REPLACE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Occurrences eligible for the next materialization run (one client)
-- ---------------------------------------------------------------------------
create or replace function public.list_client_materializable_occurrences(
  p_client_user_id uuid
)
returns table (
  rule_id              uuid,
  rule_label           text,
  session_card_title   text,
  schedule_line_id     uuid,
  occurrence_date      date,
  start_time           time,
  occurrence_starts_at timestamptz,
  booking_state        text,
  failure_message      text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date;
  v_end   date;
begin
  perform private.assert_recurring_staff();

  if not exists (
    select 1 from public.user_roles
     where user_id = p_client_user_id
       and role = 'client'
  ) then
    raise exception 'Target user is not a client account' using errcode = 'P0017';
  end if;

  v_today := private.studio_today();
  v_end := private.public_booking_window_end_date();

  return query
  select
    r.id as rule_id,
    coalesce(r.label, sc.title, 'Recurring rule') as rule_label,
    sc.title as session_card_title,
    sl.id as schedule_line_id,
    d::date as occurrence_date,
    sl.start_time,
    ((d::date + sl.start_time) at time zone 'Europe/Nicosia') as occurrence_starts_at,
    case
      when lg.status = 'succeeded' then 'booked'
      when lg.status = 'failed' then 'failed'
      else 'planned'
    end as booking_state,
    lg.failure_message
  from public.recurring_prebook_rules r
  join public.recurring_prebook_schedule_lines sl
    on sl.rule_id = r.id
   and sl.is_active = true
  join public.session_cards sc on sc.id = r.session_card_id
  cross join generate_series(v_today, v_end, interval '1 day') as d
  left join public.recurring_prebook_materialization_log lg
    on lg.rule_id = r.id
   and lg.schedule_line_id = sl.id
   and lg.occurrence_date = d::date
  where r.client_user_id = p_client_user_id
    and r.status = 'active'
    and sl.day_of_week = extract(isodow from d::date)::integer
    and not exists (
      select 1
        from public.recurring_prebook_skipped_occurrences sk
       where sk.rule_id = r.id
         and sk.occurrence_date = d::date
         and sk.start_time = sl.start_time
    )
    and coalesce(lg.status, 'pending') <> 'succeeded'
  order by occurrence_starts_at asc, r.created_at asc;
end;
$$;

comment on function public.list_client_materializable_occurrences(uuid) is
  'Lists recurring occurrences for a client inside the rolling window that are not yet booked.';

grant execute on function public.list_client_materializable_occurrences(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Materialize one client with optional one-run exclusions
-- Exclusion JSON array: [{"rule_id":"…","occurrence_date":"YYYY-MM-DD","start_time":"HH:MM"}]
-- ---------------------------------------------------------------------------
create or replace function public.staff_materialize_recurring_prebooks_for_client(
  p_client_user_id         uuid,
  p_excluded_occurrences   jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today       date;
  v_end         date;
  v_cursor      date;
  v_rule        record;
  v_line        record;
  v_end_time    time;
  v_starts_at   timestamptz;
  v_ends_at     timestamptz;
  v_log_id      uuid;
  v_processed   integer := 0;
  v_succeeded   integer := 0;
  v_failed      integer := 0;
  v_skipped     integer := 0;
  v_excluded    integer := 0;
  v_log_status      text;
  v_failure_message text;
  v_failures        jsonb := '[]'::jsonb;
begin
  perform private.assert_recurring_staff();
  perform private.assert_client_user(p_client_user_id);

  perform pg_advisory_xact_lock(hashtext('materialize_recurring_prebooks'));

  v_today := private.studio_today();
  v_end := private.public_booking_window_end_date();

  for v_rule in
    select r.id as rule_id
      from public.recurring_prebook_rules r
     where r.status = 'active'
       and r.client_user_id = p_client_user_id
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
            from jsonb_array_elements(coalesce(p_excluded_occurrences, '[]'::jsonb)) elem
           where (elem->>'rule_id')::uuid = v_rule.rule_id
             and (elem->>'occurrence_date')::date = v_cursor
             and (elem->>'start_time')::time = v_line.start_time
        ) then
          v_excluded := v_excluded + 1;
          continue;
        end if;

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

        v_end_time := private.schedule_line_end_time(v_line.start_time, v_line.duration_minutes);
        v_starts_at := (v_cursor + v_line.start_time) at time zone 'Europe/Nicosia';
        v_ends_at := (v_cursor + v_end_time) at time zone 'Europe/Nicosia';

        if exists (
          select 1
            from public.recurring_prebook_materialization_log lg
           where lg.rule_id = v_rule.rule_id
             and lg.occurrence_starts_at = v_starts_at
             and lg.status = 'succeeded'
        ) then
          continue;
        end if;

        v_processed := v_processed + 1;

        v_log_id := private.materialize_recurring_occurrence(
          v_rule.rule_id,
          v_line.line_id,
          v_cursor,
          v_starts_at,
          v_ends_at,
          null
        );

        select status, failure_message
          into v_log_status, v_failure_message
          from public.recurring_prebook_materialization_log
         where id = v_log_id;

        if v_log_status = 'succeeded' then
          v_succeeded := v_succeeded + 1;
        elsif v_log_status = 'failed' then
          v_failed := v_failed + 1;
          v_failures := v_failures || jsonb_build_array(
            jsonb_build_object(
              'rule_id', v_rule.rule_id,
              'occurrence_date', v_cursor,
              'start_time', v_line.start_time,
              'occurrence_starts_at', v_starts_at,
              'failure_message', v_failure_message
            )
          );
        end if;
      end loop;
    end loop;
  end loop;

  return jsonb_build_object(
    'processed', v_processed,
    'succeeded', v_succeeded,
    'failed', v_failed,
    'skipped', v_skipped,
    'excluded', v_excluded,
    'window_start', v_today,
    'window_end', v_end,
    'failures', v_failures
  );
end;
$$;

comment on function public.staff_materialize_recurring_prebooks_for_client(uuid, jsonb) is
  'Materializes recurring prebooks for one client in the rolling 14-day window. Optional one-run exclusions.';

grant execute on function public.staff_materialize_recurring_prebooks_for_client(uuid, jsonb)
  to authenticated;
