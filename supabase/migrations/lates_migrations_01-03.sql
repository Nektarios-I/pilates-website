-- =============================================================================
-- 01_schema.sql  —  Core Schema
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- WHAT THIS SCRIPT DOES
--   Enables the moddatetime extension, creates the app_role ENUM, creates all
--   six core tables (profiles, user_roles, packages, user_packages, sessions,
--   bookings), installs auto-trigger for updated_at on every table, installs
--   the auth-user → profile auto-trigger, and creates all performance indexes.
--
-- RUN ORDER: Run this FIRST on a clean project.
-- Every statement uses IF NOT EXISTS / OR REPLACE so re-runs are safe.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSION
-- moddatetime supplies the moddatetime() trigger function that auto-stamps
-- updated_at on every UPDATE. Supabase bundles it; we just enable it.
-- ---------------------------------------------------------------------------
create extension if not exists moddatetime schema extensions;

-- ---------------------------------------------------------------------------
-- PRIVATE SCHEMA
-- Security-definer helper functions must NOT live in an API-exposed schema.
-- We place all of them in `private` so PostgREST never exposes them directly.
-- ---------------------------------------------------------------------------
create schema if not exists private;

-- ---------------------------------------------------------------------------
-- CUSTOM TYPE  —  app_role
-- ENUM gives compile-time type safety for the four permanent roles.
-- Other status fields use text + CHECK so values can be added without a type
-- migration.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('owner', 'admin', 'instructor', 'client');
  end if;
end;
$$;

-- =============================================================================
-- TABLE: profiles
-- One row per auth.users entry, created automatically by the trigger below.
-- =============================================================================
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade not null,
  email       text        not null unique,
  full_name   text,
  phone       text,
  avatar_url  text,
  -- Internal staff notes — excluded from client-facing RLS SELECT policies.
  notes       text,
  status      text        not null default 'invited'
                check (status in ('invited', 'active', 'suspended')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table  public.profiles        is 'One profile per auth user. Auto-created on sign-up via trigger.';
comment on column public.profiles.notes  is 'Internal admin/owner notes — not visible to clients via RLS.';
comment on column public.profiles.status is 'invited → active (set by admin/owner) → suspended.';

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure extensions.moddatetime(updated_at);

-- =============================================================================
-- TABLE: user_roles
-- Role assignments for every user.  A single user may hold multiple roles
-- (e.g. owner who also teaches: owner + instructor).
-- =============================================================================
create table if not exists public.user_roles (
  id          bigint          generated always as identity primary key,
  user_id     uuid            not null references public.profiles(id) on delete cascade,
  role        public.app_role not null,
  created_at  timestamptz     not null default now(),
  unique (user_id, role)
);

comment on table public.user_roles is 'Role assignments. See app_role enum for valid values.';

-- =============================================================================
-- TABLE: packages
-- Studio product catalog — classes that clients can be assigned or purchase.
-- =============================================================================
create table if not exists public.packages (
  id               uuid          primary key default gen_random_uuid(),
  name             text          not null,
  description      text,
  -- credit_pack  : fixed credits, expire after validity_days
  -- monthly      : credits reset monthly (subscription)
  -- unlimited    : no credit cap; validity_days = subscription length
  -- intro_offer  : set max_per_user = 1 to enforce one-per-client
  -- drop_in      : single session, credits_included = 1
  package_type     text          not null
                     check (package_type in
                       ('credit_pack','monthly','unlimited','intro_offer','drop_in')),
  credits_included integer,              -- NULL = unlimited
  validity_days    integer,              -- NULL = never expires
  price            numeric(10,2) not null default 0,
  max_per_user     integer,              -- NULL = no cap; 1 = intro offer guard
  sort_order       integer       not null default 0,
  is_active        boolean       not null default true,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

comment on table  public.packages                  is 'Studio package / membership catalog.';
comment on column public.packages.credits_included is 'Credits bundled; NULL = unlimited.';
comment on column public.packages.validity_days    is 'Days from purchase until expiry; NULL = never expires.';
comment on column public.packages.max_per_user     is 'Max purchases per client; NULL = unlimited. Set 1 for intro offers.';

create trigger set_packages_updated_at
  before update on public.packages
  for each row execute procedure extensions.moddatetime(updated_at);

-- =============================================================================
-- TABLE: user_packages
-- Packages owned by / assigned to a client with a live credit balance.
-- =============================================================================
create table if not exists public.user_packages (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references public.profiles(id) on delete cascade,
  package_id        uuid        not null references public.packages(id) on delete restrict,
  -- NULL = unlimited (mirrors packages.credits_included = NULL).
  credits_remaining integer,
  purchased_at      timestamptz not null default now(),
  starts_at         timestamptz not null default now(),
  -- Auto-calculated by handle_new_user_package trigger; can be admin-overridden.
  expires_at        timestamptz,
  status            text        not null default 'active'
                      check (status in ('active','expired','used_up','cancelled')),
  -- Optional: Stripe PaymentIntent ID or other external payment reference.
  payment_ref       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table  public.user_packages                   is 'A package owned by a client, with live credit balance.';
comment on column public.user_packages.credits_remaining is 'Decremented on booking; NULL = unlimited. Auto-set from package on INSERT.';
comment on column public.user_packages.expires_at        is 'Auto-calculated on INSERT from packages.validity_days + starts_at.';

create trigger set_user_packages_updated_at
  before update on public.user_packages
  for each row execute procedure extensions.moddatetime(updated_at);

-- =============================================================================
-- TABLE: sessions
-- Bookable Pilates classes and private sessions.
-- =============================================================================
create table if not exists public.sessions (
  id                  uuid        primary key default gen_random_uuid(),
  title               text        not null,
  description         text,
  session_type        text        not null
                        check (session_type in ('reformer','mat','private','intro')),
  -- ON DELETE SET NULL: deleting an instructor does NOT cascade-delete sessions.
  instructor_id       uuid        references public.profiles(id) on delete set null,
  location            text,
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,
  capacity            integer     not null default 10,
  -- Credits deducted from client package on booking.
  -- Set > 1 for premium sessions (e.g. private = 2 credits).
  credits_required    integer     not null default 1,
  status              text        not null default 'scheduled'
                        check (status in ('scheduled','cancelled','completed')),
  cancellation_reason text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint sessions_ends_after_starts check (ends_at > starts_at),
  constraint sessions_positive_capacity check (capacity > 0),
  constraint sessions_positive_credits  check (credits_required > 0)
);

comment on table  public.sessions                  is 'Scheduled Pilates classes and private sessions.';
comment on column public.sessions.credits_required is 'Credits deducted from client package on booking. Default 1.';
comment on column public.sessions.capacity         is 'Max confirmed (non-waitlisted) bookings. Set 1 for private sessions.';

create trigger set_sessions_updated_at
  before update on public.sessions
  for each row execute procedure extensions.moddatetime(updated_at);

-- =============================================================================
-- TABLE: bookings
-- Join record between a client, a session, and the package used to pay.
-- =============================================================================
create table if not exists public.bookings (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references public.profiles(id)       on delete cascade,
  session_id          uuid        not null references public.sessions(id)       on delete restrict,
  user_package_id     uuid        not null references public.user_packages(id)  on delete restrict,
  status              text        not null default 'booked'
                        check (status in ('booked','waitlisted','cancelled','attended','no_show')),
  -- Snapshot of credits_required at booking time — used for accurate refunds
  -- even if sessions.credits_required changes later.
  credits_used        integer     not null default 1,
  booked_at           timestamptz not null default now(),
  cancelled_at        timestamptz,
  cancellation_reason text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table  public.bookings              is 'A client booking for a session, paid via a specific user_package.';
comment on column public.bookings.credits_used is 'Snapshot of credits_required at booking time — used for accurate refunds.';

-- Partial unique index: only ONE active booking per (client, session).
-- Cancelled rows are excluded so clients can re-book after cancelling.
create unique index if not exists bookings_one_active_per_session
  on public.bookings (user_id, session_id)
  where status in ('booked', 'waitlisted');

create trigger set_bookings_updated_at
  before update on public.bookings
  for each row execute procedure extensions.moddatetime(updated_at);

-- =============================================================================
-- TRIGGER FUNCTIONS
-- =============================================================================

-- ── 1. Auto-create a profiles row when auth.users gets a new entry ──────────
-- security definer: runs as the function owner (postgres) to bypass RLS.
-- set search_path = '': prevents search-path injection attacks.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    'invited'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. On INSERT to user_packages: auto-fill credits_remaining and expires_at
create or replace function public.handle_new_user_package()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_validity_days    integer;
  v_credits_included integer;
begin
  select validity_days, credits_included
    into v_validity_days, v_credits_included
    from public.packages
   where id = new.package_id;

  if new.expires_at is null and v_validity_days is not null then
    new.expires_at := new.starts_at + (v_validity_days || ' days')::interval;
  end if;

  if new.credits_remaining is null then
    new.credits_remaining := v_credits_included;
  end if;

  return new;
end;
$$;

create trigger on_user_package_insert
  before insert on public.user_packages
  for each row execute procedure public.handle_new_user_package();

-- ── 3. On UPDATE to user_packages: auto-transition status when exhausted ────
create or replace function public.handle_user_package_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.credits_remaining is not null and new.credits_remaining <= 0 then
    new.status := 'used_up';
  end if;

  if new.expires_at is not null
     and new.expires_at < now()
     and new.status = 'active' then
    new.status := 'expired';
  end if;

  return new;
end;
$$;

create trigger on_user_package_update
  before update on public.user_packages
  for each row execute procedure public.handle_user_package_status();

-- =============================================================================
-- INDEXES
-- Every column used in RLS USING clauses, WHERE, or JOIN must be indexed.
-- Missing indexes are the #1 source of slow RLS on busy tables.
-- =============================================================================

-- profiles
create index if not exists idx_profiles_email   on public.profiles (email);
create index if not exists idx_profiles_status  on public.profiles (status);

-- user_roles — hit on EVERY query by is_admin() / is_staff() helpers
create index if not exists idx_user_roles_user_id  on public.user_roles (user_id);
create index if not exists idx_user_roles_role     on public.user_roles (role);
create index if not exists idx_user_roles_user_role on public.user_roles (user_id, role);

-- packages
create index if not exists idx_packages_is_active   on public.packages (is_active);

-- user_packages
create index if not exists idx_user_packages_user_id    on public.user_packages (user_id);
create index if not exists idx_user_packages_status     on public.user_packages (status);
create index if not exists idx_user_packages_expires_at on public.user_packages (expires_at);

-- sessions
create index if not exists idx_sessions_starts_at     on public.sessions (starts_at);
create index if not exists idx_sessions_instructor_id on public.sessions (instructor_id);
create index if not exists idx_sessions_status        on public.sessions (status);
create index if not exists idx_sessions_type          on public.sessions (session_type);

-- bookings
create index if not exists idx_bookings_user_id       on public.bookings (user_id);
create index if not exists idx_bookings_session_id    on public.bookings (session_id);
create index if not exists idx_bookings_status        on public.bookings (status);
create index if not exists idx_bookings_user_package  on public.bookings (user_package_id);

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
alter table public.user_packages enable row level security;
alter table public.sessions      enable row level security;
alter table public.bookings      enable row level security;

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

-- user_packages
grant select, insert, update    on public.user_packages to authenticated;

-- sessions
grant select                    on public.sessions      to anon;
grant select                    on public.sessions      to authenticated;
grant insert, update, delete    on public.sessions      to authenticated;

-- bookings
grant select, insert, update    on public.bookings      to authenticated;

-- =============================================================================
-- POLICIES: profiles
-- =============================================================================

-- Any authenticated user can read basic profile info (needed for rosters etc.)
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
-- 03_functions.sql  —  Business Logic Functions
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- WHAT THIS SCRIPT DOES
--   All functions use SECURITY DEFINER so they bypass RLS internally and run
--   atomically.  They are the single enforcement point for all booking rules.
--
--   book_session()      — create a booking, decrement credits, handle waitlist
--   cancel_booking()    — cancel and refund credits
--   get_active_packages() — list a user's usable packages with balances
--   get_session_roster()  — instructor / admin view of who booked a session
--   has_role()          — public helper: check if a user has a given role
--   expire_packages()   — scheduled/manual job to mark stale packages expired
--
-- RUN ORDER: Run after 02_rls.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- book_session(p_session_id, p_user_package_id)
--
-- Validates and creates a booking.  Returns the new booking row.
-- Raises exceptions with descriptive codes on every failure condition.
-- ---------------------------------------------------------------------------
create or replace function public.book_session(
  p_session_id      uuid,
  p_user_package_id uuid
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id         uuid;
  v_session         public.sessions%rowtype;
  v_user_package    public.user_packages%rowtype;
  v_confirmed_count integer;
  v_new_booking     public.bookings;
  v_status          text;
begin
  -- ── 1. Identify caller ──────────────────────────────────────────────────
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  -- ── 2. Load and validate the session ────────────────────────────────────
  select * into v_session
    from public.sessions
   where id = p_session_id
     for update;                        -- lock the row for capacity check

  if not found then
    raise exception 'Session not found' using errcode = 'P0002';
  end if;

  if v_session.status != 'scheduled' then
    raise exception 'Session is not available for booking (status: %)', v_session.status
      using errcode = 'P0003';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'Cannot book a session that has already started'
      using errcode = 'P0004';
  end if;

  -- ── 3. Load and validate the user_package ───────────────────────────────
  select * into v_user_package
    from public.user_packages
   where id = p_user_package_id
     and user_id = v_user_id
     for update;                        -- lock for credit decrement

  if not found then
    raise exception 'Package not found or does not belong to you'
      using errcode = 'P0005';
  end if;

  if v_user_package.status != 'active' then
    raise exception 'Package is not active (status: %)', v_user_package.status
      using errcode = 'P0006';
  end if;

  if v_user_package.expires_at is not null and v_user_package.expires_at < now() then
    raise exception 'Package has expired' using errcode = 'P0007';
  end if;

  if v_user_package.credits_remaining is not null
     and v_user_package.credits_remaining < v_session.credits_required then
    raise exception 'Insufficient credits (have %, need %)',
      v_user_package.credits_remaining, v_session.credits_required
      using errcode = 'P0008';
  end if;

  -- ── 4. Check capacity for waitlist logic ────────────────────────────────
  select count(*) into v_confirmed_count
    from public.bookings
   where session_id = p_session_id
     and status = 'booked';

  if v_confirmed_count >= v_session.capacity then
    v_status := 'waitlisted';
  else
    v_status := 'booked';
  end if;

  -- ── 5. Deduct credits (only for confirmed bookings, not waitlisted) ──────
  if v_status = 'booked' then
    update public.user_packages
       set credits_remaining = case
             when credits_remaining is null then null   -- unlimited
             else credits_remaining - v_session.credits_required
           end
     where id = p_user_package_id;
  end if;

  -- ── 6. Insert the booking ────────────────────────────────────────────────
  insert into public.bookings (
    user_id, session_id, user_package_id, status, credits_used, booked_at
  )
  values (
    v_user_id, p_session_id, p_user_package_id,
    v_status, v_session.credits_required, now()
  )
  returning * into v_new_booking;

  return v_new_booking;
end;
$$;

comment on function public.book_session is
  'Atomically validates and creates a booking. Handles capacity, credits, expiry, and waitlist.';

-- ---------------------------------------------------------------------------
-- cancel_booking(p_booking_id, p_reason)
--
-- Cancels a booking and refunds credits if the original status was 'booked'.
-- Waitlisted bookings are cancelled without any credit impact.
-- ---------------------------------------------------------------------------
create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_reason     text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id     uuid;
  v_booking     public.bookings%rowtype;
  v_cancelled   public.bookings%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  -- Load and lock booking
  select * into v_booking
    from public.bookings
   where id = p_booking_id
     for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0010';
  end if;

  -- Admins / owners can cancel any booking; clients only their own
  if v_booking.user_id != v_user_id then
    -- Allow if caller is admin or owner
    if not exists (
      select 1 from public.user_roles
       where user_id = v_user_id
         and role in ('admin', 'owner')
    ) then
      raise exception 'Not authorised to cancel this booking'
        using errcode = 'P0011';
    end if;
  end if;

  if v_booking.status not in ('booked', 'waitlisted') then
    raise exception 'Booking cannot be cancelled (status: %)', v_booking.status
      using errcode = 'P0012';
  end if;

  -- Refund credits only for confirmed (non-waitlisted) bookings
  if v_booking.status = 'booked' then
    update public.user_packages
       set credits_remaining = case
             when credits_remaining is null then null
             else credits_remaining + v_booking.credits_used
           end
     where id = v_booking.user_package_id
       and status = 'active';

    -- Re-activate if it was used_up and now has credits again
    update public.user_packages
       set status = 'active'
     where id = v_booking.user_package_id
       and status = 'used_up'
       and (credits_remaining is null or credits_remaining > 0);
  end if;

  -- Mark cancelled
  update public.bookings
     set status              = 'cancelled',
         cancelled_at        = now(),
         cancellation_reason = p_reason
   where id = p_booking_id
  returning * into v_cancelled;

  return v_cancelled;
end;
$$;

comment on function public.cancel_booking is
  'Cancels a booking and refunds credits for confirmed (non-waitlisted) bookings.';

-- ---------------------------------------------------------------------------
-- get_active_packages(p_user_id)
--
-- Returns the active, non-expired packages with remaining credits for a user.
-- Clients call this without arguments (defaults to auth.uid()).
-- Admins can pass any user_id.
-- ---------------------------------------------------------------------------
create or replace function public.get_active_packages(
  p_user_id uuid default null
)
returns table (
  user_package_id   uuid,
  package_id        uuid,
  package_name      text,
  package_type      text,
  credits_remaining integer,
  expires_at        timestamptz,
  status            text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_target_user uuid;
begin
  v_target_user := coalesce(p_user_id, auth.uid());

  -- Non-admins can only query their own packages
  if p_user_id is not null
     and p_user_id != auth.uid()
     and not exists (
       select 1 from public.user_roles
        where user_id = (select auth.uid())
          and role in ('owner', 'admin')
     )
  then
    raise exception 'Not authorised to view another user''s packages'
      using errcode = 'P0020';
  end if;

  return query
  select
    up.id,
    up.package_id,
    p.name,
    p.package_type,
    up.credits_remaining,
    up.expires_at,
    up.status
  from public.user_packages up
  join public.packages p on up.package_id = p.id
  where up.user_id = v_target_user
    and up.status = 'active'
    and (up.expires_at is null or up.expires_at > now())
    and (up.credits_remaining is null or up.credits_remaining > 0)
  order by up.expires_at asc nulls last;
end;
$$;

-- ---------------------------------------------------------------------------
-- get_session_roster(p_session_id)
--
-- Returns the confirmed + waitlisted attendees for a session.
-- Only accessible by the session's instructor, admins, or owners.
-- ---------------------------------------------------------------------------
create or replace function public.get_session_roster(
  p_session_id uuid
)
returns table (
  booking_id    uuid,
  user_id       uuid,
  full_name     text,
  email         text,
  status        text,
  booked_at     timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_caller uuid;
begin
  v_caller := auth.uid();

  -- Must be admin/owner OR the instructor of this specific session
  if not exists (
    select 1 from public.user_roles
     where user_id = v_caller
       and role in ('owner', 'admin')
  )
  and not exists (
    select 1 from public.sessions
     where id = p_session_id
       and instructor_id = v_caller
  ) then
    raise exception 'Not authorised to view this session roster'
      using errcode = 'P0030';
  end if;

  return query
  select
    b.id,
    b.user_id,
    pr.full_name,
    pr.email,
    b.status,
    b.booked_at
  from public.bookings b
  join public.profiles pr on pr.id = b.user_id
  where b.session_id = p_session_id
    and b.status in ('booked', 'waitlisted', 'attended', 'no_show')
  order by b.status, b.booked_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- has_role(p_user_id, p_role)
--
-- Public helper callable from the app layer to check a user's role.
-- Clients can only check their own role; admins can check any user.
-- ---------------------------------------------------------------------------
create or replace function public.has_role(
  p_user_id uuid,
  p_role    text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_user_id != (select auth.uid())
     and not exists (
       select 1 from public.user_roles
        where user_id = (select auth.uid())
          and role in ('owner', 'admin')
     )
  then
    raise exception 'Not authorised' using errcode = 'P0040';
  end if;

  return exists (
    select 1 from public.user_roles
     where user_id = p_user_id
       and role = p_role::public.app_role
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- expire_packages()
--
-- Marks all overdue packages as 'expired'.
-- Run on a schedule (e.g. Supabase pg_cron daily) or call manually.
-- ---------------------------------------------------------------------------
create or replace function public.expire_packages()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.user_packages
     set status = 'expired'
   where status  = 'active'
     and expires_at is not null
     and expires_at < now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.expire_packages is
  'Marks all expired active packages. Safe to call repeatedly. Returns count of rows updated.';
