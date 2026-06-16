-- Initial schema for Pilates studio auth, account, and booking foundation
-- This migration creates the core tables and RLS policies for V1

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- Purpose: Application-level user profile and membership state
-- One row per auth user
-- ============================================================================
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  phone text,
  status text not null default 'invited' check (status in ('invited', 'active', 'suspended')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile (name, phone only)
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Create function to auto-create profile on user creation
-- This will be triggered when a staff member creates a user account
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, status)
  values (new.id, new.email, 'invited');
  return new;
end;
$$;

-- Trigger to create profile when auth user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- USER_ROLES TABLE
-- Purpose: Role assignment (client, instructor, admin, owner)
-- Allows flexible role management separate from profile
-- ============================================================================
create table public.user_roles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  role text not null check (role in ('client', 'instructor', 'admin', 'owner')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, role)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- Users can read their own roles
create policy "Users can view own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- TODO: Admin/owner policies for role management will be added in admin milestone

-- ============================================================================
-- PACKAGES TABLE
-- Purpose: Define sellable/assignable studio offerings
-- ============================================================================
create table public.packages (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  package_type text not null check (package_type in ('monthly', 'credit_pack', 'intro_offer', 'unlimited')),
  credits_total integer,
  validity_days integer,
  price numeric(10, 2),
  is_active boolean default true not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on packages
alter table public.packages enable row level security;

-- Everyone can view active packages (for browsing pricing page)
create policy "Anyone can view active packages"
  on public.packages for select
  using (is_active = true);

-- TODO: Admin-only policies for package management will be added in admin milestone

-- ============================================================================
-- USER_PACKAGES TABLE
-- Purpose: Track which packages a user owns or has been assigned
-- ============================================================================
create table public.user_packages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  package_id uuid references public.packages on delete restrict not null,
  credits_remaining integer,
  starts_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  status text not null default 'active' check (status in ('active', 'expired', 'used_up', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on user_packages
alter table public.user_packages enable row level security;

-- Users can view their own packages
create policy "Users can view own packages"
  on public.user_packages for select
  using (auth.uid() = user_id);

-- TODO: Admin/staff policies for package assignment will be added in admin milestone

-- ============================================================================
-- SESSIONS TABLE
-- Purpose: Define bookable Pilates sessions/classes
-- ============================================================================
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  instructor_id uuid references public.profiles on delete set null,
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone not null,
  capacity integer not null default 10,
  session_type text not null check (session_type in ('reformer', 'mat', 'private', 'intro')),
  location text,
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint valid_time_range check (ends_at > starts_at)
);

-- Enable RLS on sessions
alter table public.sessions enable row level security;

-- Everyone can view scheduled sessions (for browsing schedule)
create policy "Anyone can view scheduled sessions"
  on public.sessions for select
  using (status = 'scheduled');

-- TODO: Instructor policies for viewing assigned sessions will be added in instructor milestone
-- TODO: Admin policies for session management will be added in admin milestone

-- ============================================================================
-- BOOKINGS TABLE
-- Purpose: Track booking relationships between users and sessions
-- ============================================================================
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  session_id uuid references public.sessions on delete restrict not null,
  user_package_id uuid references public.user_packages on delete restrict not null,
  status text not null default 'booked' check (status in ('booked', 'cancelled', 'waitlisted', 'attended', 'no_show')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, session_id)
);

-- Enable RLS on bookings
alter table public.bookings enable row level security;

-- Users can view their own bookings
create policy "Users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

-- TODO: Booking creation policy will be added in booking milestone
-- TODO: Booking cancellation policy will be added in booking milestone
-- TODO: Instructor policies for viewing session rosters will be added in instructor milestone

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has a specific role
create or replace function public.has_role(user_uuid uuid, role_name text)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.user_roles
    where user_id = user_uuid and role = role_name
  );
end;
$$;

-- Function to get user's active packages with remaining credits
create or replace function public.get_active_packages(user_uuid uuid)
returns table (
  package_id uuid,
  package_name text,
  credits_remaining integer,
  expires_at timestamp with time zone
)
language plpgsql
security definer
as $$
begin
  return query
  select
    up.package_id,
    p.name,
    up.credits_remaining,
    up.expires_at
  from public.user_packages up
  join public.packages p on up.package_id = p.id
  where up.user_id = user_uuid
    and up.status = 'active'
    and (up.expires_at is null or up.expires_at > now())
    and (up.credits_remaining is null or up.credits_remaining > 0);
end;
$$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

create index idx_profiles_email on public.profiles(email);
create index idx_profiles_status on public.profiles(status);
create index idx_user_roles_user_id on public.user_roles(user_id);
create index idx_user_roles_role on public.user_roles(role);
create index idx_user_packages_user_id on public.user_packages(user_id);
create index idx_user_packages_status on public.user_packages(status);
create index idx_sessions_starts_at on public.sessions(starts_at);
create index idx_sessions_instructor_id on public.sessions(instructor_id);
create index idx_sessions_status on public.sessions(status);
create index idx_bookings_user_id on public.bookings(user_id);
create index idx_bookings_session_id on public.bookings(session_id);
create index idx_bookings_status on public.bookings(status);
