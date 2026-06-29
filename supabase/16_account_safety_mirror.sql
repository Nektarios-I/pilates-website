-- =============================================================================
-- 16_account_safety_mirror.sql — Account profile safety mirror (Phase 3)
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- PURPOSE
--   Dedicated mirror of account/profile data for operational safety.
--   NOT truncated by 05_reset_data.sql — survives normal dev data wipes.
--
-- RUN: Once on existing databases after 01–03 (and any prior migrations).
-- SAFE TO RE-RUN: Yes (idempotent DDL + upsert backfill).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TABLE: account_safety_mirror
-- ---------------------------------------------------------------------------
create table if not exists public.account_safety_mirror (
  id                  uuid        primary key default gen_random_uuid(),
  profile_id          uuid        not null unique references public.profiles(id) on delete cascade,
  email               text        not null,
  full_name           text,
  phone               text,
  avatar_url          text,
  status              text        not null,
  roles               text[]      not null default '{}',
  source_updated_at   timestamptz,
  first_synced_at     timestamptz not null default now(),
  last_synced_at      timestamptz not null default now()
);

comment on table public.account_safety_mirror is
  'Safety mirror of profiles + role snapshot. Excluded from 05_reset_data.sql.';

create index if not exists idx_account_safety_mirror_email
  on public.account_safety_mirror (email);

-- ---------------------------------------------------------------------------
-- SYNC FUNCTION (private — not exposed via PostgREST)
-- ---------------------------------------------------------------------------
create or replace function private.sync_account_safety_mirror(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_roles   text[];
begin
  select * into v_profile
    from public.profiles
   where id = p_profile_id;

  if not found then
    return;
  end if;

  select coalesce(array_agg(ur.role::text order by ur.role::text), '{}')
    into v_roles
    from public.user_roles ur
   where ur.user_id = p_profile_id;

  insert into public.account_safety_mirror (
    profile_id,
    email,
    full_name,
    phone,
    avatar_url,
    status,
    roles,
    source_updated_at,
    first_synced_at,
    last_synced_at
  )
  values (
    v_profile.id,
    v_profile.email,
    v_profile.full_name,
    v_profile.phone,
    v_profile.avatar_url,
    v_profile.status,
    v_roles,
    v_profile.updated_at,
    now(),
    now()
  )
  on conflict (profile_id) do update
    set email             = excluded.email,
        full_name         = excluded.full_name,
        phone             = excluded.phone,
        avatar_url        = excluded.avatar_url,
        status            = excluded.status,
        roles             = excluded.roles,
        source_updated_at = excluded.source_updated_at,
        last_synced_at    = now();
end;
$$;

comment on function private.sync_account_safety_mirror(uuid) is
  'Upserts one profile row (and role snapshot) into account_safety_mirror.';

-- ---------------------------------------------------------------------------
-- TRIGGERS — keep mirror current for new/updated profiles and role changes
-- ---------------------------------------------------------------------------
create or replace function public.trg_sync_account_safety_mirror_from_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.sync_account_safety_mirror(new.id);
  return new;
end;
$$;

drop trigger if exists sync_account_safety_mirror_on_profile on public.profiles;
create trigger sync_account_safety_mirror_on_profile
  after insert or update on public.profiles
  for each row execute procedure public.trg_sync_account_safety_mirror_from_profile();

create or replace function public.trg_sync_account_safety_mirror_from_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  v_user_id := coalesce(new.user_id, old.user_id);
  if v_user_id is not null then
    perform private.sync_account_safety_mirror(v_user_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_account_safety_mirror_on_user_roles on public.user_roles;
create trigger sync_account_safety_mirror_on_user_roles
  after insert or update or delete on public.user_roles
  for each row execute procedure public.trg_sync_account_safety_mirror_from_roles();

-- ---------------------------------------------------------------------------
-- BACKFILL — idempotent; safe to rerun after deploy or data import
-- ---------------------------------------------------------------------------
create or replace function public.backfill_account_safety_mirror()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_count      integer := 0;
begin
  for v_profile_id in select id from public.profiles order by created_at
  loop
    perform private.sync_account_safety_mirror(v_profile_id);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

comment on function public.backfill_account_safety_mirror() is
  'Syncs every profile into account_safety_mirror. Returns number of profiles processed.';

grant execute on function public.backfill_account_safety_mirror() to service_role;

-- ---------------------------------------------------------------------------
-- RLS — mirror is internal; no client access
-- ---------------------------------------------------------------------------
alter table public.account_safety_mirror enable row level security;

drop policy if exists account_safety_mirror_no_client_access on public.account_safety_mirror;
create policy account_safety_mirror_no_client_access
  on public.account_safety_mirror
  for all
  to authenticated
  using (false)
  with check (false);

-- ---------------------------------------------------------------------------
-- INITIAL BACKFILL (run once when applying this migration)
-- ---------------------------------------------------------------------------
select public.backfill_account_safety_mirror() as profiles_synced;
