-- =============================================================================
-- 11_staff_invites.sql — Pending staff-issued invitations
--
-- WHAT THIS SCRIPT DOES
--   Adds a public.staff_invites table used for invitation intent that should NOT
--   create a Supabase auth.users row immediately.
--
-- WHY THIS EXISTS
--   The "Email OTP" staff invite option is a product invitation record, not an
--   auth account creation action. The actual auth account should be created only
--   when the invited person begins the real sign-in/signup flow.
--
-- RUN ORDER
--   Run after 01_schema.sql because this table depends on public.app_role and
--   public.profiles.
-- =============================================================================

create table if not exists public.staff_invites (
  id          uuid            primary key default gen_random_uuid(),
  full_name   text            not null,
  email       text            not null,
  phone       text            not null,
  role        public.app_role not null,
  method      text            not null check (method in ('email_otp')),
  status      text            not null default 'pending'
                check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  issued_by   uuid            references public.profiles(id) on delete set null,
  accepted_by uuid            references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  created_at  timestamptz     not null default now(),
  updated_at  timestamptz     not null default now()
);

comment on table public.staff_invites is
  'Pending staff-issued invites that do not create auth.users rows immediately.';
comment on column public.staff_invites.method is
  'Currently email_otp only: staff records intent, invitee later completes real auth flow.';

create unique index if not exists staff_invites_one_pending_per_email
  on public.staff_invites (lower(email))
  where status = 'pending';

create index if not exists staff_invites_status_created_idx
  on public.staff_invites (status, created_at desc);

drop trigger if exists set_staff_invites_updated_at on public.staff_invites;
create trigger set_staff_invites_updated_at
  before update on public.staff_invites
  for each row execute procedure extensions.moddatetime(updated_at);

alter table public.staff_invites enable row level security;
