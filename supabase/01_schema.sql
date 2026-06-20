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
  -- Internal staff notes — visible to all authenticated users at the row level.
  -- TODO: Hide from clients by replacing direct table access with a security-barrier
  --       view that omits this column for non-staff (PostgreSQL RLS cannot filter columns).
  notes       text,
  status      text        not null default 'invited'
                check (status in ('invited', 'active', 'suspended')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table  public.profiles        is 'One profile per auth user. Auto-created on sign-up via trigger.';
comment on column public.profiles.notes  is 'Internal admin/owner notes. Currently visible to all authenticated users at the row level. TODO: expose via a security-barrier view to hide from clients.';
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
  class_type       text          not null default 'reformer'
                     check (class_type in ('reformer','mat')),
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

alter table public.packages
  add column if not exists class_type text not null default 'reformer'
  check (class_type in ('reformer','mat'));

comment on table  public.packages                  is 'Studio package / membership catalog.';
comment on column public.packages.class_type       is 'Class category this package can book: reformer or mat.';
comment on column public.packages.credits_included is 'Credits bundled; NULL = unlimited.';
comment on column public.packages.validity_days    is 'Days from purchase until expiry; NULL = never expires.';
comment on column public.packages.max_per_user     is 'Max purchases per client; NULL = unlimited. Set 1 for intro offers.';

create trigger set_packages_updated_at
  before update on public.packages
  for each row execute procedure extensions.moddatetime(updated_at);

-- =============================================================================
-- TABLE: session_cards
-- Bookable class templates displayed before clients choose a slot.
-- =============================================================================
create table if not exists public.session_cards (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null,
  description      text        not null,
  session_type     text        not null
                     check (session_type in ('reformer','mat','private','intro')),
  duration_minutes integer     not null default 60
                     check (duration_minutes between 15 and 180),
  instructor_name  text,
  image_src        text,
  capacity         integer     not null default 6 check (capacity > 0),
  credits_required integer     not null default 1 check (credits_required > 0),
  reformer_credits_required integer not null default 1 check (reformer_credits_required >= 0),
  mat_credits_required      integer not null default 0 check (mat_credits_required >= 0),
  sort_order       integer     not null default 0,
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.session_cards
  add column if not exists reformer_credits_required integer not null default 1
    check (reformer_credits_required >= 0),
  add column if not exists mat_credits_required integer not null default 0
    check (mat_credits_required >= 0);

comment on table public.session_cards is
  'Public booking class templates. Admins/owners can add/remove cards without editing code.';
comment on column public.session_cards.reformer_credits_required is
  'How many reformer credits this card consumes when booked.';
comment on column public.session_cards.mat_credits_required is
  'How many mat credits this card consumes when booked.';

create trigger set_session_cards_updated_at
  before update on public.session_cards
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
  reformer_credits_required integer not null default 1 check (reformer_credits_required >= 0),
  mat_credits_required      integer not null default 0 check (mat_credits_required >= 0),
  status              text        not null default 'scheduled'
                        check (status in ('scheduled','cancelled','completed')),
  cancellation_reason text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint sessions_ends_after_starts check (ends_at > starts_at),
  constraint sessions_positive_capacity check (capacity > 0),
  constraint sessions_positive_credits  check (credits_required > 0)
);

alter table public.sessions
  add column if not exists reformer_credits_required integer not null default 1
    check (reformer_credits_required >= 0),
  add column if not exists mat_credits_required integer not null default 0
    check (mat_credits_required >= 0);

update public.sessions
   set reformer_credits_required = 0,
       mat_credits_required = credits_required
 where session_type = 'mat'
   and reformer_credits_required = 1
   and mat_credits_required = 0;

comment on table  public.sessions                  is 'Scheduled Pilates classes and private sessions.';
comment on column public.sessions.credits_required is 'Credits deducted from client package on booking. Default 1.';
comment on column public.sessions.reformer_credits_required is 'Reformer credits required to book this session.';
comment on column public.sessions.mat_credits_required      is 'Mat credits required to book this session.';
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
-- TABLE: booking_credit_charges
-- Exact package deductions for bookings that may require reformer and/or mat credits.
-- =============================================================================
create table if not exists public.booking_credit_charges (
  id              uuid        primary key default gen_random_uuid(),
  booking_id      uuid        not null references public.bookings(id) on delete cascade,
  user_package_id uuid        not null references public.user_packages(id) on delete restrict,
  class_type      text        not null check (class_type in ('reformer','mat')),
  credits_used    integer     not null check (credits_used > 0),
  created_at      timestamptz not null default now(),
  unique (booking_id, class_type)
);

comment on table public.booking_credit_charges is
  'Per-booking credit deductions, used for mixed reformer/mat credit requirements and accurate refunds.';

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
create index if not exists idx_profiles_email     on public.profiles (email);
create index if not exists idx_profiles_full_name on public.profiles (full_name);
create index if not exists idx_profiles_status    on public.profiles (status);

-- user_roles — hit on EVERY query by is_admin() / is_staff() helpers
create index if not exists idx_user_roles_user_id  on public.user_roles (user_id);
create index if not exists idx_user_roles_role     on public.user_roles (role);
create index if not exists idx_user_roles_user_role on public.user_roles (user_id, role);

-- packages
create index if not exists idx_packages_is_active   on public.packages (is_active);
create index if not exists idx_packages_class_type  on public.packages (class_type);

-- session_cards
create index if not exists idx_session_cards_active_type
  on public.session_cards (is_active, session_type, sort_order);

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

-- booking_credit_charges
create index if not exists idx_booking_credit_charges_booking
  on public.booking_credit_charges (booking_id);
create index if not exists idx_booking_credit_charges_user_package
  on public.booking_credit_charges (user_package_id);
