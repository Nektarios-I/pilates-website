-- =============================================================================
-- 06_drop_all.sql  —  Full schema teardown
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- WHAT THIS SCRIPT DOES
--   Drops all objects created by numbered scripts 01–23: tables, functions, triggers,
--   policies (via CASCADE), the app_role enum, and the private schema.
--
-- DOES NOT: delete auth.users rows. Use 05_reset_data.sql for that.
--
-- USE CASE: Start completely fresh on dev/test before re-running 01_schema.sql.
--
-- WARNING: IRREVERSIBLE. Never run on production.
-- =============================================================================

do $$
begin
  raise notice '06_drop_all.sql: beginning full teardown...';
end;
$$;

-- ── 1. Auth trigger (lives on auth.users) ────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;

-- ── 2. Application tables (child-first; CASCADE drops policies/triggers) ───
drop table if exists public.contact_messages       cascade;
drop table if exists public.account_safety_mirror cascade;
drop table if exists public.recurring_prebook_materialization_log cascade;
drop table if exists public.recurring_prebook_skipped_occurrences cascade;
drop table if exists public.recurring_prebook_schedule_lines cascade;
drop table if exists public.recurring_prebook_rules cascade;
drop table if exists public.bookings            cascade;
drop table if exists public.booking_credit_charges cascade;
drop table if exists public.user_packages       cascade;
drop table if exists public.sessions            cascade;
drop table if exists public.staff_invites       cascade;
drop table if exists public.studio_day_schedule cascade;
drop table if exists public.session_cards       cascade;
drop table if exists public.packages            cascade;
drop table if exists public.user_roles          cascade;
drop table if exists public.profiles            cascade;

-- ── 3. Custom enum ───────────────────────────────────────────────────────────
drop type if exists public.app_role cascade;

-- ── 4. Public functions (schema + booking + schedule helpers) ────────────────
drop function if exists public.ensure_session_slot_at(date, text, text, text, integer, integer) cascade;
drop function if exists public.ensure_session_slot_at(date, text, text, text, integer, integer, integer, integer) cascade;
drop function if exists public.ensure_session_slot_at(date, text, text, text, integer) cascade;
drop function if exists public.ensure_session_slot(timestamptz, timestamptz, text, integer, integer) cascade;
drop function if exists public.ensure_session_slot(timestamptz, timestamptz, text, integer, integer, integer, integer) cascade;
drop function if exists public.ensure_session_slot(timestamptz, timestamptz, text, integer) cascade;
drop function if exists public.get_studio_hours_for_date(date)                       cascade;
drop function if exists public.get_default_studio_hours(date)                        cascade;
drop function if exists public.handle_new_user()                                     cascade;
drop function if exists public.handle_new_user_package()                             cascade;
drop function if exists public.handle_user_package_status()                          cascade;
drop function if exists public.book_session(uuid, uuid)                              cascade;
drop function if exists public.book_session_with_credits(uuid, uuid, uuid)           cascade;
drop function if exists public.cancel_booking(uuid, text)                              cascade;
drop function if exists public.get_active_packages(uuid)                             cascade;
drop function if exists public.get_session_roster(uuid)                              cascade;
drop function if exists public.has_role(uuid, text)                                  cascade;
drop function if exists public.expire_packages()                                     cascade;
drop function if exists public.finalize_past_bookings()                              cascade;

-- ── 5. Private RLS helper functions ──────────────────────────────────────────
drop function if exists public.staff_book_session_with_credits_for_client(uuid, uuid, uuid, uuid) cascade;
drop function if exists public.staff_book_session_for_client(uuid, uuid, uuid) cascade;
drop function if exists private.assert_staff_may_book_for_client(uuid) cascade;
drop function if exists private.book_session_core(uuid, uuid, uuid, uuid, boolean, boolean, text, uuid, uuid) cascade;
drop function if exists public.staff_materialize_recurring_prebooks() cascade;
drop function if exists public.staff_materialize_recurring_prebooks_for_client(uuid, jsonb) cascade;
drop function if exists public.staff_materialize_client_recurring_selection(uuid, jsonb) cascade;
drop function if exists public.list_client_materializable_occurrences(uuid) cascade;
drop function if exists public.materialize_recurring_prebooks() cascade;
drop function if exists public.retry_recurring_materialization(uuid) cascade;
drop function if exists public.list_recurring_prebook_attention(uuid) cascade;
drop function if exists public.get_recurring_prebook_forecast(uuid) cascade;
drop function if exists public.remove_recurring_prebook_skip(uuid) cascade;
drop function if exists public.add_recurring_prebook_skip(uuid, date, time, text) cascade;
drop function if exists public.list_recurring_prebook_skips(uuid) cascade;
drop function if exists public.list_recurring_prebook_schedule_lines(uuid) cascade;
drop function if exists public.deactivate_recurring_prebook_schedule_line(uuid) cascade;
drop function if exists public.update_recurring_prebook_schedule_line(uuid, smallint, time, integer, integer) cascade;
drop function if exists public.list_staff_open_slot_starts_for_day(date, text, integer) cascade;
drop function if exists public.add_recurring_prebook_schedule_line(uuid, smallint, time, date, integer, integer) cascade;
drop function if exists public.add_recurring_prebook_schedule_line(uuid, smallint, time, integer, integer) cascade;
drop function if exists public.list_recurring_prebook_rules(uuid) cascade;
drop function if exists public.deactivate_recurring_prebook_rule(uuid) cascade;
drop function if exists public.delete_recurring_prebook_rule(uuid) cascade;
drop function if exists public.update_recurring_prebook_rule(uuid, uuid, text) cascade;
drop function if exists public.create_recurring_prebook_rule(uuid, uuid, text) cascade;
drop function if exists private.normalize_occurrence_time(text) cascade;
drop function if exists private.normalize_occurrence_date(text) cascade;
drop function if exists private.recurring_log_has_active_booking(public.recurring_prebook_materialization_log) cascade;
drop function if exists private.materialize_recurring_occurrence(uuid, uuid, date, timestamptz, timestamptz, uuid) cascade;
drop function if exists private.pick_client_packages_for_session(uuid, integer, integer) cascade;
drop function if exists private.map_booking_exception_to_failure(text, text) cascade;
drop function if exists private.time_to_hh24_mi(time) cascade;
drop function if exists private.schedule_line_end_time(time, integer) cascade;
drop function if exists private.assert_client_user(uuid) cascade;
drop function if exists private.assert_recurring_staff() cascade;
drop function if exists private.recurring_window_end_date() cascade;
drop function if exists public.list_open_slot_starts_for_day(date, text, integer) cascade;
drop function if exists private.recurring_blocks_public_booking(date, time, text) cascade;
drop function if exists private.public_booking_window_end_date() cascade;
drop function if exists private.public_booking_horizon_days() cascade;
drop function if exists private.try_allocate_forecast_tokens(integer, integer, integer, integer) cascade;
drop function if exists private.allocate_forecast_tokens(integer, integer, integer, integer) cascade;
drop function if exists private.client_simulated_credit_pool(uuid, text) cascade;
drop function if exists public.delete_recurring_prebook_rule(uuid) cascade;
drop function if exists private.recurring_materialization_horizon_days() cascade;
drop function if exists private.studio_today() cascade;
drop function if exists private.user_has_active_booking_at_slot(uuid, timestamptz, timestamptz) cascade;
drop function if exists private.is_owner()      cascade;
drop function if exists private.is_admin()      cascade;
drop function if exists private.is_staff()      cascade;
drop function if exists private.is_instructor() cascade;

-- ── 6. Private schema ────────────────────────────────────────────────────────
drop schema if exists private cascade;

-- moddatetime extension is shared — leave it enabled (other objects may use it).

do $$
begin
  raise notice '06_drop_all.sql: teardown complete. Re-run 01_schema.sql onward.';
end;
$$;
