-- =============================================================================
-- 30_cancel_booking_recurring_sync.sql — Keep recurring state in sync on cancel
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- When a materialized recurring booking is cancelled, clear the materialization
-- log so forecast, materialize-now, and public booking gates stay consistent.
--
-- Also hardens forecast + materializable list against stale succeeded logs.
--
-- RUN ORDER: After 29_fix_recurring_forecast_volatility.sql.
-- SAFE TO RE-RUN: Yes (CREATE OR REPLACE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- cancel_booking — release recurring occurrence on cancel
-- ---------------------------------------------------------------------------
create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_reason     text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id           uuid;
  v_booking           public.bookings%rowtype;
  v_cancelled         public.bookings%rowtype;
  v_session_starts_at timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  select * into v_booking
    from public.bookings
   where id = p_booking_id
     for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0010';
  end if;

  if v_booking.user_id != v_user_id then
    if not (select private.is_staff()) then
      raise exception 'Not authorised to cancel this booking'
        using errcode = 'P0011';
    end if;
  end if;

  if v_booking.status not in ('booked', 'waitlisted') then
    raise exception 'Booking cannot be cancelled (status: %)', v_booking.status
      using errcode = 'P0012';
  end if;

  select s.starts_at into v_session_starts_at
    from public.sessions s
   where s.id = v_booking.session_id;

  if v_booking.user_id = v_user_id
     and not (select private.is_staff())
     and v_session_starts_at is not null
     and v_session_starts_at <= now() + interval '2 hours' then
    raise exception
      'Cancellations must be made more than 2 hours before class start'
      using errcode = 'P0029';
  end if;

  if v_booking.status = 'booked' then
    if exists (
      select 1 from public.booking_credit_charges
       where booking_id = v_booking.id
    ) then
      update public.user_packages up
         set credits_remaining = case
               when up.credits_remaining is null then null
               else up.credits_remaining + charges.credits_used
             end,
             status = case
               when up.status = 'used_up' then 'active'
               else up.status
             end
        from public.booking_credit_charges charges
       where charges.booking_id = v_booking.id
         and charges.user_package_id = up.id
         and up.status in ('active', 'used_up');
    else
      update public.user_packages
         set credits_remaining = case
               when credits_remaining is null then null
               else credits_remaining + v_booking.credits_used
             end,
             status = case
               when status = 'used_up' then 'active'
               else status
             end
       where id = v_booking.user_package_id
         and status in ('active', 'used_up');
    end if;
  end if;

  update public.bookings
     set status              = 'cancelled',
         cancelled_at        = now(),
         cancellation_reason = p_reason
   where id = p_booking_id
  returning * into v_cancelled;

  -- Recurring bookings: remove materialization log so occurrence returns to planned
  -- and can be materialized again (public/staff gates use log status).
  delete from public.recurring_prebook_materialization_log lg
   where lg.booking_id = p_booking_id
      or (
        v_booking.recurring_materialization_log_id is not null
        and lg.id = v_booking.recurring_materialization_log_id
      );

  return v_cancelled;
end;
$$;

comment on function public.cancel_booking is
  'Cancels a booking and refunds credits. Clears recurring materialization log when applicable. Client self-cancel blocked within 2 hours (P0029).';

-- ---------------------------------------------------------------------------
-- get_recurring_prebook_forecast — treat stale succeeded logs as planned
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
  v_log            public.recurring_prebook_materialization_log%rowtype;
  v_log_is_booked  boolean;
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

    v_log_is_booked := found
      and v_log.status = 'succeeded'
      and v_log.booking_id is not null
      and exists (
        select 1
          from public.bookings b
         where b.id = v_log.booking_id
           and b.status in ('booked', 'waitlisted')
      );

    if v_log_is_booked then
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
  '14-day forecast; booking_state reflects live booking status, not stale materialization logs.';

grant execute on function public.get_recurring_prebook_forecast(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- list_client_materializable_occurrences — include stale succeeded rows
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
      when lg.status = 'succeeded'
       and lg.booking_id is not null
       and exists (
         select 1
           from public.bookings b
          where b.id = lg.booking_id
            and b.status in ('booked', 'waitlisted')
       ) then 'booked'
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
   and lg.occurrence_starts_at = ((d::date + sl.start_time) at time zone 'Europe/Nicosia')
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
end;
$$;

comment on function public.list_client_materializable_occurrences(uuid) is
  'Recurring occurrences not yet actively booked (ignores stale succeeded logs).';

grant execute on function public.list_client_materializable_occurrences(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- recurring_blocks_public_booking — only treat active bookings as terminal
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
            and (
              lg.status = 'failed'
              or (
                lg.status = 'succeeded'
                and lg.booking_id is not null
                and exists (
                  select 1
                    from public.bookings b
                   where b.id = lg.booking_id
                     and b.status in ('booked', 'waitlisted')
                )
              )
            )
       )
  );
end;
$$;

comment on function private.recurring_blocks_public_booking(date, time, text) is
  'True when recurring occurrence awaits materialization (ignores stale succeeded logs).';

-- ---------------------------------------------------------------------------
-- materialize_recurring_occurrence — retry when succeeded log has no live booking
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

    if v_log.status = 'succeeded'
       and v_log.booking_id is not null
       and exists (
         select 1
           from public.bookings b
          where b.id = v_log.booking_id
            and b.status in ('booked', 'waitlisted')
       ) then
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
      if v_log.status = 'succeeded'
         and v_log.booking_id is not null
         and exists (
           select 1
             from public.bookings b
            where b.id = v_log.booking_id
              and b.status in ('booked', 'waitlisted')
         ) then
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

-- Patch skip guards in batch materializers (copy body from 22/28 with active-booking check).
-- staff_materialize_recurring_prebooks_for_client
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
             and lg.booking_id is not null
             and exists (
               select 1
                 from public.bookings b
                where b.id = lg.booking_id
                  and b.status in ('booked', 'waitlisted')
             )
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

grant execute on function public.staff_materialize_recurring_prebooks_for_client(uuid, jsonb)
  to authenticated;
