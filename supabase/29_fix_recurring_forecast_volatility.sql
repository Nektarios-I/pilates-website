-- =============================================================================
-- 29_fix_recurring_forecast_volatility.sql
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- Fixes: CREATE TABLE AS is not allowed in a non-volatile function
-- get_recurring_prebook_forecast used STABLE + temp tables (invalid in PostgreSQL).
--
-- RUN ORDER: After 27 (and 28 if applied).
-- SAFE TO RE-RUN: Yes.
-- =============================================================================

drop function if exists public.get_recurring_prebook_forecast(uuid);

-- Recreate from migration 27 with VOLATILE (required for temp-table token simulation).
create or replace function public.get_recurring_prebook_forecast(
  p_rule_id uuid
)
returns table (
  rule_id              uuid,
  schedule_line_id     uuid,
  occurrence_date      date,
  start_time           time,
  occurrence_starts_at timestamptz,
  occurrence_ends_at   timestamptz,
  booking_state        text,
  token_health         text,
  health_status        text,
  log_status           text,
  failure_code         text,
  failure_message      text
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_rule           public.recurring_prebook_rules%rowtype;
  v_today          date;
  v_end            date;
  v_reformer_pool  integer;
  v_mat_pool       integer;
  v_occ            record;
  v_token_health   text;
  v_booking_state  text;
  v_log            public.recurring_prebook_materialization_log%rowtype;
begin
  perform private.assert_recurring_staff();

  select * into v_rule
    from public.recurring_prebook_rules
   where id = p_rule_id;

  if not found then
    raise exception 'Recurring rule not found' using errcode = 'P0019';
  end if;

  v_today := private.studio_today();
  v_end := private.public_booking_window_end_date();
  v_reformer_pool := private.client_simulated_credit_pool(v_rule.client_user_id, 'reformer');
  v_mat_pool := private.client_simulated_credit_pool(v_rule.client_user_id, 'mat');

  create temp table tmp_client_recurring_occurrences on commit drop as
  select
    r.id as rule_id,
    r.client_user_id,
    sl.id as schedule_line_id,
    d::date as occurrence_date,
    sl.start_time,
    sl.duration_minutes,
    sc.reformer_credits_required,
    sc.mat_credits_required,
    ((d::date + sl.start_time) at time zone 'Europe/Nicosia') as occurrence_starts_at,
    ((d::date + private.schedule_line_end_time(sl.start_time, sl.duration_minutes))
      at time zone 'Europe/Nicosia') as occurrence_ends_at
  from public.recurring_prebook_rules r
  join public.recurring_prebook_schedule_lines sl
    on sl.rule_id = r.id
   and sl.is_active = true
  join public.session_cards sc on sc.id = r.session_card_id
  cross join generate_series(v_today, v_end, interval '1 day') as d
  where r.client_user_id = v_rule.client_user_id
    and r.status = 'active'
    and sl.day_of_week = extract(isodow from d::date)::integer
    and not exists (
      select 1
        from public.recurring_prebook_skipped_occurrences sk
       where sk.rule_id = r.id
         and sk.occurrence_date = d::date
         and sk.start_time = sl.start_time
    )
  order by occurrence_starts_at asc, r.created_at asc, sl.sort_order asc;

  create temp table tmp_client_token_health (
    rule_id uuid,
    schedule_line_id uuid,
    occurrence_starts_at timestamptz,
    booking_state text,
    token_health text
  ) on commit drop;

  for v_occ in
    select *
      from tmp_client_recurring_occurrences
     order by occurrence_starts_at asc, rule_id asc
  loop
    select lg.* into v_log
      from public.recurring_prebook_materialization_log lg
     where lg.rule_id = v_occ.rule_id
       and lg.occurrence_starts_at = v_occ.occurrence_starts_at
     limit 1;

    if found and v_log.status = 'succeeded' then
      v_booking_state := 'booked';
      v_token_health := 'ok';
    elsif found and v_log.status = 'failed' then
      v_booking_state := 'failed';
      v_token_health := null;
    else
      v_booking_state := 'planned';
      select t.reformer_pool, t.mat_pool, t.token_health
        into v_reformer_pool, v_mat_pool, v_token_health
        from private.try_allocate_forecast_tokens(
          v_reformer_pool,
          v_mat_pool,
          v_occ.reformer_credits_required,
          v_occ.mat_credits_required
        ) t;
    end if;

    insert into tmp_client_token_health (
      rule_id, schedule_line_id, occurrence_starts_at, booking_state, token_health
    )
    values (
      v_occ.rule_id,
      v_occ.schedule_line_id,
      v_occ.occurrence_starts_at,
      v_booking_state,
      v_token_health
    );
  end loop;

  return query
  select
    o.rule_id,
    o.schedule_line_id,
    o.occurrence_date,
    o.start_time,
    o.occurrence_starts_at,
    o.occurrence_ends_at,
    th.booking_state,
    th.token_health,
    case
      when th.booking_state = 'booked' then 'ready'
      when th.booking_state = 'failed' then 'failed'
      when th.token_health = 'insufficient_tokens' then 'insufficient_tokens'
      else 'ready'
    end as health_status,
    lg.status as log_status,
    lg.failure_code,
    lg.failure_message
  from tmp_client_recurring_occurrences o
  join tmp_client_token_health th
    on th.rule_id = o.rule_id
   and th.schedule_line_id = o.schedule_line_id
   and th.occurrence_starts_at = o.occurrence_starts_at
  left join public.recurring_prebook_materialization_log lg
    on lg.rule_id = o.rule_id
   and lg.occurrence_starts_at = o.occurrence_starts_at
  where o.rule_id = p_rule_id
  order by o.occurrence_starts_at asc;
end;
$$;

comment on function public.get_recurring_prebook_forecast(uuid) is
  '14-day forecast with booking_state and chronological token_health (volatile: uses temp tables).';

grant execute on function public.get_recurring_prebook_forecast(uuid) to authenticated;
