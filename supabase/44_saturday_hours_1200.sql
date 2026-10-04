-- =============================================================================
-- 44_saturday_hours_1200.sql — Default Saturday hours 07:00–12:00
--
-- RUN ORDER: After 12_studio_schedule.sql (function already exists).
-- Safe to re-run (CREATE OR REPLACE).
--
-- Changes only the built-in Saturday default used when no studio_day_schedule
-- row exists. Does not rewrite sessions, recurring lines, or per-day overrides.
-- Weekday hours and Sunday (closed) are unchanged.
-- =============================================================================

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
      jsonb_build_object('start', '07:00', 'end', '12:00')
    );
  else
    return '[]'::jsonb;
  end if;
end;
$$;

comment on function public.get_default_studio_hours(date) is
  'Built-in weekly studio hours used when no per-day override exists. Saturday is 07:00–12:00.';
