-- =============================================================================
-- 34_fix_duplicate_profile_phones.sql — Dedupe phones, then add unique index
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- Run this if migration 33 failed on idx_profiles_phone_digits_unique because
-- the same phone number exists on more than one profile.
--
-- Keeps the phone on the oldest profile (created_at, then id). Clears phone on
-- newer duplicates so staff can re-enter a unique number if needed.
--
-- SAFE TO RE-RUN: Yes
-- =============================================================================

do $$
declare
  v_cleared integer;
begin
  with normalized as (
    select
      p.id,
      row_number() over (
        partition by regexp_replace(p.phone, '\D', '', 'g')
        order by p.created_at asc, p.id asc
      ) as rn
    from public.profiles p
    where p.phone is not null
      and btrim(p.phone) <> ''
      and length(regexp_replace(p.phone, '\D', '', 'g')) >= 7
  )
  update public.profiles p
     set phone = null
    from normalized n
   where p.id = n.id
     and n.rn > 1;

  get diagnostics v_cleared = row_count;
  raise notice 'Cleared duplicate phone from % profile(s). Re-enter unique numbers in staff tools if needed.', v_cleared;
end;
$$;

drop index if exists idx_profiles_phone_digits_unique;

create unique index idx_profiles_phone_digits_unique
  on public.profiles (regexp_replace(phone, '\D', '', 'g'))
  where phone is not null
    and btrim(phone) <> ''
    and length(regexp_replace(phone, '\D', '', 'g')) >= 7;

-- Finish migration 33 if the script stopped before these ran:
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_email text;
begin
  if new.email ilike '%@accounts.corehouse.internal' then
    v_profile_email := null;
  else
    v_profile_email := new.email;
  end if;

  insert into public.profiles (id, email, full_name, phone, status)
  values (
    new.id,
    v_profile_email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'invited'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on column public.profiles.email is
  'Client-facing email when provided. NULL when the account signs in by name/phone only.';

-- Optional: inspect profiles that still share a phone after cleanup (should return 0 rows)
-- select regexp_replace(phone, '\D', '', 'g') as digits, count(*)
--   from public.profiles
--  where phone is not null
--  group by 1
-- having count(*) > 1;
