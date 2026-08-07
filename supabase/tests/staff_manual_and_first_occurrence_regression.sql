-- Regression checklist for migration 41 (staff horizon + first occurrence).
-- Run manually in Supabase SQL editor after applying 41.

-- 1. Staff wrappers do not enforce public horizon (contract smoke).
-- Expect: staff_book_session_for_client body passes p_enforce_public_horizon = false.
-- select pg_get_functiondef('public.staff_book_session_for_client(uuid,uuid,uuid)'::regprocedure);

-- 2. Public wrappers still enforce horizon.
-- select pg_get_functiondef('public.book_session(uuid,uuid)'::regprocedure);

-- 3. first_occurrence_date column exists and is NOT NULL.
-- select column_name, is_nullable
--   from information_schema.columns
--  where table_schema = 'public'
--    and table_name = 'recurring_prebook_schedule_lines'
--    and column_name = 'first_occurrence_date';

-- 4. Reject past first occurrence (as staff JWT):
-- select public.add_recurring_prebook_schedule_line(
--   '<rule_id>', 1, '18:00', (private.studio_today() - 7), 60, 0
-- );
-- Expect: P0038

-- 5. Reject weekday mismatch:
-- select public.add_recurring_prebook_schedule_line(
--   '<rule_id>', 1, '18:00',
--   (select d::date from generate_series(private.studio_today(), private.studio_today() + 14, '1 day') d
--     where extract(isodow from d) = 2 limit 1),
--   60, 0
-- );
-- Expect: P0038

-- 6. Reject unavailable slot on date:
-- select public.add_recurring_prebook_schedule_line(
--   '<rule_id>', 1, '13:00',
--   (select d::date from generate_series(private.studio_today(), private.studio_today() + 21, '1 day') d
--     where extract(isodow from d) = 1 limit 1),
--   60, 0
-- );
-- Expect: P0039

-- 7. Accept valid first occurrence and ensure forecast starts on that date only.
-- select public.add_recurring_prebook_schedule_line(... valid ...);
-- select * from public.get_recurring_prebook_forecast('<rule_id>');
-- Expect: no occurrence_date < first_occurrence_date

-- 8. list_staff_open_slot_starts_for_day returns rows beyond public window (staff JWT).
-- select * from public.list_staff_open_slot_starts_for_day(
--   private.studio_today() + 21, 'reformer', 60
-- );
-- Expect: non-empty for open studio weekday

-- 9. list_open_slot_starts_for_day still empty beyond public window.
-- select * from public.list_open_slot_starts_for_day(
--   private.studio_today() + 21, 'reformer', 60
-- );
-- Expect: empty
