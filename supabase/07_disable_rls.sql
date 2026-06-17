-- =============================================================================
-- 07_disable_rls.sql  —  Disable RLS on All Tables
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- WHAT THIS SCRIPT DOES
--   Disables Row Level Security on all six application tables.
--   Policies are NOT dropped — they are preserved so you can re-enable cleanly.
--
-- USE CASE (development / debugging ONLY):
--   • Debug a query as a non-admin without impersonation overhead.
--   • Run bulk admin operations via service role when RLS is blocking.
--   • Test data fixtures in a CI pipeline that runs as `postgres`.
--
-- WARNING:
--   With RLS disabled, ANY authenticated user can read/write ALL rows.
--   NEVER leave this applied in a production environment.
--   Run 08_enable_rls.sql immediately after your debugging session.
-- =============================================================================

do $$
begin
  raise warning
    'SECURITY WARNING: Disabling RLS on all tables. '
    'Run 08_enable_rls.sql when done. Never leave disabled in production.';
end;
$$;

alter table public.profiles      disable row level security;
alter table public.user_roles    disable row level security;
alter table public.packages      disable row level security;
alter table public.user_packages disable row level security;
alter table public.sessions      disable row level security;
alter table public.bookings      disable row level security;

-- Confirm current state
select
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles','user_roles','packages','user_packages','sessions','bookings')
order by tablename;
