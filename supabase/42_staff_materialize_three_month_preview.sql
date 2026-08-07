-- =============================================================================
-- 42_staff_materialize_three_month_preview.sql
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- Staff "Materialize Now" lists and books occurrences across each schedule
-- line's three-calendar-month preview (same range as Planned sessions UI).
-- Daily cron materialization remains the rolling 14-day window.
-- Insufficient credits behavior unchanged (P0037 / dialog block).
--
-- RUN ORDER: After 41_staff_manual_uncapped_recurring_first_occurrence.sql.
-- SAFE TO RE-RUN: Yes.
-- =============================================================================

create or replace function private.recurring_preview_end_date(p_first_occurrence date)
returns date
language sql
immutable
set search_path = ''
as $$
  select (p_first_occurrence + interval '3 months')::date;
$$;

comment on function private.recurring_preview_end_date(date) is
  'Inclusive end of the three-calendar-month recurring preview from a first occurrence date.';

create or replace function private.staff_materialize_window_end_date()
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select private.recurring_preview_end_date(private.studio_today());
$$;

comment on function private.staff_materialize_window_end_date() is
  'Display/helper end date for staff Materialize Now (studio today + 3 calendar months).';


create or replace function private.materialize_recurring_occurrence(
  p_rule_id              uuid,
  p_schedule_line_id     uuid,
  p_occurrence_date      date,
  p_occurrence_starts_at timestamptz,
  p_occurrence_ends_at   timestamptz,
  p_existing_log_id      uuid default null,
  p_raise_on_failure     boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rule            public.recurring_prebook_rules%rowtype;
  v_line            public.recurring_prebook_schedule_lines%rowtype;
  v_card            public.session_cards%rowtype;
  v_log_id          uuid;
  v_log             public.recurring_prebook_materialization_log%rowtype;
  v_session_id      uuid;
  v_start_text      text;
  v_end_text        text;
  v_reformer_pkg    uuid;
  v_mat_pkg         uuid;
  v_has_tokens      boolean;
  v_booking         public.bookings;
  v_failure_code    text;
  v_failure_message text;
begin
  select * into v_rule
    from public.recurring_prebook_rules
   where id = p_rule_id
     and status = 'active';

  if not found then
    if p_raise_on_failure then
      raise exception 'Recurring rule not found or inactive' using errcode = 'P0019';
    end if;
    return p_existing_log_id;
  end if;

  select * into v_line
    from public.recurring_prebook_schedule_lines
   where id = p_schedule_line_id
     and rule_id = p_rule_id
     and is_active = true;

  if not found then
    if p_raise_on_failure then
      raise exception 'Schedule line not found' using errcode = 'P0024';
    end if;
    return p_existing_log_id;
  end if;

  if p_occurrence_date < v_line.first_occurrence_date then
    if p_raise_on_failure then
      raise exception 'Occurrence is before the schedule line first occurrence date'
        using errcode = 'P0038';
    end if;
    return p_existing_log_id;
  end if;

  if p_occurrence_date < private.studio_today() then
    if p_raise_on_failure then
      raise exception 'Occurrence is outside the booking window' using errcode = 'P0014';
    end if;
    return p_existing_log_id;
  end if;

  -- Staff Materialize Now may book through the three-calendar-month preview end.
  -- Daily cron still only iterates the rolling 14-day window.
  if p_occurrence_date > private.recurring_preview_end_date(v_line.first_occurrence_date) then
    if p_raise_on_failure then
      raise exception 'Occurrence is outside the booking window' using errcode = 'P0014';
    end if;
    return p_existing_log_id;
  end if;

  if exists (
    select 1
      from public.recurring_prebook_skipped_occurrences sk
     where sk.rule_id = p_rule_id
       and sk.occurrence_date = p_occurrence_date
       and sk.start_time = v_line.start_time
  ) then
    if p_existing_log_id is not null then
      update public.recurring_prebook_materialization_log
         set status = 'skipped',
             booking_id = null,
             failure_code = coalesce(failure_code, 'staff_cancelled'),
             failure_message = coalesce(failure_message, 'Occurrence is permanently skipped')
       where id = p_existing_log_id;
      return p_existing_log_id;
    end if;
    if p_raise_on_failure then
      raise exception 'Occurrence is permanently skipped' using errcode = 'P0025';
    end if;
    return null;
  end if;

  if p_existing_log_id is not null then
    select * into v_log
      from public.recurring_prebook_materialization_log
     where id = p_existing_log_id
       for update;

    if not found then
      if p_raise_on_failure then
        raise exception 'Materialization log not found' using errcode = 'P0027';
      end if;
      return null;
    end if;

    if private.recurring_log_has_active_booking(v_log) then
      return v_log.id;
    end if;

    if v_log.status = 'skipped' then
      return v_log.id;
    end if;

    v_log_id := v_log.id;
  else
    select * into v_log
      from public.recurring_prebook_materialization_log
     where rule_id = p_rule_id
       and occurrence_starts_at = p_occurrence_starts_at
     for update;

    if found then
      if private.recurring_log_has_active_booking(v_log) then
        return v_log.id;
      end if;
      if v_log.status = 'skipped' then
        return v_log.id;
      end if;
      v_log_id := v_log.id;
    else
      insert into public.recurring_prebook_materialization_log (
        rule_id,
        schedule_line_id,
        occurrence_date,
        occurrence_starts_at,
        occurrence_ends_at,
        status,
        attempt_count
      )
      values (
        p_rule_id,
        p_schedule_line_id,
        p_occurrence_date,
        p_occurrence_starts_at,
        p_occurrence_ends_at,
        'pending',
        0
      )
      returning id into v_log_id;
    end if;
  end if;

  update public.recurring_prebook_materialization_log
     set last_attempted_at = now(),
         attempt_count     = attempt_count + 1,
         status            = 'pending',
         health_status     = null,
         failure_code      = null,
         failure_message   = null,
         booking_id        = null,
         materialized_at   = null
   where id = v_log_id;

  select * into v_card
    from public.session_cards
   where id = v_rule.session_card_id
     and is_active = true;

  if not found then
    update public.recurring_prebook_materialization_log
       set status          = 'failed',
           health_status   = 'failed',
           failure_code    = 'session_unavailable',
           failure_message = 'Session card is inactive or missing'
     where id = v_log_id;
    if p_raise_on_failure then
      raise exception 'Session card is inactive or missing' using errcode = 'P0018';
    end if;
    return v_log_id;
  end if;

  select p.reformer_package_id, p.mat_package_id, p.has_sufficient_tokens
    into v_reformer_pkg, v_mat_pkg, v_has_tokens
    from private.pick_client_packages_for_session(
      v_rule.client_user_id,
      v_card.reformer_credits_required,
      v_card.mat_credits_required
    ) p;

  if not v_has_tokens then
    update public.recurring_prebook_materialization_log
       set status          = 'failed',
           health_status   = 'insufficient_tokens',
           failure_code    = 'insufficient_tokens',
           failure_message = 'Client lacks active package credits for this occurrence'
     where id = v_log_id;
    if p_raise_on_failure then
      raise exception 'Client lacks active package credits for this occurrence'
        using errcode = 'P0008';
    end if;
    return v_log_id;
  end if;

  v_start_text := private.time_to_hh24_mi(v_line.start_time);
  v_end_text   := private.time_to_hh24_mi(
    private.schedule_line_end_time(v_line.start_time, v_line.duration_minutes)
  );

  v_session_id := public.ensure_session_slot_at(
    p_occurrence_date,
    v_start_text,
    v_end_text,
    v_card.session_type,
    v_card.capacity,
    v_card.credits_required,
    v_card.reformer_credits_required,
    v_card.mat_credits_required
  );

  v_booking := private.book_session_core(
    v_rule.client_user_id,
    v_session_id,
    v_reformer_pkg,
    v_mat_pkg,
    false,
    false,
    'recurring',
    null,
    v_log_id
  );

  update public.recurring_prebook_materialization_log
     set status          = 'succeeded',
         health_status   = 'ready',
         booking_id      = v_booking.id,
         materialized_at = now(),
         failure_code    = null,
         failure_message = null
   where id = v_log_id;

  return v_log_id;
exception
  when others then
    if v_log_id is not null then
      select f.failure_code, f.failure_message
        into v_failure_code, v_failure_message
        from private.map_booking_exception_to_failure(SQLSTATE, SQLERRM) f;

      update public.recurring_prebook_materialization_log
         set status          = 'failed',
             health_status   = case
               when v_failure_code = 'insufficient_tokens' then 'insufficient_tokens'
               when v_failure_code = 'package_expired' then 'insufficient_tokens'
               else 'failed'
             end,
             failure_code    = v_failure_code,
             failure_message = coalesce(v_failure_message, SQLERRM)
       where id = v_log_id;
    end if;

    if p_raise_on_failure then
      raise;
    end if;
    return v_log_id;
end;
$$;

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
  token_health         text,
  failure_message      text
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_today date;
  v_end   date;
  v_reformer_pool integer;
  v_mat_pool      integer;
  v_occ           record;
  v_log           public.recurring_prebook_materialization_log%rowtype;
  v_booking_state text;
  v_token_health  text;
begin
  perform private.assert_recurring_staff();
  perform private.assert_client_user(p_client_user_id);

  v_today := private.studio_today();
  v_end := private.staff_materialize_window_end_date();
  v_reformer_pool := private.client_simulated_credit_pool(p_client_user_id, 'reformer');
  v_mat_pool := private.client_simulated_credit_pool(p_client_user_id, 'mat');

  create temp table tmp_materializable_occurrences on commit drop as
  select
    r.id as rule_id,
    coalesce(r.label, sc.title, 'Recurring rule') as rule_label,
    sc.title as session_card_title,
    sl.id as schedule_line_id,
    d::date as occurrence_date,
    sl.start_time,
    sc.reformer_credits_required,
    sc.mat_credits_required,
    ((d::date + sl.start_time) at time zone 'Europe/Nicosia') as occurrence_starts_at,
    lg.status as log_status,
    lg.failure_message,
    lg.booking_id
  from public.recurring_prebook_rules r
  join public.recurring_prebook_schedule_lines sl
    on sl.rule_id = r.id
   and sl.is_active = true
  join public.session_cards sc on sc.id = r.session_card_id
  cross join lateral generate_series(
    greatest(v_today, sl.first_occurrence_date),
    private.recurring_preview_end_date(sl.first_occurrence_date),
    interval '1 day'
  ) as d
  left join public.recurring_prebook_materialization_log lg
    on lg.rule_id = r.id
   and lg.occurrence_starts_at = ((d::date + sl.start_time) at time zone 'Europe/Nicosia')
  where r.client_user_id = p_client_user_id
    and r.status = 'active'
    and sl.day_of_week = extract(isodow from d::date)::integer
    and d::date >= sl.first_occurrence_date
    and d::date <= private.recurring_preview_end_date(sl.first_occurrence_date)
    and not exists (
      select 1
        from public.recurring_prebook_skipped_occurrences sk
       where sk.rule_id = r.id
         and sk.occurrence_date = d::date
         and sk.start_time = sl.start_time
    )
    and not (
      lg.status = 'succeeded'
      and lg.booking_id is not null
      and exists (
        select 1
          from public.bookings b
         where b.id = lg.booking_id
           and b.status in ('booked', 'waitlisted')
      )
    )
  order by occurrence_starts_at asc, r.created_at asc;

  create temp table tmp_materializable_token_health (
    rule_id uuid,
    occurrence_starts_at timestamptz,
    booking_state text,
    token_health text
  ) on commit drop;

  for v_occ in
    select *
      from tmp_materializable_occurrences
     order by occurrence_starts_at asc, rule_id asc
  loop
    select lg.* into v_log
      from public.recurring_prebook_materialization_log lg
     where lg.rule_id = v_occ.rule_id
       and lg.occurrence_starts_at = v_occ.occurrence_starts_at
     limit 1;

    if found and private.recurring_log_has_active_booking(v_log) then
      v_booking_state := 'booked';
      v_token_health := 'ok';
    elsif found and v_log.status = 'failed' then
      v_booking_state := 'failed';
      select t.reformer_pool, t.mat_pool, t.token_health
        into v_reformer_pool, v_mat_pool, v_token_health
        from private.try_allocate_forecast_tokens(
          v_reformer_pool,
          v_mat_pool,
          v_occ.reformer_credits_required,
          v_occ.mat_credits_required
        ) t;
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

    insert into tmp_materializable_token_health (
      rule_id, occurrence_starts_at, booking_state, token_health
    )
    values (
      v_occ.rule_id, v_occ.occurrence_starts_at, v_booking_state, v_token_health
    );
  end loop;

  return query
  select
    o.rule_id,
    o.rule_label,
    o.session_card_title,
    o.schedule_line_id,
    o.occurrence_date,
    o.start_time,
    o.occurrence_starts_at,
    th.booking_state,
    th.token_health,
    o.failure_message
  from tmp_materializable_occurrences o
  join tmp_materializable_token_health th
    on th.rule_id = o.rule_id
   and th.occurrence_starts_at = o.occurrence_starts_at
  where th.booking_state in ('planned', 'failed')
  order by o.occurrence_starts_at asc;
end;
$$;

comment on function public.list_client_materializable_occurrences(uuid) is
  'Planned/failed recurring occurrences in each line three-calendar-month preview for staff Materialize Now.';

grant execute on function public.list_client_materializable_occurrences(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- staff_materialize_client_recurring_selection — explicit selection, atomic
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
  v_end := private.staff_materialize_window_end_date();

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
      join public.recurring_prebook_schedule_lines sl
        on sl.id = s.schedule_line_id
     where s.occurrence_date < v_today
        or s.occurrence_date < sl.first_occurrence_date
        or s.occurrence_date > private.recurring_preview_end_date(sl.first_occurrence_date)
  ) then
    raise exception 'One or more selected occurrences are outside the three-month materialize window'
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
    cross join lateral generate_series(
      greatest(v_today, sl.first_occurrence_date),
      private.recurring_preview_end_date(sl.first_occurrence_date),
      interval '1 day'
    ) as d
    where r.client_user_id = p_client_user_id
      and r.status = 'active'
      and sl.day_of_week = extract(isodow from d::date)::integer
      and d::date >= sl.first_occurrence_date
      and d::date <= private.recurring_preview_end_date(sl.first_occurrence_date)
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
