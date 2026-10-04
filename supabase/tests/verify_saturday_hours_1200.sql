-- Verify default Saturday hours after 44_saturday_hours_1200.sql.
-- Run in the Supabase SQL Editor. Read-only.
-- 2026-10-10 is a Saturday (ISO weekday 6).

-- Expected: [{"start":"07:00","end":"12:00"}]
select public.get_default_studio_hours('2026-10-10'::date) as saturday_hours;

-- Expected: weekday morning still ends at 12:00, afternoon 15:00–20:00.
-- [{"start":"06:00","end":"12:00"},{"start":"15:00","end":"20:00"}]
select public.get_default_studio_hours('2026-10-12'::date) as monday_hours;

-- Expected: [] (Sunday closed).
select public.get_default_studio_hours('2026-10-11'::date) as sunday_hours;

-- Expected slot starts for a 60-minute reformer class on that Saturday:
-- 07:00, 08:00, 09:00, 10:00, 11:00
-- Last slot ends at 12:00.
-- Empty result means the date is outside the public booking window
-- (before studio today, or after the public horizon). Pick a Saturday
-- inside the window if 2026-10-10 is no longer bookable.
select slot_start, slot_end
  from public.list_open_slot_starts_for_day(
    '2026-10-10'::date,
    'reformer',
    60
  )
 order by slot_start;
