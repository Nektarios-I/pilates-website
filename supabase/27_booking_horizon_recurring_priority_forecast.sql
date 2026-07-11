-- =============================================================================
-- 27_booking_horizon_recurring_priority_forecast.sql
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- • 14-day booking horizon for public + staff manual (matches recurring window)
-- • Public/staff blocked until recurring materialization has processed a slot
-- • Client-level chronological token forecast for recurring occurrences
-- • RPC to list slot times open for public/staff booking after recurring pass
--
-- RUN ORDER: After 26_delete_recurring_rule.sql.
-- SAFE TO RE-RUN: Yes — drops forecast first when return type changed (migration 22 → 27).
-- =============================================================================

-- Clean up obsolete helper from failed partial runs (renamed in this migration).
drop function if exists private.allocate_forecast_tokens(integer, integer, integer, integer);

-- ---------------------------------------------------------------------------
-- Shared 14-day horizon (public/staff booking + recurring materialization)
-- ---------------------------------------------------------------------------
create or replace function private.public_booking_horizon_days()
returns integer
language sql
immutable
set search_path = ''
as $$
  select private.recurring_materialization_horizon_days();
$$;

comment on function private.public_booking_horizon_days is
  'Rolling booking horizon in days for public/staff manual booking (currently 14).';

create or replace function private.public_booking_window_end_date()
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select private.studio_today() + private.public_booking_horizon_days();
$$;

-- ---------------------------------------------------------------------------
-- Recurring priority gate — block public/staff until materialization processed
-- ---------------------------------------------------------------------------
create or replace function private.recurring_blocks_public_booking(
  p_schedule_date date,
  p_start_time      time,
  p_session_type    text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_schedule_date < private.studio_today()
     or p_schedule_date > private.public_booking_window_end_date() then
    return false;
  end if;

  return exists (
    select 1
      from public.recurring_prebook_rules r
      join public.recurring_prebook_schedule_lines sl
        on sl.rule_id = r.id
       and sl.is_active = true
       and sl.day_of_week = extract(isodow from p_schedule_date)::integer
       and sl.start_time = p_start_time
      join public.session_cards sc
        on sc.id = r.session_card_id
       and sc.session_type = p_session_type
     where r.status = 'active'
       and not exists (
         select 1
           from public.recurring_prebook_skipped_occurrences sk
          where sk.rule_id = r.id
            and sk.occurrence_date = p_schedule_date
            and sk.start_time = p_start_time
       )
       and not exists (
         select 1
           from public.recurring_prebook_materialization_log lg
          where lg.rule_id = r.id
            and lg.schedule_line_id = sl.id
            and lg.occurrence_date = p_schedule_date
            and lg.status in ('succeeded', 'failed')
       )
  );
end;
$$;

comment on function private.recurring_blocks_public_booking(date, time, text) is
  'True when a recurring occurrence is waiting for materialization and public/staff booking must wait.';

-- ---------------------------------------------------------------------------
-- Simulated credit pools for chronological recurring token forecast
-- ---------------------------------------------------------------------------
create or replace function private.client_simulated_credit_pool(
  p_client_user_id uuid,
  p_class_type     text
)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_total integer := 0;
  v_row   record;
begin
  for v_row in
    select up.credits_remaining
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.user_id = p_client_user_id
       and up.status = 'active'
       and p.class_type = p_class_type
       and (up.expires_at is null or up.expires_at > now())
     order by up.expires_at asc nulls last, up.purchased_at asc
  loop
    if v_row.credits_remaining is null then
      return 1000000;
    end if;

    v_total := v_total + v_row.credits_remaining;
  end loop;

  return v_total;
end;
$$;

create or replace function private.try_allocate_forecast_tokens(
  p_reformer_pool     integer,
  p_mat_pool          integer,
  p_reformer_required integer,
  p_mat_required      integer
)
returns table (
  reformer_pool integer,
  mat_pool      integer,
  token_health  text
)
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_reformer integer := p_reformer_pool;
  v_mat      integer := p_mat_pool;
begin
  if coalesce(p_reformer_required, 0) > 0 then
    if v_reformer < p_reformer_required then
      return query select v_reformer, v_mat, 'insufficient_tokens'::text;
      return;
    end if;
    v_reformer := v_reformer - p_reformer_required;
  end if;

  if coalesce(p_mat_required, 0) > 0 then
    if v_mat < p_mat_required then
      return query select v_reformer, v_mat, 'insufficient_tokens'::text;
      return;
    end if;
    v_mat := v_mat - p_mat_required;
  end if;

  return query select v_reformer, v_mat, 'ok'::text;
end;
$$;

-- ---------------------------------------------------------------------------
-- Open slot times for public/staff (after recurring materialization pass)
-- ---------------------------------------------------------------------------
create or replace function public.list_open_slot_starts_for_day(
  p_schedule_date      date,
  p_session_type       text,
  p_duration_minutes   integer default 60
)
returns table (
  slot_start time,
  slot_end   time
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_ranges   jsonb;
  v_range    jsonb;
  v_start_m  integer;
  v_end_m    integer;
  v_cursor_m integer;
  v_duration integer;
  v_start_t  time;
  v_end_t    time;
begin
  if p_schedule_date < private.studio_today()
     or p_schedule_date > private.public_booking_window_end_date() then
    return;
  end if;

  v_duration := greatest(15, coalesce(p_duration_minutes, 60));
  v_ranges := public.get_default_studio_hours(p_schedule_date);

  if jsonb_array_length(v_ranges) = 0 then
    return;
  end if;

  for v_range in select value from jsonb_array_elements(v_ranges)
  loop
    v_start_m := (
      split_part(v_range->>'start', ':', 1)::integer * 60
      + split_part(v_range->>'start', ':', 2)::integer
    );
    v_end_m := (
      split_part(v_range->>'end', ':', 1)::integer * 60
      + split_part(v_range->>'end', ':', 2)::integer
    );
    v_cursor_m := v_start_m;

    while v_cursor_m + v_duration <= v_end_m loop
      v_start_t := make_time(v_cursor_m / 60, v_cursor_m % 60, 0);
      v_end_t := make_time((v_cursor_m + v_duration) / 60, (v_cursor_m + v_duration) % 60, 0);

      if not private.recurring_blocks_public_booking(p_schedule_date, v_start_t, p_session_type) then
        slot_start := v_start_t;
        slot_end := v_end_t;
        return next;
      end if;

      v_cursor_m := v_cursor_m + v_duration;
    end loop;
  end loop;
end;
$$;

comment on function public.list_open_slot_starts_for_day(date, text, integer) is
  'Studio hourly slots within the 14-day window that are open for public/staff booking (recurring processed).';

grant execute on function public.list_open_slot_starts_for_day(date, text, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- book_session_core — 14-day horizon + recurring priority gate
-- ---------------------------------------------------------------------------
create or replace function private.book_session_core(
  p_user_id                          uuid,
  p_session_id                       uuid,
  p_reformer_user_package_id         uuid,
  p_mat_user_package_id              uuid,
  p_allow_waitlist                   boolean,
  p_enforce_public_horizon           boolean,
  p_booking_source                   text,
  p_created_by_user_id               uuid,
  p_recurring_materialization_log_id uuid
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session            public.sessions%rowtype;
  v_reformer_required  integer;
  v_mat_required       integer;
  v_reformer_package   public.user_packages%rowtype;
  v_mat_package        public.user_packages%rowtype;
  v_confirmed_count    integer;
  v_status             text;
  v_primary_package_id uuid;
  v_new_booking        public.bookings;
  v_horizon_end        timestamptz;
  v_schedule_date      date;
  v_start_time         time;
begin
  if p_user_id is null then
    raise exception 'User is required' using errcode = 'P0001';
  end if;

  if p_booking_source not in ('client', 'staff_manual', 'recurring') then
    raise exception 'Invalid booking source: %', p_booking_source using errcode = 'P0016';
  end if;

  select * into v_session
    from public.sessions
   where id = p_session_id
     for update;

  if not found then
    raise exception 'Session not found' using errcode = 'P0002';
  end if;

  if v_session.status != 'scheduled' then
    raise exception 'Session is not available for booking (status: %)', v_session.status
      using errcode = 'P0003';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'Cannot book a session that has already started'
      using errcode = 'P0004';
  end if;

  v_schedule_date := (v_session.starts_at at time zone 'Europe/Nicosia')::date;
  v_start_time := (v_session.starts_at at time zone 'Europe/Nicosia')::time;

  if p_enforce_public_horizon then
    if v_schedule_date > private.public_booking_window_end_date() then
      raise exception 'Cannot book more than % days in advance',
        private.public_booking_horizon_days()
        using errcode = 'P0014';
    end if;

    if private.recurring_blocks_public_booking(
      v_schedule_date,
      v_start_time,
      v_session.session_type
    ) then
      raise exception
        'This time slot is reserved until recurring prebookings are processed for this date'
        using errcode = 'P0032';
    end if;
  end if;

  if private.user_has_active_booking_at_slot(p_user_id, v_session.starts_at, v_session.ends_at) then
    raise exception 'You already have a booking at this time slot'
      using errcode = 'P0013';
  end if;

  v_reformer_required := coalesce(v_session.reformer_credits_required, 0);
  v_mat_required := coalesce(v_session.mat_credits_required, 0);

  if v_reformer_required <= 0 and v_mat_required <= 0 then
    raise exception 'This session has no credit requirement configured'
      using errcode = 'P0009';
  end if;

  if v_reformer_required > 0 then
    if p_reformer_user_package_id is null then
      raise exception 'A reformer package is required' using errcode = 'P0005';
    end if;

    select up.* into v_reformer_package
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.id = p_reformer_user_package_id
       and up.user_id = p_user_id
       and p.class_type = 'reformer'
     for update;

    if not found then
      raise exception 'Reformer package not found or does not belong to you'
        using errcode = 'P0005';
    end if;

    if v_reformer_package.status != 'active' then
      raise exception 'Reformer package is not active (status: %)', v_reformer_package.status
        using errcode = 'P0006';
    end if;

    if v_reformer_package.expires_at is not null and v_reformer_package.expires_at < now() then
      raise exception 'Reformer package has expired' using errcode = 'P0007';
    end if;

    if v_reformer_package.credits_remaining is not null
       and v_reformer_package.credits_remaining < v_reformer_required then
      raise exception 'Insufficient reformer credits (have %, need %)',
        v_reformer_package.credits_remaining, v_reformer_required
        using errcode = 'P0008';
    end if;
  end if;

  if v_mat_required > 0 then
    if p_mat_user_package_id is null then
      raise exception 'A mat package is required' using errcode = 'P0005';
    end if;

    select up.* into v_mat_package
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.id = p_mat_user_package_id
       and up.user_id = p_user_id
       and p.class_type = 'mat'
     for update;

    if not found then
      raise exception 'Mat package not found or does not belong to you'
        using errcode = 'P0005';
    end if;

    if v_mat_package.status != 'active' then
      raise exception 'Mat package is not active (status: %)', v_mat_package.status
        using errcode = 'P0006';
    end if;

    if v_mat_package.expires_at is not null and v_mat_package.expires_at < now() then
      raise exception 'Mat package has expired' using errcode = 'P0007';
    end if;

    if v_mat_package.credits_remaining is not null
       and v_mat_package.credits_remaining < v_mat_required then
      raise exception 'Insufficient mat credits (have %, need %)',
        v_mat_package.credits_remaining, v_mat_required
        using errcode = 'P0008';
    end if;
  end if;

  select count(*) into v_confirmed_count
    from public.bookings
   where session_id = p_session_id
     and status = 'booked';

  if v_confirmed_count >= v_session.capacity then
    if p_allow_waitlist then
      v_status := 'waitlisted';
    else
      raise exception 'Session is at capacity' using errcode = 'P0015';
    end if;
  else
    v_status := 'booked';
  end if;

  v_primary_package_id := coalesce(p_reformer_user_package_id, p_mat_user_package_id);

  if v_status = 'booked' then
    if v_reformer_required > 0 then
      update public.user_packages
         set credits_remaining = case
               when credits_remaining is null then null
               else credits_remaining - v_reformer_required
             end
       where id = p_reformer_user_package_id;
    end if;

    if v_mat_required > 0 then
      update public.user_packages
         set credits_remaining = case
               when credits_remaining is null then null
               else credits_remaining - v_mat_required
             end
       where id = p_mat_user_package_id;
    end if;
  end if;

  insert into public.bookings (
    user_id,
    session_id,
    user_package_id,
    status,
    credits_used,
    booked_at,
    booking_source,
    created_by_user_id,
    recurring_materialization_log_id
  )
  values (
    p_user_id,
    p_session_id,
    v_primary_package_id,
    v_status,
    v_reformer_required + v_mat_required,
    now(),
    p_booking_source,
    p_created_by_user_id,
    p_recurring_materialization_log_id
  )
  returning * into v_new_booking;

  if v_status = 'booked' and v_reformer_required > 0 then
    insert into public.booking_credit_charges (
      booking_id, user_package_id, class_type, credits_used
    )
    values (
      v_new_booking.id, p_reformer_user_package_id, 'reformer', v_reformer_required
    )
    on conflict (booking_id, class_type) do nothing;
  end if;

  if v_status = 'booked' and v_mat_required > 0 then
    insert into public.booking_credit_charges (
      booking_id, user_package_id, class_type, credits_used
    )
    values (
      v_new_booking.id, p_mat_user_package_id, 'mat', v_mat_required
    )
    on conflict (booking_id, class_type) do nothing;
  end if;

  return v_new_booking;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public wrappers — enable 14-day horizon + recurring gate
-- ---------------------------------------------------------------------------
create or replace function public.book_session(
  p_session_id      uuid,
  p_user_package_id uuid
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id            uuid;
  v_session            public.sessions%rowtype;
  v_package_class_type text;
  v_required_credits   integer;
  v_reformer_id        uuid;
  v_mat_id             uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  select p.class_type into v_package_class_type
    from public.user_packages up
    join public.packages p on p.id = up.package_id
   where up.id = p_user_package_id
     and up.user_id = v_user_id;

  if not found then
    raise exception 'Package not found or does not belong to you'
      using errcode = 'P0005';
  end if;

  select * into v_session
    from public.sessions
   where id = p_session_id;

  if not found then
    raise exception 'Session not found' using errcode = 'P0002';
  end if;

  v_required_credits := case v_package_class_type
    when 'reformer' then coalesce(v_session.reformer_credits_required, v_session.credits_required)
    when 'mat' then coalesce(v_session.mat_credits_required, v_session.credits_required)
    else 0
  end;

  if v_required_credits <= 0 then
    raise exception 'Selected package type is not required for this session'
      using errcode = 'P0009';
  end if;

  v_reformer_id := case when v_package_class_type = 'reformer' then p_user_package_id else null end;
  v_mat_id      := case when v_package_class_type = 'mat' then p_user_package_id else null end;

  return private.book_session_core(
    v_user_id,
    p_session_id,
    v_reformer_id,
    v_mat_id,
    false,
    true,
    'client',
    null,
    null
  );
end;
$$;

create or replace function public.book_session_with_credits(
  p_session_id uuid,
  p_reformer_user_package_id uuid default null,
  p_mat_user_package_id uuid default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  return private.book_session_core(
    v_user_id,
    p_session_id,
    p_reformer_user_package_id,
    p_mat_user_package_id,
    false,
    true,
    'client',
    null,
    null
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff wrappers — same 14-day horizon + recurring gate
-- ---------------------------------------------------------------------------
create or replace function public.staff_book_session_for_client(
  p_client_user_id  uuid,
  p_session_id      uuid,
  p_user_package_id uuid
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id           uuid;
  v_package_class_type text;
  v_reformer_id        uuid;
  v_mat_id             uuid;
begin
  perform private.assert_staff_may_book_for_client(p_client_user_id);

  v_staff_id := auth.uid();

  select p.class_type into v_package_class_type
    from public.user_packages up
    join public.packages p on p.id = up.package_id
   where up.id = p_user_package_id
     and up.user_id = p_client_user_id;

  if not found then
    raise exception 'Package not found or does not belong to the client'
      using errcode = 'P0005';
  end if;

  v_reformer_id := case when v_package_class_type = 'reformer' then p_user_package_id else null end;
  v_mat_id      := case when v_package_class_type = 'mat' then p_user_package_id else null end;

  return private.book_session_core(
    p_client_user_id,
    p_session_id,
    v_reformer_id,
    v_mat_id,
    false,
    true,
    'staff_manual',
    v_staff_id,
    null
  );
end;
$$;

create or replace function public.staff_book_session_with_credits_for_client(
  p_client_user_id           uuid,
  p_session_id               uuid,
  p_reformer_user_package_id uuid default null,
  p_mat_user_package_id      uuid default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid;
begin
  perform private.assert_staff_may_book_for_client(p_client_user_id);

  v_staff_id := auth.uid();

  return private.book_session_core(
    p_client_user_id,
    p_session_id,
    p_reformer_user_package_id,
    p_mat_user_package_id,
    false,
    true,
    'staff_manual',
    v_staff_id,
    null
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Forecast — chronological client token allocation + booking state columns
-- Must DROP first: return type adds booking_state + token_health vs migration 22.
-- ---------------------------------------------------------------------------
drop function if exists public.get_recurring_prebook_forecast(uuid);

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
  v_health_status  text;
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
  '14-day forecast with booking_state (planned/booked/failed) and chronological client token_health.';

grant execute on function public.get_recurring_prebook_forecast(uuid) to authenticated;
