-- Regression checklist for migration 42 (staff Materialize Now = 3-month preview).
-- Run after applying 42 in Supabase SQL editor.

-- 1. Helpers
-- select private.recurring_preview_end_date('2026-08-24');
-- expect 2026-11-24
-- select private.staff_materialize_window_end_date();
-- expect studio_today() + 3 months

-- 2. list_client_materializable_occurrences includes dates beyond 14 days when
--    they fall within a schedule line's first_occurrence_date … + 3 months.
-- select * from public.list_client_materializable_occurrences('<client_uuid>');

-- 3. Insufficient tokens still block (P0037) — unchanged.
-- Select more occurrences than credits allow → expect friendly insufficient message.

-- 4. Cron window unchanged:
-- select private.recurring_window_end_date();
-- expect studio_today() + 14
