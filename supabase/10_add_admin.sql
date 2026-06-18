-- =============================================================================
-- 10_add_admin.sql  —  Seed Initial Admin Account
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- WHAT THIS SCRIPT DOES
--   Creates a single admin account for Nektarios Ioannou directly in auth.users,
--   updates the auto-created profile with name and phone, and assigns the
--   'admin' role in user_roles.
--
-- HOW TO RUN
--   Paste this entire script into the Supabase SQL Editor and click Run.
--   The SQL Editor runs as the `postgres` superuser and has write access to auth.users.
--
-- AFTER RUNNING
--   Go to /login on the site, enter nektar9988@gmail.com, and click "Send sign-in link".
--   A magic link will arrive by email — click it to complete sign-in.
--   No password is ever needed; the account uses magic link only.
--
-- SAFE TO RE-RUN
--   The script checks for an existing account by email and skips creation if
--   one already exists, then ensures the role assignment is up to date.
--
-- RUN ORDER: After 01–04 (schema + seed). Re-run after 05_reset_data.sql.
-- =============================================================================

create extension if not exists pgcrypto schema extensions;

do $$
declare
  v_user_id    uuid;
  v_existing   uuid;
begin
  -- ── Check if the account already exists ─────────────────────────────────
  select id into v_existing
    from auth.users
   where email = 'nektar9988@gmail.com';

  if v_existing is not null then
    raise notice 'Account already exists (id: %). Skipping auth.users insert.', v_existing;
    v_user_id := v_existing;
  else
    -- ── Create the auth user ───────────────────────────────────────────────
    -- The on_auth_user_created trigger will auto-create the profiles row.
    -- encrypted_password is a random bcrypt hash; this account is magic-link
    -- only so the actual password value is never used.
    v_user_id := gen_random_uuid();

    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_super_admin,
      is_sso_user
    ) values (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'nektar9988@gmail.com',
      -- Random bcrypt-format hash; password is never used (magic link only)
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', 'Nektarios Ioannou'),
      now(),
      now(),
      false,
      false
    );

    raise notice 'Created auth.users row (id: %).', v_user_id;
  end if;

  -- ── Update profile with name, phone, and active status ──────────────────
  -- The trigger creates the profile immediately on auth.users insert.
  -- We upsert here to handle both the fresh-create and re-run cases.
  update public.profiles
     set full_name = 'Nektarios Ioannou',
         phone     = '+357 97621017',
         status    = 'active'
   where id = v_user_id;

  if not found then
    -- Trigger may not have fired yet in some edge cases; insert manually.
    insert into public.profiles (id, email, full_name, phone, status)
    values (v_user_id, 'nektar9988@gmail.com', 'Nektarios Ioannou', '+357 97621017', 'active')
    on conflict (id) do update
      set full_name = excluded.full_name,
          phone     = excluded.phone,
          status    = excluded.status;
    raise notice 'Profile row created manually (trigger may not have fired).';
  else
    raise notice 'Profile updated: name, phone, status=active.';
  end if;

  -- ── Assign admin role ────────────────────────────────────────────────────
  insert into public.user_roles (user_id, role)
  values (v_user_id, 'admin')
  on conflict (user_id, role) do nothing;

  raise notice 'Admin role assigned.';
  raise notice '=== Done. User ID: % ===', v_user_id;
  raise notice 'Sign in at /login with: nektar9988@gmail.com';
end;
$$;
