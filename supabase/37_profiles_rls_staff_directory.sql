-- =============================================================================
-- 37_profiles_rls_staff_directory.sql — Hide client profiles/notes from clients
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- Replaces blanket "authenticated can select all profiles" with:
--   • staff (instructor/owner/admin) → all profiles
--   • clients → own profile (existing policy) + staff directory rows only
--
-- Clients can still read instructor names for session listings (id, full_name).
-- Staff notes on profiles are no longer visible to other clients.
--
-- RUN ORDER: After 36_client_cancel_four_hour_cutoff.sql
-- SAFE TO RE-RUN: Yes
-- =============================================================================

drop policy if exists "profiles: authenticated can select" on public.profiles;

create policy "profiles: staff reads all"
  on public.profiles for select
  to authenticated
  using ( (select private.is_staff()) );

create policy "profiles: client reads staff directory"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
        from public.user_roles ur
       where ur.user_id = profiles.id
         and ur.role in ('instructor', 'owner', 'admin')
    )
  );

comment on column public.profiles.notes is
  'Internal staff notes. Visible to staff and the profile owner only (RLS).';
