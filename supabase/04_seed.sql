-- =============================================================================
-- 04_seed.sql  —  Seed Data (Packages + Demo Users)
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- WHAT THIS SCRIPT DOES
--   Inserts the standard package catalog (safe to run multiple times via
--   ON CONFLICT DO NOTHING) and optional demo users / sessions.
--
--   IMPORTANT: The demo user rows are wrapped in a DO block that only runs
--   when the environment setting `app.seed_demo_data` is 'true'.
--   In production leave that setting unset — only packages will be seeded.
--
-- RUN ORDER: Run after 03_functions.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PACKAGES  (production data — always seeded)
-- ---------------------------------------------------------------------------
insert into public.packages (id, name, description, package_type,
  credits_included, validity_days, price, max_per_user, sort_order, is_active)
values
  -- Intro offer: one free trial class, max one per client
  (
    'a0000000-0000-0000-0000-000000000001',
    'Intro Class',
    'Your first Pilates class — free and commitment-free.',
    'intro_offer', 1, 30, 0.00, 1, 1, true
  ),
  -- Drop-in: single class pay-as-you-go
  (
    'a0000000-0000-0000-0000-000000000002',
    'Drop-In Class',
    'One class, no strings attached.',
    'drop_in', 1, 30, 20.00, null, 2, true
  ),
  -- 5-class credit pack
  (
    'a0000000-0000-0000-0000-000000000003',
    '5-Class Pack',
    'Five classes to use within 60 days.',
    'credit_pack', 5, 60, 90.00, null, 3, true
  ),
  -- 10-class credit pack
  (
    'a0000000-0000-0000-0000-000000000004',
    '10-Class Pack',
    'Ten classes to use within 90 days.',
    'credit_pack', 10, 90, 165.00, null, 4, true
  ),
  -- Monthly unlimited
  (
    'a0000000-0000-0000-0000-000000000005',
    'Monthly Unlimited',
    'Unlimited classes for 30 days.',
    'unlimited', null, 30, 120.00, null, 5, true
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- DEMO DATA  (development / staging only)
-- Only runs when: select set_config('app.seed_demo_data','true',false);
-- is executed before this script — or just comment-in the block below.
-- ---------------------------------------------------------------------------

/*
-- Uncomment this block to create demo users in dev/staging.
-- Never run in production.

do $$
declare
  v_owner_id      uuid := gen_random_uuid();
  v_admin_id      uuid := gen_random_uuid();
  v_instructor_id uuid := gen_random_uuid();
  v_client1_id    uuid := gen_random_uuid();
  v_session_id    uuid := gen_random_uuid();
begin

  -- pgcrypto is required for crypt() / gen_salt() used below.
  -- Supabase bundles it; this ensures it is enabled before we call it.
  create extension if not exists pgcrypto schema extensions;

  -- Insert auth users (bypasses normal sign-up flow for seeding)
  insert into auth.users (id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at)
  values
    (v_owner_id,      'owner@pilates.dev',      crypt('Test1234!', gen_salt('bf')), now(), '{"full_name":"Studio Owner"}',     now(), now()),
    (v_admin_id,      'admin@pilates.dev',       crypt('Test1234!', gen_salt('bf')), now(), '{"full_name":"Admin User"}',        now(), now()),
    (v_instructor_id, 'instructor@pilates.dev',  crypt('Test1234!', gen_salt('bf')), now(), '{"full_name":"Sofia Instructor"}',  now(), now()),
    (v_client1_id,    'client@pilates.dev',      crypt('Test1234!', gen_salt('bf')), now(), '{"full_name":"Alex Client"}',       now(), now())
  on conflict (id) do nothing;

  -- Profiles are auto-created by on_auth_user_created trigger.
  -- Mark them active so they can log in and book.
  update public.profiles set status = 'active'
   where id in (v_owner_id, v_admin_id, v_instructor_id, v_client1_id);

  -- Assign roles
  insert into public.user_roles (user_id, role) values
    (v_owner_id,      'owner'),
    (v_admin_id,      'admin'),
    (v_instructor_id, 'instructor'),
    (v_client1_id,    'client')
  on conflict (user_id, role) do nothing;

  -- Give the demo client a 5-class pack
  insert into public.user_packages (user_id, package_id)
  values (v_client1_id, 'a0000000-0000-0000-0000-000000000003');

  -- Create a demo session tomorrow at 10:00
  insert into public.sessions (id, title, session_type, instructor_id,
    starts_at, ends_at, capacity, credits_required, status)
  values (
    v_session_id,
    'Morning Reformer Flow',
    'reformer',
    v_instructor_id,
    (now() + interval '1 day')::date + time '10:00',
    (now() + interval '1 day')::date + time '11:00',
    8, 1, 'scheduled'
  );

  raise notice 'Demo seed complete. Owner: %, Instructor: %, Client: %',
    v_owner_id, v_instructor_id, v_client1_id;
end;
$$;
*/
