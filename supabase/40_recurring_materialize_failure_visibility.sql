-- =============================================================================
-- 40_recurring_materialize_failure_visibility.sql
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- • Cron materialize continues after per-occurrence failures and persists failed logs
-- • Staff cancel of a recurring booking permanently skips that occurrence
-- • Forecast warns when packages expire before the class date
-- • Clients can read their own planned recurring slots
--
-- RUN ORDER: After 39_package_lifecycle_alignment.sql
-- SAFE TO RE-RUN: Yes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Expand failure_code for staff-cancelled skips
-- ---------------------------------------------------------------------------
alter table public.recurring_prebook_materialization_log
  drop constraint if exists recurring_prebook_materialization_log_failure_code_check;

alter table public.recurring_prebook_materialization_log
  add constraint recurring_prebook_materialization_log_failure_code_check
  check (
    failure_code is null or failure_code in (
      'capacity_full',
      'insufficient_tokens',
      'slot_conflict',
      'session_unavailable',
      'package_expired',
      'horizon',
      'staff_cancelled',
      'other'
    )
  );

-- ---------------------------------------------------------------------------
-- Credit pool as-of a future occurrence (packages still valid then)
-- ---------------------------------------------------------------------------
create or replace function private.client_simulated_credit_pool_as_of(
  p_client_user_id uuid,
  p_class_type     text,
  p_as_of          timestamptz
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
       and (up.expires_at is null or up.expires_at > p_as_of)
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

comment on function private.client_simulated_credit_pool_as_of(uuid, text, timestamptz) is
  'Active credit pool for class_type from packages that remain valid after p_as_of.';

-- ---------------------------------------------------------------------------
-- materialize_recurring_occurrence — optional non-raising mode for cron
-- ---------------------------------------------------------------------------
drop function if exists private.materialize_recurring_occurrence(uuid, uuid, date, timestamptz, timestamptz, uuid);

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

  if p_occurrence_date < private.studio_today()
     or p_occurrence_date > private.public_booking_window_end_date() then
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

comment on function private.materialize_recurring_occurrence(uuid, uuid, date, timestamptz, timestamptz, uuid, boolean) is
  'Materializes one recurring occurrence. When p_raise_on_failure is false (cron), failures are logged and returned without aborting the batch.';

-- ---------------------------------------------------------------------------
-- Daily cron — durable failures, skip status, no raise
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

        if found and v_log.status = 'skipped' then
          v_skipped := v_skipped + 1;
          continue;
        end if;

        v_processed := v_processed + 1;

        v_log_id := private.materialize_recurring_occurrence(
          v_rule.rule_id,
          v_line.line_id,
          v_cursor,
          v_starts_at,
          v_ends_at,
          case when found then v_log.id else null end,
          false
        );

        if v_log_id is null then
          v_failed := v_failed + 1;
          continue;
        end if;

        select status into v_log_status
          from public.recurring_prebook_materialization_log
         where id = v_log_id;

        if v_log_status = 'succeeded' then
          v_succeeded := v_succeeded + 1;
        elsif v_log_status = 'failed' then
          v_failed := v_failed + 1;
        elsif v_log_status = 'skipped' then
          v_skipped := v_skipped + 1;
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
  'Daily cron batch: materializes recurring occurrences. Per-occurrence failures are logged without aborting the job.';

-- ---------------------------------------------------------------------------
-- cancel_booking — staff cancel of recurring → permanent skip
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
  v_is_staff          boolean;
  v_is_recurring      boolean;
  v_log               public.recurring_prebook_materialization_log%rowtype;
  v_start_time        time;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  v_is_staff := (select private.is_staff());

  select * into v_booking
    from public.bookings
   where id = p_booking_id
     for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0010';
  end if;

  if v_booking.user_id != v_user_id then
    if not v_is_staff then
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
     and not v_is_staff
     and v_session_starts_at is not null
     and v_session_starts_at <= now() + interval '4 hours' then
    raise exception
      'Cancellations must be made more than 4 hours before class start'
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

  v_is_recurring := v_booking.booking_source = 'recurring'
    or v_booking.recurring_materialization_log_id is not null;

  if v_is_recurring and v_is_staff then
    select lg.* into v_log
      from public.recurring_prebook_materialization_log lg
     where lg.id = v_booking.recurring_materialization_log_id
        or lg.booking_id = p_booking_id
     order by case when lg.id = v_booking.recurring_materialization_log_id then 0 else 1 end
     limit 1;

    if found then
      select sl.start_time into v_start_time
        from public.recurring_prebook_schedule_lines sl
       where sl.id = v_log.schedule_line_id;

      if v_start_time is null then
        v_start_time := (v_log.occurrence_starts_at at time zone 'Europe/Nicosia')::time;
      end if;

      insert into public.recurring_prebook_skipped_occurrences (
        rule_id, occurrence_date, start_time, skipped_by, reason
      )
      values (
        v_log.rule_id,
        v_log.occurrence_date,
        v_start_time,
        v_user_id,
        coalesce(p_reason, 'Cancelled by staff')
      )
      on conflict (rule_id, occurrence_date, start_time) do nothing;

      update public.recurring_prebook_materialization_log
         set status          = 'skipped',
             health_status   = null,
             booking_id      = null,
             failure_code    = 'staff_cancelled',
             failure_message = coalesce(p_reason, 'Skipped after staff cancellation')
       where id = v_log.id;
    end if;
  elsif v_is_recurring then
    -- Client self-cancel: release occurrence so auto-materialize may retry
    delete from public.recurring_prebook_materialization_log lg
     where lg.booking_id = p_booking_id
        or (
          v_booking.recurring_materialization_log_id is not null
          and lg.id = v_booking.recurring_materialization_log_id
        );
  end if;

  return v_cancelled;
end;
$$;

comment on function public.cancel_booking is
  'Cancels a booking and refunds credits. Staff cancel of recurring bookings permanently skips that occurrence. Client self-cancel of recurring clears the log for rematerialize. Client self-cancel blocked within 4 hours (P0029).';

-- ---------------------------------------------------------------------------
-- Forecast — package expires before class warning
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
  v_as_of_reformer integer;
  v_as_of_mat      integer;
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
      v_token_health := case
        when v_log.failure_code in ('insufficient_tokens', 'package_expired')
          then 'insufficient_tokens'
        else null
      end;
    elsif found and v_log.status = 'skipped' then
      v_booking_state := 'skipped';
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

      if v_token_health = 'ok' then
        v_as_of_reformer := private.client_simulated_credit_pool_as_of(
          v_occ.client_user_id, 'reformer', v_occ.occurrence_starts_at
        );
        v_as_of_mat := private.client_simulated_credit_pool_as_of(
          v_occ.client_user_id, 'mat', v_occ.occurrence_starts_at
        );
        if v_as_of_reformer < coalesce(v_occ.reformer_credits_required, 0)
           or v_as_of_mat < coalesce(v_occ.mat_credits_required, 0) then
          v_token_health := 'package_expires_before';
        end if;
      end if;
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
      when th.booking_state = 'skipped' then 'failed'
      when th.token_health = 'insufficient_tokens' then 'insufficient_tokens'
      when th.token_health = 'package_expires_before' then 'insufficient_tokens'
      else 'ready'
    end as health_status,
    lg.status as log_status,
    lg.failure_code,
    case
      when th.token_health = 'package_expires_before'
        then 'Package expires before this class date'
      else lg.failure_message
    end as failure_message
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
  '14-day forecast with live booking state, credit simulation, and package-expires-before-class warnings.';

grant execute on function public.get_recurring_prebook_forecast(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Client-facing planned recurring slots
-- ---------------------------------------------------------------------------
create or replace function public.get_my_recurring_planned_slots()
returns table (
  rule_id              uuid,
  rule_label           text,
  session_card_title   text,
  occurrence_date      date,
  start_time           time,
  occurrence_starts_at timestamptz,
  occurrence_ends_at   timestamptz,
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
  v_user_id uuid := auth.uid();
  v_today   date;
  v_end     date;
  v_reformer_pool integer;
  v_mat_pool integer;
  v_occ record;
  v_log public.recurring_prebook_materialization_log%rowtype;
  v_booking_state text;
  v_token_health text;
  v_failure_message text;
  v_as_of_reformer integer;
  v_as_of_mat integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  v_today := private.studio_today();
  v_end := private.public_booking_window_end_date();
  v_reformer_pool := private.client_simulated_credit_pool(v_user_id, 'reformer');
  v_mat_pool := private.client_simulated_credit_pool(v_user_id, 'mat');

  create temp table tmp_my_recurring_slots on commit drop as
  select
    r.id as rule_id,
    coalesce(r.label, sc.title, 'Recurring rule') as rule_label,
    sc.title as session_card_title,
    d::date as occurrence_date,
    sl.start_time,
    sc.reformer_credits_required,
    sc.mat_credits_required,
    ((d::date + sl.start_time) at time zone 'Europe/Nicosia') as occurrence_starts_at,
    ((d::date + private.schedule_line_end_time(sl.start_time, sl.duration_minutes))
      at time zone 'Europe/Nicosia') as occurrence_ends_at,
    exists (
      select 1
        from public.recurring_prebook_skipped_occurrences sk
       where sk.rule_id = r.id
         and sk.occurrence_date = d::date
         and sk.start_time = sl.start_time
    ) as is_skipped
  from public.recurring_prebook_rules r
  join public.recurring_prebook_schedule_lines sl
    on sl.rule_id = r.id
   and sl.is_active = true
  join public.session_cards sc on sc.id = r.session_card_id
  cross join generate_series(v_today, v_end, interval '1 day') as d
  where r.client_user_id = v_user_id
    and r.status = 'active'
    and sl.day_of_week = extract(isodow from d::date)::integer
  order by occurrence_starts_at asc;

  for v_occ in
    select * from tmp_my_recurring_slots order by occurrence_starts_at
  loop
    v_failure_message := null;

    if v_occ.is_skipped then
      v_booking_state := 'skipped';
      v_token_health := null;
      v_failure_message := 'This date was skipped';
    else
      select lg.* into v_log
        from public.recurring_prebook_materialization_log lg
       where lg.rule_id = v_occ.rule_id
         and lg.occurrence_starts_at = v_occ.occurrence_starts_at
       limit 1;

      if found
         and v_log.status = 'succeeded'
         and v_log.booking_id is not null
         and exists (
           select 1 from public.bookings b
            where b.id = v_log.booking_id
              and b.status in ('booked', 'waitlisted')
         ) then
        v_booking_state := 'booked';
        v_token_health := 'ok';
      elsif found and v_log.status = 'failed' then
        v_booking_state := 'failed';
        v_token_health := case
          when v_log.failure_code in ('insufficient_tokens', 'package_expired')
            then 'insufficient_tokens'
          else null
        end;
        v_failure_message := v_log.failure_message;
      elsif found and v_log.status = 'skipped' then
        v_booking_state := 'skipped';
        v_token_health := null;
        v_failure_message := coalesce(v_log.failure_message, 'This date was skipped');
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

        if v_token_health = 'ok' then
          v_as_of_reformer := private.client_simulated_credit_pool_as_of(
            v_user_id, 'reformer', v_occ.occurrence_starts_at
          );
          v_as_of_mat := private.client_simulated_credit_pool_as_of(
            v_user_id, 'mat', v_occ.occurrence_starts_at
          );
          if v_as_of_reformer < coalesce(v_occ.reformer_credits_required, 0)
             or v_as_of_mat < coalesce(v_occ.mat_credits_required, 0) then
            v_token_health := 'package_expires_before';
            v_failure_message := 'Package expires before this class date';
          end if;
        elsif v_token_health = 'insufficient_tokens' then
          v_failure_message := 'Not enough package credits for this class';
        end if;
      end if;
    end if;

    rule_id := v_occ.rule_id;
    rule_label := v_occ.rule_label;
    session_card_title := v_occ.session_card_title;
    occurrence_date := v_occ.occurrence_date;
    start_time := v_occ.start_time;
    occurrence_starts_at := v_occ.occurrence_starts_at;
    occurrence_ends_at := v_occ.occurrence_ends_at;
    booking_state := v_booking_state;
    token_health := v_token_health;
    failure_message := v_failure_message;
    return next;
  end loop;
end;
$$;

comment on function public.get_my_recurring_planned_slots() is
  'Authenticated client: planned/booked/failed/skipped recurring slots in the public booking window.';

grant execute on function public.get_my_recurring_planned_slots() to authenticated;
