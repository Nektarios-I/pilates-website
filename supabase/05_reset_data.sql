-- =============================================================================
-- 05_reset_data.sql  —  Clear All Data (Preserve Schema)
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- WHAT THIS SCRIPT DOES
--   Deletes ALL rows from every application table in safe dependency order,
--   then re-inserts the package catalog from 04_seed.sql.
--   Schema, triggers, functions, RLS policies, and indexes are untouched.
--
-- USE CASE: Wipe test/dev data between test runs without dropping tables.
--
-- WARNING: This is DESTRUCTIVE. Never run against production.
--          Add a guard if you want extra protection.
-- =============================================================================

do $$
begin
  -- ── Safety guard ──────────────────────────────────────────────────────────
  -- This script is DESTRUCTIVE. You must explicitly opt in by running:
  --
  --   set app.allow_data_reset = 'true';
  --
  -- in the same session immediately before executing this script.
  -- In Supabase's hosted SQL editor, add that line at the top of the query tab.
  -- Never configure this setting permanently in production.
  -- ──────────────────────────────────────────────────────────────────────────
  if current_setting('app.allow_data_reset', true) is distinct from 'true' then
    raise exception
      E'SAFETY GUARD: reset_data.sql is blocked.\n'
      'Run this first in the same session:\n'
      '  set app.allow_data_reset = ''true'';\n'
      'Never run this script against production data.';
  end if;

  raise notice 'reset_data.sql: safety check passed — clearing all application data...';
  raise notice 'NOTE: auth.users rows are NOT deleted. Orphaned auth emails will block re-invites unless handled by the app or cleaned manually.';
end;
$$;

-- Truncate in dependency order (children first).
-- CASCADE handles any FK references we may have missed.
-- RESTART IDENTITY resets bigint identity sequences (user_roles.id).
truncate table
  public.bookings,
  public.user_packages,
  public.sessions,
  public.user_roles,
  public.profiles

restart identity
cascade;

-- packages.id is UUID (not identity) — truncate separately
truncate table public.packages restart identity cascade;

-- Re-seed the standard package catalog so the app is usable immediately
insert into public.packages (id, name, description, package_type,
  credits_included, validity_days, price, max_per_user, sort_order, is_active)
values
  ('a0000000-0000-0000-0000-000000000001','Intro Class',       'Your first Pilates class — free.', 'intro_offer', 1,    30,  0.00, 1,    1, true),
  ('a0000000-0000-0000-0000-000000000002','Drop-In Class',     'One class, no strings attached.',  'drop_in',     1,    30, 20.00, null, 2, true),
  ('a0000000-0000-0000-0000-000000000003','5-Class Pack',      'Five classes within 60 days.',     'credit_pack', 5,    60, 90.00, null, 3, true),
  ('a0000000-0000-0000-0000-000000000004','10-Class Pack',     'Ten classes within 90 days.',      'credit_pack', 10,   90,165.00, null, 4, true),
  ('a0000000-0000-0000-0000-000000000005','Monthly Unlimited', 'Unlimited classes for 30 days.',   'unlimited',   null, 30,120.00, null, 5, true)
on conflict (id) do nothing;

do $$
begin
  raise notice 'reset_data.sql: done. All data cleared; packages re-seeded.';
end;
$$;
