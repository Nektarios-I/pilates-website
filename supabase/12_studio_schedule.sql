-- =============================================================================
-- 12_studio_schedule.sql — Per-day studio hours + session slot helper
--
-- RUN ORDER: After 03_functions.sql and 02_rls.sql.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TABLE: studio_day_schedule
-- Per-calendar-day working hours. When no row exists, app defaults apply:
--   Mon–Fri 06:00–12:00 & 15:00–20:00, Sat 07:00–11:00, Sun closed.
-- ---------------------------------------------------------------------------
create table if not exists public.studio_day_schedule (
  schedule_date date        primary key,
  is_closed     boolean     not null default false,
  -- [{"start":"06:00","end":"12:00"},{"start":"15:00","end":"20:00"}]
  time_ranges   jsonb       not null default '[]'::jsonb,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.studio_day_schedule is
  'Per-day studio open hours. Empty time_ranges with is_closed=false means use weekly defaults in the app.';

create trigger set_studio_day_schedule_updated_at
  before update on public.studio_day_schedule
  for each row execute procedure extensions.moddatetime(updated_at);

create index if not exists idx_studio_day_schedule_date
  on public.studio_day_schedule (schedule_date);

-- ---------------------------------------------------------------------------
-- FUNCTION: get_default_studio_hours(p_date date)
-- Returns the built-in weekly default for a date (ISO DOW: Mon=1 … Sun=7).
-- ---------------------------------------------------------------------------
create or replace function public.get_default_studio_hours(p_date date)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_dow integer;
begin
  v_dow := extract(isodow from p_date)::integer;

  if v_dow between 1 and 5 then
    return jsonb_build_array(
      jsonb_build_object('start', '06:00', 'end', '12:00'),
      jsonb_build_object('start', '15:00', 'end', '20:00')
    );
  elsif v_dow = 6 then
    return jsonb_build_array(
      jsonb_build_object('start', '07:00', 'end', '11:00')
    );
  else
    return '[]'::jsonb;
  end if;
end;
$$;

comment on function public.get_default_studio_hours(date) is
  'Built-in weekly studio hours used when no per-day override exists.';

-- ---------------------------------------------------------------------------
-- FUNCTION: get_studio_hours_for_date(p_date date)
-- Returns is_closed + resolved time_ranges for a calendar day.
-- ---------------------------------------------------------------------------
create or replace function public.get_studio_hours_for_date(p_date date)
returns table (
  is_closed   boolean,
  time_ranges jsonb,
  is_override boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_row public.studio_day_schedule%rowtype;
begin
  select * into v_row
    from public.studio_day_schedule
   where schedule_date = p_date;

  if found then
    return query
      select v_row.is_closed,
             case
               when v_row.is_closed then '[]'::jsonb
               when jsonb_array_length(v_row.time_ranges) > 0 then v_row.time_ranges
               else public.get_default_studio_hours(p_date)
             end,
             true;
    return;
  end if;

  return query
    select
      (jsonb_array_length(public.get_default_studio_hours(p_date)) = 0),
      public.get_default_studio_hours(p_date),
      false;
end;
$$;

grant execute on function public.get_default_studio_hours(date) to anon, authenticated;
grant execute on function public.get_studio_hours_for_date(date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- FUNCTION: ensure_session_slot
-- Creates (or returns) a scheduled reformer session for a 1-hour slot.
-- ---------------------------------------------------------------------------
drop function if exists public.ensure_session_slot(timestamptz, timestamptz, text, integer);
create or replace function public.ensure_session_slot(
  p_starts_at     timestamptz,
  p_ends_at       timestamptz,
  p_session_type  text default 'reformer',
  p_capacity      integer default 6,
  p_credits_required integer default 1
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_title      text;
begin
  if p_ends_at <= p_starts_at then
    raise exception 'Session end must be after start' using errcode = 'P0020';
  end if;

  if p_session_type not in ('reformer', 'mat', 'private', 'intro') then
    raise exception 'Invalid session type: %', p_session_type using errcode = 'P0021';
  end if;

  if p_capacity <= 0 then
    raise exception 'Capacity must be positive' using errcode = 'P0022';
  end if;

  if p_credits_required <= 0 then
    raise exception 'Credits required must be positive' using errcode = 'P0023';
  end if;

  select id into v_session_id
    from public.sessions
   where starts_at = p_starts_at
     and ends_at = p_ends_at
     and session_type = p_session_type
     and status = 'scheduled'
   limit 1;

  if v_session_id is not null then
    return v_session_id;
  end if;

  v_title := initcap(p_session_type) || ' · ' ||
             to_char(p_starts_at at time zone 'Europe/Nicosia', 'DD Mon HH24:MI');

  insert into public.sessions (
    title, session_type, starts_at, ends_at, capacity, credits_required, status
  )
  values (
    v_title, p_session_type, p_starts_at, p_ends_at, p_capacity, p_credits_required, 'scheduled'
  )
  returning id into v_session_id;

  return v_session_id;
end;
$$;

comment on function public.ensure_session_slot(timestamptz, timestamptz, text, integer, integer) is
  'Idempotently creates a scheduled session for a time slot. Used by the booking flow.';

grant execute on function public.ensure_session_slot(timestamptz, timestamptz, text, integer, integer)
  to authenticated;

-- ---------------------------------------------------------------------------
-- FUNCTION: ensure_session_slot_at (date + local time in Europe/Nicosia)
-- Preferred entry point from the booking UI.
-- ---------------------------------------------------------------------------
drop function if exists public.ensure_session_slot_at(date, text, text, text, integer);
create or replace function public.ensure_session_slot_at(
  p_schedule_date date,
  p_start_time    text,
  p_end_time      text,
  p_session_type  text default 'reformer',
  p_capacity      integer default 6,
  p_credits_required integer default 1
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_starts timestamptz;
  v_ends   timestamptz;
begin
  v_starts := (p_schedule_date + p_start_time::time) at time zone 'Europe/Nicosia';
  v_ends   := (p_schedule_date + p_end_time::time) at time zone 'Europe/Nicosia';

  return public.ensure_session_slot(v_starts, v_ends, p_session_type, p_capacity, p_credits_required);
end;
$$;

grant execute on function public.ensure_session_slot_at(date, text, text, text, integer, integer)
  to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: studio_day_schedule
-- ---------------------------------------------------------------------------
alter table public.studio_day_schedule enable row level security;

grant select on public.studio_day_schedule to anon, authenticated;
grant insert, update, delete on public.studio_day_schedule to authenticated;

drop policy if exists "studio_day_schedule: public read" on public.studio_day_schedule;
create policy "studio_day_schedule: public read"
  on public.studio_day_schedule for select
  to anon, authenticated
  using (true);

drop policy if exists "studio_day_schedule: admin manages" on public.studio_day_schedule;
create policy "studio_day_schedule: admin manages"
  on public.studio_day_schedule for all
  to authenticated
  using ( (select private.is_admin()) )
  with check ( (select private.is_admin()) );

drop policy if exists "studio_day_schedule: owner manages" on public.studio_day_schedule;
create policy "studio_day_schedule: owner manages"
  on public.studio_day_schedule for all
  to authenticated
  using ( (select private.is_owner()) )
  with check ( (select private.is_owner()) );

-- Allow staff to insert sessions via ensure_session_slot (security definer bypasses RLS on insert)
