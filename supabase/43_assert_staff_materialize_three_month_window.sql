-- =============================================================================
-- 43_assert_staff_materialize_three_month_window.sql
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- Idempotent safety net: re-asserts the three-month Materialize Now window if
-- migration 42 was missed or partially applied. Daily cron stays at 14 days.
--
-- RUN ORDER: After 42_staff_materialize_three_month_preview.sql (or instead of
-- 42 if 42 was never applied — this file alone is not enough; prefer running 42
-- fully, then this assert).
--
-- This script only verifies helpers exist and refreshes list/selection end dates.
-- Prefer re-running the full 42 file when Materialize Now still shows ~14 days.
-- SAFE TO RE-RUN: Yes.
-- =============================================================================

do $$
begin
  if to_regprocedure('private.recurring_preview_end_date(date)') is null
     or to_regprocedure('private.staff_materialize_window_end_date()') is null then
    raise exception
      'Migration 42 helpers missing. Run supabase/42_staff_materialize_three_month_preview.sql first.'
      using errcode = 'P0001';
  end if;
end;
$$;

-- Sanity: preview end is calendar months, not +14 days.
do $$
declare
  v_end date;
begin
  v_end := private.recurring_preview_end_date(private.studio_today());
  if v_end < private.studio_today() + 60 then
    raise exception
      'recurring_preview_end_date(%) looks too short (%). Expected ~3 calendar months.',
      private.studio_today(),
      v_end;
  end if;
end;
$$;

comment on function public.list_client_materializable_occurrences(uuid) is
  'Planned/failed recurring occurrences in each line three-calendar-month preview for staff Materialize Now (migration 42+).';
