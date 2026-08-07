-- =============================================================================
-- 41_staff_manual_uncapped_recurring_first_occurrence.sql
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- • Staff/instructor manual booking: remove 14-day upper horizon (past still blocked)
-- • Keep recurring-priority gate for client + staff_manual booking sources
-- • Public self-booking horizon unchanged (14 days)
-- • Staff open-slot listing without public upper window
-- • Recurring schedule lines require first_occurrence_date (rule starts on that date)
-- • Materialization / forecast / planned slots respect first_occurrence_date
-- • Skip validation allows future dates matching the line (not only 14-day forecast)
--
-- RUN ORDER: After 40_recurring_materialize_failure_visibility.sql.
-- SAFE TO RE-RUN: Yes (CREATE OR REPLACE / IF NOT EXISTS patterns).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. first_occurrence_date on schedule lines
-- ---------------------------------------------------------------------------
alter table public.recurring_prebook_schedule_lines
  add column if not exists first_occurrence_date date;

comment on column public.recurring_prebook_schedule_lines.first_occurrence_date is
  'First calendar date (Europe/Nicosia) this weekly line may materialize. Inclusive; rule is indefinite after this date.';

-- Backfill existing lines: most recent matching weekday on or before studio today
-- so current rolling materialization behavior is preserved.
update public.recurring_prebook_schedule_lines sl
   set first_occurrence_date = (
     private.studio_today()
     - ((extract(isodow from private.studio_today())::integer - sl.day_of_week + 7) % 7)
   )
 where sl.first_occurrence_date is null;

alter table public.recurring_prebook_schedule_lines
  alter column first_occurrence_date set not null;

-- ---------------------------------------------------------------------------
-- 2. book_session_core — split horizon vs recurring priority
-- ---------------------------------------------------------------------------
create or replace function private.book_session_core(
  p_user_id uuid,
  p_session_id uuid,
  p_reformer_user_package_id uuid,
  p_mat_user_package_id uuid,
  p_allow_waitlist boolean,
  p_enforce_public_horizon boolean,
  p_booking_source text,
  p_created_by_user_id uuid,
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
  end if;

  -- Recurring priority gate for public + staff manual (not recurring materialization).
  if p_booking_source in ('client', 'staff_manual') then
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

    if v_reformer_package.expires_at is not null and v_reformer_package.expires_at <= now() then
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

    if v_mat_package.expires_at is not null and v_mat_package.expires_at <= now() then
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

comment on function private.book_session_core(
  uuid, uuid, uuid, uuid, boolean, boolean, text, uuid, uuid
) is
  'Shared booking core. p_enforce_public_horizon controls the 14-day public window only; recurring priority applies to client and staff_manual sources.';

-- ---------------------------------------------------------------------------
-- 3. Staff wrappers — no public horizon upper bound
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
    false,
    'staff_manual',
    v_staff_id,
    null
  );
end;
$$;

comment on function public.staff_book_session_for_client(uuid, uuid, uuid) is
  'Staff books a session for a client. No public 14-day upper horizon; past sessions still blocked. Fails when session is at capacity.';

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
    false,
    'staff_manual',
    v_staff_id,
    null
  );
end;
$$;

comment on function public.staff_book_session_with_credits_for_client(uuid, uuid, uuid, uuid) is
  'Staff books with explicit reformer/mat packages. No public 14-day upper horizon; past sessions still blocked.';

-- ---------------------------------------------------------------------------
-- 4. Staff open slots — today and any future date (still respects recurring gate)
-- ---------------------------------------------------------------------------
create or replace function public.list_staff_open_slot_starts_for_day(
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
  perform private.assert_staff_may_book_for_client(auth.uid());

  if p_schedule_date < private.studio_today() then
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

comment on function public.list_staff_open_slot_starts_for_day(date, text, integer) is
  'Studio hourly slots for staff manual booking: today and any future date; past dates empty; recurring priority still applied inside the public window.';

grant execute on function public.list_staff_open_slot_starts_for_day(date, text, integer) to authenticated;

-- Soften staff assert inside list_staff: assert_staff_may_book_for_client requires a client id.
-- Use assert_recurring_staff / is_staff instead for slot listing.
create or replace function public.list_staff_open_slot_starts_for_day(
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
  if auth.uid() is null or not private.is_staff(auth.uid()) then
    raise exception 'Not authorised' using errcode = 'P0011';
  end if;

  if p_schedule_date < private.studio_today() then
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

-- ---------------------------------------------------------------------------
-- 5. Recurring priority gate respects first_occurrence_date
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
       and p_schedule_date >= sl.first_occurrence_date
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

-- ---------------------------------------------------------------------------
-- 6. add_recurring_prebook_schedule_line — require first_occurrence_date
-- ---------------------------------------------------------------------------
drop function if exists public.add_recurring_prebook_schedule_line(uuid, smallint, time, integer, integer);

create or replace function public.add_recurring_prebook_schedule_line(
  p_rule_id               uuid,
  p_day_of_week           smallint,
  p_start_time            time,
  p_first_occurrence_date date,
  p_duration_minutes      integer default 60,
  p_sort_order            integer default 0
)
returns public.recurring_prebook_schedule_lines
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line   public.recurring_prebook_schedule_lines;
  v_ranges jsonb;
  v_range  jsonb;
  v_ok     boolean := false;
  v_start_m integer;
  v_end_m   integer;
  v_cursor  integer;
  v_duration integer;
begin
  perform private.assert_recurring_staff();

  if p_day_of_week < 1 or p_day_of_week > 7 then
    raise exception 'day_of_week must be ISO 1 (Mon) … 7 (Sun)' using errcode = 'P0022';
  end if;

  if p_first_occurrence_date is null then
    raise exception 'First occurrence date is required' using errcode = 'P0038';
  end if;

  if p_first_occurrence_date < private.studio_today() then
    raise exception 'First occurrence date must be today or in the future' using errcode = 'P0038';
  end if;

  if extract(isodow from p_first_occurrence_date)::integer <> p_day_of_week then
    raise exception 'First occurrence date must match the selected weekday' using errcode = 'P0038';
  end if;

  if not exists (
    select 1 from public.recurring_prebook_rules
     where id = p_rule_id
       and status = 'active'
  ) then
    raise exception 'Recurring rule not found or not active' using errcode = 'P0019';
  end if;

  v_duration := greatest(15, coalesce(p_duration_minutes, 60));
  v_ranges := public.get_default_studio_hours(p_first_occurrence_date);

  if jsonb_array_length(v_ranges) = 0 then
    raise exception
      'This session is not available on the selected date. Choose another first occurrence date or session slot.'
      using errcode = 'P0039';
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
    v_cursor := v_start_m;
    while v_cursor + v_duration <= v_end_m loop
      if make_time(v_cursor / 60, v_cursor % 60, 0) = p_start_time then
        v_ok := true;
        exit;
      end if;
      v_cursor := v_cursor + v_duration;
    end loop;
    exit when v_ok;
  end loop;

  if not v_ok then
    raise exception
      'This session is not available on the selected date. Choose another first occurrence date or session slot.'
      using errcode = 'P0039';
  end if;

  insert into public.recurring_prebook_schedule_lines (
    rule_id, day_of_week, start_time, duration_minutes, is_active, sort_order, first_occurrence_date
  )
  values (
    p_rule_id, p_day_of_week, p_start_time, p_duration_minutes, true, p_sort_order, p_first_occurrence_date
  )
  returning * into v_line;

  return v_line;
exception
  when unique_violation then
    raise exception 'An active schedule line already exists for this weekday and start time'
      using errcode = 'P0023';
end;
$$;

comment on function public.add_recurring_prebook_schedule_line(uuid, smallint, time, date, integer, integer) is
  'Adds a weekly schedule line that begins on the exact first_occurrence_date (validated in studio timezone).';

grant execute on function public.add_recurring_prebook_schedule_line(uuid, smallint, time, date, integer, integer)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Skip validation — match line including first_occurrence_date
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

  if p_occurrence_date < private.studio_today() then
    raise exception 'Cannot skip a past occurrence' using errcode = 'P0031';
  end if;

  if not exists (
    select 1
      from public.recurring_prebook_schedule_lines sl
     where sl.rule_id = p_rule_id
       and sl.is_active = true
       and sl.day_of_week = extract(isodow from p_occurrence_date)::integer
       and sl.start_time = p_start_time
       and p_occurrence_date >= sl.first_occurrence_date
  ) then
    raise exception
      'Skip does not match an active schedule line for this recurring rule'
      using errcode = 'P0031';
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


-- ---------------------------------------------------------------------------
-- 8. Materialization + forecast respect first_occurrence_date
-- ---------------------------------------------------------------------------
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
           and v_cursor >= sl.first_occurrence_date
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
    and d::date >= sl.first_occurrence_date
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
    and d::date >= sl.first_occurrence_date
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


-- ---------------------------------------------------------------------------
-- 9. Error code comments
-- ---------------------------------------------------------------------------
comment on function public.add_recurring_prebook_schedule_line(uuid, smallint, time, date, integer, integer) is
  'Adds a weekly schedule line beginning on first_occurrence_date (P0038/P0039 on invalid date/slot).';

-- 10. Staff materialize listing respects first_occurrence_date
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
  v_end := private.public_booking_window_end_date();
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
  cross join generate_series(v_today, v_end, interval '1 day') as d
  left join public.recurring_prebook_materialization_log lg
    on lg.rule_id = r.id
   and lg.occurrence_starts_at = ((d::date + sl.start_time) at time zone 'Europe/Nicosia')
  where r.client_user_id = p_client_user_id
    and r.status = 'active'
    and sl.day_of_week = extract(isodow from d::date)::integer
    and d::date >= sl.first_occurrence_date
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
  'Planned/failed recurring occurrences with chronological token_health for staff materialize dialog.';

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
    and d::date >= sl.first_occurrence_date
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
