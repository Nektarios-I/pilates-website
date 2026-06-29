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
-- RUN ORDER: After 03_functions.sql. See supabase/README.md for full setup order.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PACKAGES  (production data — always seeded)
-- ---------------------------------------------------------------------------
insert into public.packages (id, name, description, class_type, package_type,
  credits_included, validity_days, price, max_per_user, sort_order, is_active)
values
  (
    'b0000000-0000-0000-0000-000000000001',
    'Reformer · Single Class',
    'One reformer class.',
    'reformer', 'drop_in', 1, 30, 15.00, null, 1, true
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'Reformer · 1 Month · 2×/week',
    '8 reformer classes within 30 days.',
    'reformer', 'credit_pack', 8, 30, 100.00, null, 2, true
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'Reformer · 1 Month · 3×/week',
    '12 reformer classes within 30 days.',
    'reformer', 'credit_pack', 12, 30, 145.00, null, 3, true
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'Reformer · 1 Month · 4×/week',
    '16 reformer classes within 30 days.',
    'reformer', 'credit_pack', 16, 30, 185.00, null, 4, true
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'Reformer · 3 Months · 2×/week',
    '24 reformer classes within 90 days.',
    'reformer', 'credit_pack', 24, 90, 265.00, null, 5, true
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    'Reformer · 3 Months · 3×/week',
    '36 reformer classes within 90 days.',
    'reformer', 'credit_pack', 36, 90, 400.00, null, 6, true
  ),
  (
    'b0000000-0000-0000-0000-000000000007',
    'Reformer · 3 Months · 4×/week',
    '48 reformer classes within 90 days.',
    'reformer', 'credit_pack', 48, 90, 520.00, null, 7, true
  ),
  (
    'c0000000-0000-0000-0000-000000000001',
    'Mat · Single Class',
    'One mat Pilates class.',
    'mat', 'drop_in', 1, 30, 10.00, null, 101, true
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'Mat · 1 Month · 2×/week',
    '8 mat classes within 30 days.',
    'mat', 'credit_pack', 8, 30, 70.00, null, 102, true
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'Mat · 1 Month · 3×/week',
    '12 mat classes within 30 days.',
    'mat', 'credit_pack', 12, 30, 95.00, null, 103, true
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'Mat · 1 Month · 4×/week',
    '16 mat classes within 30 days.',
    'mat', 'credit_pack', 16, 30, 120.00, null, 104, true
  ),
  (
    'c0000000-0000-0000-0000-000000000005',
    'Mat · 3 Months · 2×/week',
    '24 mat classes within 90 days.',
    'mat', 'credit_pack', 24, 90, 195.00, null, 105, true
  ),
  (
    'c0000000-0000-0000-0000-000000000006',
    'Mat · 3 Months · 3×/week',
    '36 mat classes within 90 days.',
    'mat', 'credit_pack', 36, 90, 275.00, null, 106, true
  ),
  (
    'c0000000-0000-0000-0000-000000000007',
    'Mat · 3 Months · 4×/week',
    '48 mat classes within 90 days.',
    'mat', 'credit_pack', 48, 90, 350.00, null, 107, true
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  class_type = excluded.class_type,
  package_type = excluded.package_type,
  credits_included = excluded.credits_included,
  validity_days = excluded.validity_days,
  price = excluded.price,
  max_per_user = excluded.max_per_user,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.session_cards (
  id, title, description, session_type, duration_minutes, instructor_name,
  image_src, capacity, credits_required, reformer_credits_required,
  mat_credits_required, sort_order, is_active
)
values
  (
    'd0000000-0000-0000-0000-000000000001',
    'Reformer Pilates',
    'Small-group equipment class for strength, alignment, and controlled movement.',
    'reformer', 60, 'Panayiota or Irene', '/images/classes/reformer.webp', 6, 1, 1, 0, 1, true
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'Mat Pilates',
    'Floor-based Pilates focused on core strength, mobility, and breath.',
    'mat', 60, 'Panayiota or Irene', '/images/classes/mat.webp', 10, 1, 0, 1, 2, true
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  session_type = excluded.session_type,
  duration_minutes = excluded.duration_minutes,
  instructor_name = excluded.instructor_name,
  image_src = excluded.image_src,
  capacity = excluded.capacity,
  credits_required = excluded.credits_required,
  reformer_credits_required = excluded.reformer_credits_required,
  mat_credits_required = excluded.mat_credits_required,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

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
  values (v_client1_id, 'b0000000-0000-0000-0000-000000000003');

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
