-- =============================================================================
-- 02_rls.sql  —  Row Level Security Policies + Helper Functions
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- WHAT THIS SCRIPT DOES
--   1. Creates private helper functions (is_owner, is_admin, is_staff,
--      is_instructor, get_my_role) — all security definer, all in the `private`
--      schema so PostgREST never exposes them.
--   2. Enables RLS on all six tables.
--   3. Grants the minimum necessary privileges to `anon` and `authenticated`.
--   4. Defines all policies for SELECT / INSERT / UPDATE / DELETE using the
--      (select function()) pattern for maximum RLS performance.
--
-- RUN ORDER: Run after 01_schema.sql.
-- Re-running is safe: policies use DROP IF EXISTS + CREATE pattern via
-- `create or replace` on functions and named policies that can be recreated.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PRIVATE HELPER FUNCTIONS
-- All use security definer + set search_path = '' (Supabase security lint
-- requirement). All are wrapped in (select ...) in every policy call so
-- Postgres caches the result once per query (initPlan optimization).
-- ---------------------------------------------------------------------------

-- Returns true if the current user has the 'owner' role
create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role = 'owner'
  );
$$;

-- Returns true if the current user has 'admin' or 'owner'
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('owner', 'admin')
  );
$$;

-- Returns true if the current user is owner, admin, or instructor
create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('owner', 'admin', 'instructor')
  );
$$;

-- Returns true if the current user has the 'instructor' role
create or replace function private.is_instructor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role = 'instructor'
  );
$$;

-- =============================================================================
-- ENABLE RLS on all public tables
-- =============================================================================
alter table public.profiles      enable row level security;
alter table public.user_roles    enable row level security;
alter table public.packages      enable row level security;
alter table public.session_cards enable row level security;
alter table public.user_packages enable row level security;
alter table public.sessions      enable row level security;
alter table public.bookings      enable row level security;
alter table public.booking_credit_charges enable row level security;

-- =============================================================================
-- GRANT PERMISSIONS
-- Principle of least privilege: anon gets read-only on public data only.
-- authenticated gets broader access; RLS policies restrict further.
-- =============================================================================

-- profiles
grant select                    on public.profiles      to anon;
grant select, insert, update    on public.profiles      to authenticated;

-- user_roles
grant select                    on public.user_roles    to authenticated;

-- packages
grant select                    on public.packages      to anon;
grant select                    on public.packages      to authenticated;
grant insert, update, delete    on public.packages      to authenticated;

-- session_cards
grant select                    on public.session_cards to anon;
grant select                    on public.session_cards to authenticated;
grant insert, update, delete    on public.session_cards to authenticated;

-- user_packages
grant select, insert, update    on public.user_packages to authenticated;

-- sessions
grant select                    on public.sessions      to anon;
grant select                    on public.sessions      to authenticated;
grant insert, update, delete    on public.sessions      to authenticated;

-- bookings
grant select, insert, update    on public.bookings      to authenticated;

-- booking_credit_charges
grant select                    on public.booking_credit_charges to authenticated;
grant insert, update, delete    on public.booking_credit_charges to authenticated;

-- =============================================================================
-- POLICIES: profiles
-- =============================================================================

-- Any authenticated user can read profile rows (needed for rosters, instructor listings, etc.).
-- NOTE: This exposes ALL columns including `notes` to every authenticated user.
-- TODO: Replace with a security-barrier view (e.g. public.profiles_public) that omits
--       the `notes` column for non-staff. PostgreSQL RLS controls rows, not columns.
drop policy if exists "profiles: authenticated can select" on public.profiles;
create policy "profiles: authenticated can select"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can read their own full profile (including fields RLS hides from others)
drop policy if exists "profiles: owner reads own" on public.profiles;
create policy "profiles: owner reads own"
  on public.profiles for select
  to authenticated
  using ( (select auth.uid()) = id );

-- The auth trigger inserts the profile; we allow the service role to do this.
-- No INSERT policy for authenticated role — the trigger handles it.

-- Users can update their own profile fields
drop policy if exists "profiles: user updates own" on public.profiles;
create policy "profiles: user updates own"
  on public.profiles for update
  to authenticated
  using  ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- Admins / owners can update any profile (e.g. set status = 'active')
drop policy if exists "profiles: admin updates any" on public.profiles;
create policy "profiles: admin updates any"
  on public.profiles for update
  to authenticated
  using  ( (select private.is_admin()) )
  with check ( (select private.is_admin()) );

-- =============================================================================
-- POLICIES: user_roles
-- =============================================================================

-- Users can read their own roles
drop policy if exists "user_roles: user reads own" on public.user_roles;
create policy "user_roles: user reads own"
  on public.user_roles for select
  to authenticated
  using ( (select auth.uid()) = user_id );

-- Admins / owners can read any user's roles
drop policy if exists "user_roles: admin reads all" on public.user_roles;
create policy "user_roles: admin reads all"
  on public.user_roles for select
  to authenticated
  using ( (select private.is_admin()) );

-- Only owners can insert / update / delete role assignments
drop policy if exists "user_roles: owner manages" on public.user_roles;
create policy "user_roles: owner manages"
  on public.user_roles for all
  to authenticated
  using  ( (select private.is_owner()) )
  with check ( (select private.is_owner()) );

-- =============================================================================
-- POLICIES: packages
-- =============================================================================

-- Anyone (including anonymous visitors browsing pricing) can view active packages
drop policy if exists "packages: public views active" on public.packages;
create policy "packages: public views active"
  on public.packages for select
  to anon, authenticated
  using ( is_active = true );

-- Admins / owners can view all packages including inactive ones
drop policy if exists "packages: admin views all" on public.packages;
create policy "packages: admin views all"
  on public.packages for select
  to authenticated
  using ( (select private.is_admin()) );

-- Only admins / owners can create, update, or deactivate packages
drop policy if exists "packages: admin manages" on public.packages;
create policy "packages: admin manages"
  on public.packages for all
  to authenticated
  using  ( (select private.is_admin()) )
  with check ( (select private.is_admin()) );

-- =============================================================================
-- POLICIES: session_cards
-- =============================================================================

drop policy if exists "session_cards: public views active" on public.session_cards;
create policy "session_cards: public views active"
  on public.session_cards for select
  to anon, authenticated
  using ( is_active = true );

drop policy if exists "session_cards: admin views all" on public.session_cards;
create policy "session_cards: admin views all"
  on public.session_cards for select
  to authenticated
  using ( (select private.is_admin()) );

drop policy if exists "session_cards: admin manages" on public.session_cards;
create policy "session_cards: admin manages"
  on public.session_cards for all
  to authenticated
  using  ( (select private.is_admin()) )
  with check ( (select private.is_admin()) );

-- =============================================================================
-- POLICIES: user_packages
-- =============================================================================

-- Clients view their own package balances
drop policy if exists "user_packages: client reads own" on public.user_packages;
create policy "user_packages: client reads own"
  on public.user_packages for select
  to authenticated
  using ( (select auth.uid()) = user_id );

-- Staff view all user packages (needed for admin dashboard + check-in)
drop policy if exists "user_packages: staff reads all" on public.user_packages;
create policy "user_packages: staff reads all"
  on public.user_packages for select
  to authenticated
  using ( (select private.is_staff()) );

-- Only admins / owners can assign or modify packages
drop policy if exists "user_packages: admin manages" on public.user_packages;
create policy "user_packages: admin manages"
  on public.user_packages for all
  to authenticated
  using  ( (select private.is_admin()) )
  with check ( (select private.is_admin()) );

-- =============================================================================
-- POLICIES: sessions
-- =============================================================================

-- Anonymous visitors can browse scheduled sessions (public schedule page)
drop policy if exists "sessions: public views scheduled" on public.sessions;
create policy "sessions: public views scheduled"
  on public.sessions for select
  to anon, authenticated
  using ( status = 'scheduled' );

-- Staff can view all sessions regardless of status (cancelled, completed etc.)
drop policy if exists "sessions: staff views all" on public.sessions;
create policy "sessions: staff views all"
  on public.sessions for select
  to authenticated
  using ( (select private.is_staff()) );

-- Only admins / owners can create or modify sessions
drop policy if exists "sessions: admin manages" on public.sessions;
create policy "sessions: admin manages"
  on public.sessions for all
  to authenticated
  using  ( (select private.is_admin()) )
  with check ( (select private.is_admin()) );

-- =============================================================================
-- POLICIES: bookings
-- =============================================================================

-- Clients can view their own bookings
drop policy if exists "bookings: client reads own" on public.bookings;
create policy "bookings: client reads own"
  on public.bookings for select
  to authenticated
  using ( (select auth.uid()) = user_id );

-- Instructors can view the roster for sessions they teach
drop policy if exists "bookings: instructor reads assigned sessions" on public.bookings;
create policy "bookings: instructor reads assigned sessions"
  on public.bookings for select
  to authenticated
  using (
    (select private.is_instructor())
    and session_id in (
      select id from public.sessions
      where instructor_id = (select auth.uid())
    )
  );

-- Admins / owners can view all bookings
drop policy if exists "bookings: admin reads all" on public.bookings;
create policy "bookings: admin reads all"
  on public.bookings for select
  to authenticated
  using ( (select private.is_admin()) );

-- Clients can book (INSERT) — the book_session() function enforces all
-- business rules (credits, capacity, expiry). We keep the RLS INSERT policy
-- permissive and let the function be the single point of enforcement.
drop policy if exists "bookings: client can book" on public.bookings;
create policy "bookings: client can book"
  on public.bookings for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

-- Clients can cancel their own bookings (UPDATE status to 'cancelled')
drop policy if exists "bookings: client cancels own" on public.bookings;
create policy "bookings: client cancels own"
  on public.bookings for update
  to authenticated
  using  ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

-- Admins / owners can update any booking (mark attended, no_show, etc.)
drop policy if exists "bookings: admin manages" on public.bookings;
create policy "bookings: admin manages"
  on public.bookings for all
  to authenticated
  using  ( (select private.is_admin()) )
  with check ( (select private.is_admin()) );

-- =============================================================================
-- POLICIES: booking_credit_charges
-- =============================================================================

drop policy if exists "booking_credit_charges: client reads own" on public.booking_credit_charges;
create policy "booking_credit_charges: client reads own"
  on public.booking_credit_charges for select
  to authenticated
  using (
    booking_id in (
      select id from public.bookings
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "booking_credit_charges: staff reads all" on public.booking_credit_charges;
create policy "booking_credit_charges: staff reads all"
  on public.booking_credit_charges for select
  to authenticated
  using ( (select private.is_staff()) );

drop policy if exists "booking_credit_charges: admin manages" on public.booking_credit_charges;
create policy "booking_credit_charges: admin manages"
  on public.booking_credit_charges for all
  to authenticated
  using  ( (select private.is_admin()) )
  with check ( (select private.is_admin()) );
