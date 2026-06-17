-- =============================================================================
-- 06_drop_all.sql  —  Drop Everything (Full Teardown)
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- WHAT THIS SCRIPT DOES
--   Removes ALL objects created by scripts 01–04 in reverse dependency order:
--   triggers, trigger functions, business functions, tables, the app_role ENUM,
--   the `private` schema, and the moddatetime extension.
--
-- USE CASE:
--   • Start fresh on a dev/test project.
--   • Rollback a failed migration run before re-applying.
--
-- WARNING: This is IRREVERSIBLE and DESTRUCTIVE.
--          All data will be permanently deleted.
--          NEVER run against production.
-- =============================================================================

do $$
begin
  raise notice 'drop_all.sql: beginning full teardown...';
end;
$$;

-- ── 1. Drop auth trigger (lives on auth.users, managed by us) ────────────────
drop trigger if exists on_auth_user_created on auth.users;

-- ── 2. Drop application tables in child-first order ─────────────────────────
--    CASCADE handles any lingering FK references.
drop table if exists public.bookings      cascade;
drop table if exists public.user_packages cascade;
drop table if exists public.sessions      cascade;
drop table if exists public.packages      cascade;
drop table if exists public.user_roles    cascade;
drop table if exists public.profiles      cascade;

-- ── 3. Drop the custom ENUM type ─────────────────────────────────────────────
drop type if exists public.app_role cascade;

-- ── 4. Drop all public business / trigger functions ──────────────────────────
drop function if exists public.handle_new_user()                          cascade;
drop function if exists public.handle_new_user_package()                  cascade;
drop function if exists public.handle_user_package_status()               cascade;
drop function if exists public.book_session(uuid, uuid)                   cascade;
drop function if exists public.cancel_booking(uuid, text)                 cascade;
drop function if exists public.get_active_packages(uuid)                  cascade;
drop function if exists public.get_session_roster(uuid)                   cascade;
drop function if exists public.has_role(uuid, text)                       cascade;
drop function if exists public.expire_packages()                          cascade;

-- ── 5. Drop private helper functions ─────────────────────────────────────────
drop function if exists private.is_owner()      cascade;
drop function if exists private.is_admin()      cascade;
drop function if exists private.is_staff()      cascade;
drop function if exists private.is_instructor() cascade;

-- ── 6. Drop the private schema ───────────────────────────────────────────────
drop schema if exists private cascade;

-- ── 7. Drop the moddatetime extension ────────────────────────────────────────
--    Only drop if you are sure nothing else in your project uses it.
--    Comment this out if other tables outside this project use moddatetime.
drop extension if exists moddatetime cascade;

do $$
begin
  raise notice 'drop_all.sql: teardown complete. Database is clean.';
end;
$$;
