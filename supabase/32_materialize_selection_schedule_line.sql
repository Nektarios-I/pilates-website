-- =============================================================================
-- 32_materialize_selection_schedule_line.sql — Reliable selection matching
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- • Accept schedule_line_id in materialize selection payload (preferred)
-- • Normalize occurrence_date / start_time before matching schedule lines
-- • Clearer P0035 detail when selection rows fail validation
--
-- RUN ORDER: After 31_materialize_selection_atomic.sql.
-- SAFE TO RE-RUN: Yes (CREATE OR REPLACE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Normalize RPC time strings (HH:MM, HH:MM:SS, or ISO fragments)
-- ---------------------------------------------------------------------------
create or replace function private.normalize_occurrence_time(p_value text)
returns time
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_match text[];
begin
  if p_value is null or btrim(p_value) = '' then
    raise exception 'start_time is required' using errcode = 'P0035';
  end if;

  v_match := regexp_match(btrim(p_value), '([01][0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?');

  if v_match is null then
    raise exception 'Invalid start_time value: %', p_value using errcode = 'P0035';
  end if;

  return make_time(
    v_match[1]::integer,
    v_match[2]::integer,
    coalesce(v_match[3], '00')::integer
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Normalize RPC date strings (YYYY-MM-DD or ISO timestamp prefix)
-- ---------------------------------------------------------------------------
create or replace function private.normalize_occurrence_date(p_value text)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_date date;
begin
  if p_value is null or btrim(p_value) = '' then
    raise exception 'occurrence_date is required' using errcode = 'P0035';
  end if;

  begin
    v_date := left(btrim(p_value), 10)::date;
  exception
    when others then
      raise exception 'Invalid occurrence_date value: %', p_value using errcode = 'P0035';
  end;

  return v_date;
end;
$$;

-- ---------------------------------------------------------------------------
-- staff_materialize_client_recurring_selection — schedule_line_id aware
-- ---------------------------------------------------------------------------
create or replace function public.staff_materialize_client_recurring_selection(
  p_client_user_id uuid,
  p_occurrences      jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today           date;
  v_end             date;
  v_reformer_pool   integer;
  v_mat_pool        integer;
  v_sel             record;
  v_occ             record;
  v_log             public.recurring_prebook_materialization_log%rowtype;
  v_log_id          uuid;
  v_log_status      text;
  v_booking_id      uuid;
  v_booking_ids     uuid[] := '{}';
  v_token_health    text;
  v_selection_count integer;
  v_expected_count  integer;
begin
  perform private.assert_recurring_staff();
  perform private.assert_client_user(p_client_user_id);

  if p_occurrences is null
     or jsonb_typeof(p_occurrences) <> 'array'
     or jsonb_array_length(p_occurrences) = 0 then
    raise exception 'Select at least one occurrence to materialize' using errcode = 'P0034';
  end if;

  v_expected_count := jsonb_array_length(p_occurrences);

  perform pg_advisory_xact_lock(hashtext('materialize_recurring_prebooks'));

  v_today := private.studio_today();
  v_end := private.public_booking_window_end_date();

  create temp table tmp_selected_occurrences (
    rule_id uuid not null,
    occurrence_date date not null,
    start_time time not null,
    schedule_line_id uuid,
    occurrence_starts_at timestamptz,
    occurrence_ends_at timestamptz,
    reformer_credits_required integer not null,
    mat_credits_required integer not null,
    primary key (rule_id, occurrence_date, start_time)
  ) on commit drop;

  insert into tmp_selected_occurrences (
    rule_id,
    occurrence_date,
    start_time,
    schedule_line_id,
    occurrence_starts_at,
    occurrence_ends_at,
    reformer_credits_required,
    mat_credits_required
  )
  select
    r.id,
    private.normalize_occurrence_date(elem->>'occurrence_date'),
    sl.start_time,
    sl.id,
    (private.normalize_occurrence_date(elem->>'occurrence_date') + sl.start_time)
      at time zone 'Europe/Nicosia',
    (private.normalize_occurrence_date(elem->>'occurrence_date')
      + private.schedule_line_end_time(sl.start_time, sl.duration_minutes))
      at time zone 'Europe/Nicosia',
    sc.reformer_credits_required,
    sc.mat_credits_required
  from jsonb_array_elements(p_occurrences) elem
  join public.recurring_prebook_rules r
    on r.id = (elem->>'rule_id')::uuid
   and r.client_user_id = p_client_user_id
   and r.status = 'active'
  join public.recurring_prebook_schedule_lines sl
    on sl.rule_id = r.id
   and sl.is_active = true
   and (
     (
       nullif(elem->>'schedule_line_id', '') is not null
       and sl.id = (elem->>'schedule_line_id')::uuid
     )
     or (
       nullif(elem->>'schedule_line_id', '') is null
       and sl.start_time = private.normalize_occurrence_time(elem->>'start_time')
       and sl.day_of_week = extract(
         isodow from private.normalize_occurrence_date(elem->>'occurrence_date')
       )::integer
     )
   )
  join public.session_cards sc on sc.id = r.session_card_id;

  select count(*) into v_selection_count from tmp_selected_occurrences;

  if v_selection_count <> v_expected_count then
    raise exception
      'One or more selected occurrences are invalid or no longer available (% of % matched). Refresh the dialog and try again.',
      v_selection_count,
      v_expected_count
      using errcode = 'P0035';
  end if;

  if exists (
    select 1
      from tmp_selected_occurrences s
     where s.occurrence_date < v_today
        or s.occurrence_date > v_end
  ) then
    raise exception 'One or more selected occurrences are outside the booking window'
      using errcode = 'P0014';
  end if;

  if exists (
    select 1
      from tmp_selected_occurrences s
      join public.recurring_prebook_skipped_occurrences sk
        on sk.rule_id = s.rule_id
       and sk.occurrence_date = s.occurrence_date
       and sk.start_time = s.start_time
  ) then
    raise exception 'One or more selected occurrences are permanently skipped'
      using errcode = 'P0025';
  end if;

  if exists (
    select 1
      from tmp_selected_occurrences s
      join public.recurring_prebook_materialization_log lg
        on lg.rule_id = s.rule_id
       and lg.occurrence_starts_at = s.occurrence_starts_at
     where private.recurring_log_has_active_booking(lg)
  ) then
    raise exception 'One or more selected occurrences are already booked'
      using errcode = 'P0013';
  end if;

  v_reformer_pool := private.client_simulated_credit_pool(p_client_user_id, 'reformer');
  v_mat_pool := private.client_simulated_credit_pool(p_client_user_id, 'mat');

  create temp table tmp_client_occ_token_map (
    rule_id uuid,
    occurrence_date date,
    start_time time,
    occurrence_starts_at timestamptz,
    is_selected boolean not null,
    token_health text
  ) on commit drop;

  for v_occ in
    select
      r.id as rule_id,
      d::date as occurrence_date,
      sl.start_time,
      ((d::date + sl.start_time) at time zone 'Europe/Nicosia') as occurrence_starts_at,
      sc.reformer_credits_required,
      sc.mat_credits_required
    from public.recurring_prebook_rules r
    join public.recurring_prebook_schedule_lines sl
      on sl.rule_id = r.id
     and sl.is_active = true
    join public.session_cards sc on sc.id = r.session_card_id
    cross join generate_series(v_today, v_end, interval '1 day') as d
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
    order by occurrence_starts_at asc, r.created_at asc
  loop
    select lg.* into v_log
      from public.recurring_prebook_materialization_log lg
     where lg.rule_id = v_occ.rule_id
       and lg.occurrence_starts_at = v_occ.occurrence_starts_at
     limit 1;

    v_token_health := null;

    if found and private.recurring_log_has_active_booking(v_log) then
      v_token_health := 'ok';
    else
      select t.reformer_pool, t.mat_pool, t.token_health
        into v_reformer_pool, v_mat_pool, v_token_health
        from private.try_allocate_forecast_tokens(
          v_reformer_pool,
          v_mat_pool,
          v_occ.reformer_credits_required,
          v_occ.mat_credits_required
        ) t;
    end if;

    insert into tmp_client_occ_token_map (
      rule_id,
      occurrence_date,
      start_time,
      occurrence_starts_at,
      is_selected,
      token_health
    )
    values (
      v_occ.rule_id,
      v_occ.occurrence_date,
      v_occ.start_time,
      v_occ.occurrence_starts_at,
      exists (
        select 1
          from tmp_selected_occurrences s
         where s.rule_id = v_occ.rule_id
           and s.occurrence_date = v_occ.occurrence_date
           and s.start_time = v_occ.start_time
      ),
      v_token_health
    );
  end loop;

  if exists (
    select 1
      from tmp_client_occ_token_map m
     where m.is_selected
       and coalesce(m.token_health, 'insufficient_tokens') <> 'ok'
  ) then
    raise exception
      'Not enough credits for all selected occurrences. Uncheck classes marked insufficient tokens or add credits.'
      using errcode = 'P0037';
  end if;

  for v_sel in
    select *
      from tmp_selected_occurrences
     order by occurrence_starts_at asc, rule_id asc
  loop
    v_log_id := private.materialize_recurring_occurrence(
      v_sel.rule_id,
      v_sel.schedule_line_id,
      v_sel.occurrence_date,
      v_sel.occurrence_starts_at,
      v_sel.occurrence_ends_at,
      null
    );

    select lg.booking_id, lg.status
      into v_booking_id, v_log_status
      from public.recurring_prebook_materialization_log lg
     where lg.id = v_log_id;

    if v_log_status <> 'succeeded' or v_booking_id is null then
      raise exception 'Materialization failed for occurrence at %', v_sel.occurrence_starts_at
        using errcode = 'P0036';
    end if;

    v_booking_ids := array_append(v_booking_ids, v_booking_id);
  end loop;

  return jsonb_build_object(
    'booking_ids', to_jsonb(v_booking_ids),
    'succeeded', coalesce(array_length(v_booking_ids, 1), 0),
    'processed', coalesce(array_length(v_booking_ids, 1), 0),
    'failed', 0,
    'skipped', 0,
    'excluded', 0,
    'window_start', v_today,
    'window_end', v_end,
    'failures', '[]'::jsonb
  );
end;
$$;

comment on function public.staff_materialize_client_recurring_selection(uuid, jsonb) is
  'Atomically materializes staff-selected recurring occurrences. Accepts schedule_line_id for reliable matching.';

grant execute on function public.staff_materialize_client_recurring_selection(uuid, jsonb) to authenticated;
