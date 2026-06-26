-- =============================================================================
-- 06_drop_all.sql  —  Full schema teardown
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- WHAT THIS SCRIPT DOES
--   Drops all objects created by scripts 01–12: tables, functions, triggers,
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

-- ── 5. Private RLS helper functions ──────────────────────────────────────────
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
