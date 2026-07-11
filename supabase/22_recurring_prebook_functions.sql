-- =============================================================================
-- 22_recurring_prebook_functions.sql — Recurring CRUD, forecast, materialization
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- Staff RPCs for recurring rules, schedule lines, skips, forecast/health,
-- materialize_recurring_prebooks(), and retry_recurring_materialization().
--
-- RUN ORDER: After 21_cancel_booking_staff_auth.sql.
-- SAFE TO RE-RUN: Yes (CREATE OR REPLACE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Constants / helpers
-- ---------------------------------------------------------------------------
create or replace function private.recurring_materialization_horizon_days()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 14;
$$;

create or replace function private.recurring_window_end_date()
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select private.studio_today() + private.recurring_materialization_horizon_days();
$$;

create or replace function private.assert_recurring_staff()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  if not (select private.is_staff()) then
    raise exception 'Not authorised for recurring prebook management'
      using errcode = 'P0011';
  end if;
end;
$$;

create or replace function private.assert_client_user(p_client_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.user_roles
     where user_id = p_client_user_id
       and role = 'client'
  ) then
    raise exception 'Target user is not a client account'
      using errcode = 'P0017';
  end if;
end;
$$;

create or replace function private.schedule_line_end_time(
  p_start_time       time,
  p_duration_minutes integer
)
returns time
language sql
immutable
set search_path = ''
as $$
  select (p_start_time + (p_duration_minutes || ' minutes')::interval)::time;
$$;

create or replace function private.time_to_hh24_mi(p_time time)
returns text
language sql
immutable
set search_path = ''
as $$
  select to_char(p_time, 'HH24:MI');
$$;

-- Map book_session_core / slot errors to materialization failure_code values.
create or replace function private.map_booking_exception_to_failure(
  p_sqlstate text,
  p_message  text
)
returns table (
  failure_code    text,
  failure_message text
)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_msg text := coalesce(p_message, '');
begin
  if v_msg like '%P0008%' or v_msg ilike '%Insufficient%' then
    return query select 'insufficient_tokens'::text, v_msg;
    return;
  end if;

  if v_msg like '%P0015%' or v_msg ilike '%at capacity%' then
    return query select 'capacity_full'::text, v_msg;
    return;
  end if;

  if v_msg like '%P0013%' or v_msg ilike '%time slot%' then
    return query select 'slot_conflict'::text, v_msg;
    return;
  end if;

  if v_msg like '%P0007%' or v_msg ilike '%expired%' then
    return query select 'package_expired'::text, v_msg;
    return;
  end if;

  if v_msg like '%P0014%' then
    return query select 'horizon'::text, v_msg;
    return;
  end if;

  if v_msg like '%P0003%' or v_msg like '%P0004%' or v_msg ilike '%not available%' then
    return query select 'session_unavailable'::text, v_msg;
    return;
  end if;

  return query select 'other'::text, v_msg;
end;
$$;

-- Pick best active client packages for session credit requirements (no booking).
create or replace function private.pick_client_packages_for_session(
  p_client_user_id       uuid,
  p_reformer_required    integer,
  p_mat_required         integer,
  out reformer_package_id uuid,
  out mat_package_id      uuid,
  out has_sufficient_tokens boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_reformer_pkg uuid;
  v_mat_pkg      uuid;
begin
  reformer_package_id := null;
  mat_package_id := null;
  has_sufficient_tokens := true;

  if coalesce(p_reformer_required, 0) > 0 then
    select up.id into v_reformer_pkg
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.user_id = p_client_user_id
       and p.class_type = 'reformer'
       and up.status = 'active'
       and (up.expires_at is null or up.expires_at > now())
       and (
         up.credits_remaining is null
         or up.credits_remaining >= p_reformer_required
       )
     order by up.expires_at asc nulls last, up.purchased_at asc
     limit 1;

    if v_reformer_pkg is null then
      has_sufficient_tokens := false;
      return;
    end if;

    reformer_package_id := v_reformer_pkg;
  end if;

  if coalesce(p_mat_required, 0) > 0 then
    select up.id into v_mat_pkg
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.user_id = p_client_user_id
       and p.class_type = 'mat'
       and up.status = 'active'
       and (up.expires_at is null or up.expires_at > now())
       and (
         up.credits_remaining is null
         or up.credits_remaining >= p_mat_required
       )
     order by up.expires_at asc nulls last, up.purchased_at asc
     limit 1;

    if v_mat_pkg is null then
      has_sufficient_tokens := false;
      reformer_package_id := null;
      return;
    end if;

    mat_package_id := v_mat_pkg;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RULE CRUD
-- ---------------------------------------------------------------------------
create or replace function public.create_recurring_prebook_rule(
  p_client_user_id  uuid,
  p_session_card_id uuid,
  p_label           text default null
)
returns public.recurring_prebook_rules
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid;
  v_rule     public.recurring_prebook_rules;
begin
  perform private.assert_recurring_staff();
  perform private.assert_client_user(p_client_user_id);

  if not exists (
    select 1 from public.session_cards
     where id = p_session_card_id
       and is_active = true
  ) then
    raise exception 'Session card not found or inactive' using errcode = 'P0018';
  end if;

  v_staff_id := auth.uid();

  insert into public.recurring_prebook_rules (
    client_user_id, session_card_id, label, status, created_by
  )
  values (
    p_client_user_id, p_session_card_id, p_label, 'active', v_staff_id
  )
  returning * into v_rule;

  return v_rule;
end;
$$;

create or replace function public.update_recurring_prebook_rule(
  p_rule_id         uuid,
  p_session_card_id uuid default null,
  p_label           text default null
)
returns public.recurring_prebook_rules
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rule public.recurring_prebook_rules;
begin
  perform private.assert_recurring_staff();

  if p_session_card_id is not null
     and not exists (
       select 1 from public.session_cards
        where id = p_session_card_id
          and is_active = true
     )
  then
    raise exception 'Session card not found or inactive' using errcode = 'P0018';
  end if;

  update public.recurring_prebook_rules
     set session_card_id = coalesce(p_session_card_id, session_card_id),
         label           = coalesce(p_label, label)
   where id = p_rule_id
     and status = 'active'
  returning * into v_rule;

  if not found then
    raise exception 'Recurring rule not found or not active' using errcode = 'P0019';
  end if;

  return v_rule;
end;
$$;

create or replace function public.deactivate_recurring_prebook_rule(p_rule_id uuid)
returns public.recurring_prebook_rules
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rule public.recurring_prebook_rules;
begin
  perform private.assert_recurring_staff();

  update public.recurring_prebook_rules
     set status         = 'deactivated',
         deactivated_at = now(),
         deactivated_by = auth.uid()
   where id = p_rule_id
     and status = 'active'
  returning * into v_rule;

  if not found then
    raise exception 'Recurring rule not found or already deactivated' using errcode = 'P0019';
  end if;

  return v_rule;
end;
$$;

create or replace function public.list_recurring_prebook_rules(
  p_client_user_id uuid default null
)
returns setof public.recurring_prebook_rules
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_recurring_staff();

  return query
  select r.*
    from public.recurring_prebook_rules r
   where p_client_user_id is null
      or r.client_user_id = p_client_user_id
   order by r.client_user_id, r.created_at desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- SCHEDULE LINE CRUD
-- ---------------------------------------------------------------------------
create or replace function public.add_recurring_prebook_schedule_line(
  p_rule_id          uuid,
  p_day_of_week      smallint,
  p_start_time       time,
  p_duration_minutes integer default 60,
  p_sort_order       integer default 0
)
returns public.recurring_prebook_schedule_lines
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line public.recurring_prebook_schedule_lines;
begin
  perform private.assert_recurring_staff();

  if p_day_of_week < 1 or p_day_of_week > 7 then
    raise exception 'day_of_week must be ISO 1 (Mon) … 7 (Sun)' using errcode = 'P0022';
  end if;

  if not exists (
    select 1 from public.recurring_prebook_rules
     where id = p_rule_id
       and status = 'active'
  ) then
    raise exception 'Recurring rule not found or not active' using errcode = 'P0019';
  end if;

  insert into public.recurring_prebook_schedule_lines (
    rule_id, day_of_week, start_time, duration_minutes, is_active, sort_order
  )
  values (
    p_rule_id, p_day_of_week, p_start_time, p_duration_minutes, true, p_sort_order
  )
  returning * into v_line;

  return v_line;
exception
  when unique_violation then
    raise exception 'An active schedule line already exists for this weekday and start time'
      using errcode = 'P0023';
end;
$$;

create or replace function public.update_recurring_prebook_schedule_line(
  p_line_id          uuid,
  p_day_of_week      smallint default null,
  p_start_time       time default null,
  p_duration_minutes integer default null,
  p_sort_order       integer default null
)
returns public.recurring_prebook_schedule_lines
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line public.recurring_prebook_schedule_lines;
begin
  perform private.assert_recurring_staff();

  update public.recurring_prebook_schedule_lines
     set day_of_week      = coalesce(p_day_of_week, day_of_week),
         start_time       = coalesce(p_start_time, start_time),
         duration_minutes = coalesce(p_duration_minutes, duration_minutes),
         sort_order       = coalesce(p_sort_order, sort_order)
   where id = p_line_id
     and is_active = true
  returning * into v_line;

  if not found then
    raise exception 'Schedule line not found or inactive' using errcode = 'P0024';
  end if;

  return v_line;
exception
  when unique_violation then
    raise exception 'An active schedule line already exists for this weekday and start time'
      using errcode = 'P0023';
end;
$$;

create or replace function public.deactivate_recurring_prebook_schedule_line(p_line_id uuid)
returns public.recurring_prebook_schedule_lines
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line public.recurring_prebook_schedule_lines;
begin
  perform private.assert_recurring_staff();

  update public.recurring_prebook_schedule_lines
     set is_active = false
   where id = p_line_id
     and is_active = true
  returning * into v_line;

  if not found then
    raise exception 'Schedule line not found or already inactive' using errcode = 'P0024';
  end if;

  return v_line;
end;
$$;

create or replace function public.list_recurring_prebook_schedule_lines(p_rule_id uuid)
returns setof public.recurring_prebook_schedule_lines
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_recurring_staff();

  return query
  select l.*
    from public.recurring_prebook_schedule_lines l
   where l.rule_id = p_rule_id
   order by l.is_active desc, l.sort_order, l.day_of_week, l.start_time;
end;
$$;

-- ---------------------------------------------------------------------------
-- SKIP OCCURRENCE CRUD
-- ---------------------------------------------------------------------------
create or replace function public.add_recurring_prebook_skip(
  p_rule_id         uuid,
  p_occurrence_date date,
  p_start_time      time,
  p_reason          text default null
)
returns public.recurring_prebook_skipped_occurrences
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_skip public.recurring_prebook_skipped_occurrences;
begin
  perform private.assert_recurring_staff();

  if not exists (
    select 1 from public.recurring_prebook_rules where id = p_rule_id
  ) then
    raise exception 'Recurring rule not found' using errcode = 'P0019';
  end if;

  insert into public.recurring_prebook_skipped_occurrences (
    rule_id, occurrence_date, start_time, skipped_by, reason
  )
  values (
    p_rule_id, p_occurrence_date, p_start_time, auth.uid(), p_reason
  )
  returning * into v_skip;

  return v_skip;
exception
  when unique_violation then
    raise exception 'This occurrence is already skipped' using errcode = 'P0025';
end;
$$;

create or replace function public.remove_recurring_prebook_skip(p_skip_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_recurring_staff();

  delete from public.recurring_prebook_skipped_occurrences
   where id = p_skip_id;

  if not found then
    raise exception 'Skipped occurrence not found' using errcode = 'P0026';
  end if;
end;
$$;

create or replace function public.list_recurring_prebook_skips(p_rule_id uuid)
returns setof public.recurring_prebook_skipped_occurrences
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_recurring_staff();

  return query
  select s.*
    from public.recurring_prebook_skipped_occurrences s
   where s.rule_id = p_rule_id
   order by s.occurrence_date, s.start_time;
end;
$$;

-- ---------------------------------------------------------------------------
-- FORECAST / HEALTH (no bookings created)
-- ---------------------------------------------------------------------------
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
  health_status        text,
  log_status           text,
  failure_code         text,
  failure_message      text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_rule        public.recurring_prebook_rules%rowtype;
  v_card        public.session_cards%rowtype;
  v_today       date;
  v_end         date;
  v_cursor      date;
  v_line        record;
  v_end_time    time;
  v_starts_at   timestamptz;
  v_ends_at     timestamptz;
  v_has_tokens  boolean;
  v_log         public.recurring_prebook_materialization_log%rowtype;
begin
  perform private.assert_recurring_staff();

  select * into v_rule
    from public.recurring_prebook_rules
   where id = p_rule_id;

  if not found then
    raise exception 'Recurring rule not found' using errcode = 'P0019';
  end if;

  select * into v_card
    from public.session_cards
   where id = v_rule.session_card_id;

  v_today := private.studio_today();
  v_end   := private.recurring_window_end_date();

  for v_cursor in
    select d::date
      from generate_series(v_today, v_end, interval '1 day') as d
  loop
    for v_line in
      select sl.id, sl.start_time, sl.duration_minutes
        from public.recurring_prebook_schedule_lines sl
       where sl.rule_id = p_rule_id
         and sl.is_active = true
         and sl.day_of_week = extract(isodow from v_cursor)::integer
    loop
      if exists (
        select 1
          from public.recurring_prebook_skipped_occurrences sk
         where sk.rule_id = p_rule_id
           and sk.occurrence_date = v_cursor
           and sk.start_time = v_line.start_time
      ) then
        continue;
      end if;

      v_end_time  := private.schedule_line_end_time(v_line.start_time, v_line.duration_minutes);
      v_starts_at := (v_cursor + v_line.start_time) at time zone 'Europe/Nicosia';
      v_ends_at   := (v_cursor + v_end_time) at time zone 'Europe/Nicosia';

      select lg.* into v_log
        from public.recurring_prebook_materialization_log lg
       where lg.rule_id = p_rule_id
         and lg.occurrence_starts_at = v_starts_at
       limit 1;

      rule_id := p_rule_id;
      schedule_line_id := v_line.id;
      occurrence_date := v_cursor;
      start_time := v_line.start_time;
      occurrence_starts_at := v_starts_at;
      occurrence_ends_at := v_ends_at;
      log_status := v_log.status;

      if found and v_log.status = 'succeeded' then
        health_status := 'ready';
        failure_code := null;
        failure_message := null;
        return next;
        continue;
      end if;

      if found and v_log.status = 'failed' then
        health_status := 'failed';
        failure_code := v_log.failure_code;
        failure_message := v_log.failure_message;
        return next;
        continue;
      end if;

      select p.has_sufficient_tokens into v_has_tokens
        from private.pick_client_packages_for_session(
          v_rule.client_user_id,
          v_card.reformer_credits_required,
          v_card.mat_credits_required
        ) p;

      if v_has_tokens then
        health_status := 'ready';
        failure_code := null;
        failure_message := null;
      else
        health_status := 'insufficient_tokens';
        failure_code := 'insufficient_tokens';
        failure_message := 'Client lacks active package credits for this occurrence';
      end if;

      return next;
    end loop;
  end loop;
end;
$$;

create or replace function public.list_recurring_prebook_attention(
  p_client_user_id uuid default null
)
returns setof public.recurring_prebook_materialization_log
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_recurring_staff();

  return query
  select lg.*
    from public.recurring_prebook_materialization_log lg
    join public.recurring_prebook_rules r on r.id = lg.rule_id
   where lg.status = 'failed'
     and (p_client_user_id is null or r.client_user_id = p_client_user_id)
   order by lg.occurrence_starts_at asc;
end;
$$;

-- ---------------------------------------------------------------------------
-- MATERIALIZE ONE OCCURRENCE (private)
-- ---------------------------------------------------------------------------
create or replace function private.materialize_recurring_occurrence(
  p_rule_id              uuid,
  p_schedule_line_id     uuid,
  p_occurrence_date      date,
  p_occurrence_starts_at timestamptz,
  p_occurrence_ends_at   timestamptz,
  p_existing_log_id      uuid default null
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
    return p_existing_log_id;
  end if;

  select * into v_line
    from public.recurring_prebook_schedule_lines
   where id = p_schedule_line_id
     and rule_id = p_rule_id
     and is_active = true;

  if not found then
    return p_existing_log_id;
  end if;

  if p_occurrence_date < private.studio_today()
     or p_occurrence_date > private.recurring_window_end_date() then
    return p_existing_log_id;
  end if;

  if exists (
    select 1
      from public.recurring_prebook_skipped_occurrences sk
     where sk.rule_id = p_rule_id
       and sk.occurrence_date = p_occurrence_date
       and sk.start_time = v_line.start_time
  ) then
    return p_existing_log_id;
  end if;

  if p_existing_log_id is not null then
    select * into v_log
      from public.recurring_prebook_materialization_log
     where id = p_existing_log_id
       for update;

    if not found then
      raise exception 'Materialization log not found' using errcode = 'P0027';
    end if;

    if v_log.status = 'succeeded' then
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
      if v_log.status = 'succeeded' then
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
         failure_message   = null
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
    return v_log_id;
  end if;

  v_start_text := private.time_to_hh24_mi(v_line.start_time);
  v_end_text   := private.time_to_hh24_mi(
    private.schedule_line_end_time(v_line.start_time, v_line.duration_minutes)
  );

  begin
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
      select f.failure_code, f.failure_message
        into v_failure_code, v_failure_message
        from private.map_booking_exception_to_failure(SQLSTATE, SQLERRM) f;

      update public.recurring_prebook_materialization_log
         set status          = 'failed',
             health_status   = case
               when v_failure_code = 'insufficient_tokens' then 'insufficient_tokens'
               else 'failed'
             end,
             failure_code    = v_failure_code,
             failure_message = v_failure_message
       where id = v_log_id;

      return v_log_id;
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- BATCH MATERIALIZATION (cron + optional staff manual run)
-- ---------------------------------------------------------------------------
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
  'Materializes active recurring rules inside the rolling 14-day window. Intended for pg_cron.';

revoke all on function public.materialize_recurring_prebooks() from public;
grant execute on function public.materialize_recurring_prebooks() to postgres;
grant execute on function public.materialize_recurring_prebooks() to service_role;

create or replace function public.staff_materialize_recurring_prebooks()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_recurring_staff();
  return public.materialize_recurring_prebooks();
end;
$$;

grant execute on function public.staff_materialize_recurring_prebooks() to authenticated;

-- ---------------------------------------------------------------------------
-- RETRY (staff)
-- ---------------------------------------------------------------------------
create or replace function public.retry_recurring_materialization(p_log_id uuid)
returns public.recurring_prebook_materialization_log
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_log     public.recurring_prebook_materialization_log%rowtype;
  v_result  uuid;
begin
  perform private.assert_recurring_staff();

  select * into v_log
    from public.recurring_prebook_materialization_log
   where id = p_log_id
   for update;

  if not found then
    raise exception 'Materialization log not found' using errcode = 'P0027';
  end if;

  if v_log.status not in ('failed', 'pending') then
    raise exception 'Only failed or pending materializations can be retried (status: %)', v_log.status
      using errcode = 'P0028';
  end if;

  v_result := private.materialize_recurring_occurrence(
    v_log.rule_id,
    v_log.schedule_line_id,
    v_log.occurrence_date,
    v_log.occurrence_starts_at,
    v_log.occurrence_ends_at,
    v_log.id
  );

  select * into v_log
    from public.recurring_prebook_materialization_log
   where id = v_result;

  return v_log;
end;
$$;

grant execute on function public.create_recurring_prebook_rule(uuid, uuid, text) to authenticated;
grant execute on function public.update_recurring_prebook_rule(uuid, uuid, text) to authenticated;
grant execute on function public.deactivate_recurring_prebook_rule(uuid) to authenticated;
grant execute on function public.list_recurring_prebook_rules(uuid) to authenticated;
grant execute on function public.add_recurring_prebook_schedule_line(uuid, smallint, time, integer, integer) to authenticated;
grant execute on function public.update_recurring_prebook_schedule_line(uuid, smallint, time, integer, integer) to authenticated;
grant execute on function public.deactivate_recurring_prebook_schedule_line(uuid) to authenticated;
grant execute on function public.list_recurring_prebook_schedule_lines(uuid) to authenticated;
grant execute on function public.add_recurring_prebook_skip(uuid, date, time, text) to authenticated;
grant execute on function public.remove_recurring_prebook_skip(uuid) to authenticated;
grant execute on function public.list_recurring_prebook_skips(uuid) to authenticated;
grant execute on function public.get_recurring_prebook_forecast(uuid) to authenticated;
grant execute on function public.list_recurring_prebook_attention(uuid) to authenticated;
grant execute on function public.retry_recurring_materialization(uuid) to authenticated;
