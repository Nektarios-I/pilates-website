-- =============================================================================
-- 33_optional_profile_contact.sql — Optional profile email + unique phone
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- • profiles.email becomes optional (real email only when provided at signup)
-- • Internal auth-only emails are not stored on profiles
-- • Optional unique phone for lookup/sign-in
--
-- RUN ORDER: After 32_materialize_selection_schedule_line.sql
-- If phone index fails with duplicate key, run 34_fix_duplicate_profile_phones.sql
-- SAFE TO RE-RUN: Yes
-- =============================================================================

alter table public.profiles
  alter column email drop not null;

alter table public.profiles
  drop constraint if exists profiles_email_key;

create unique index if not exists idx_profiles_email_unique
  on public.profiles (lower(email))
  where email is not null;

-- Clear duplicate phones before unique index (keep oldest profile per number).
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
  if v_cleared > 0 then
    raise notice 'Cleared duplicate phone from % profile(s) before creating unique index.', v_cleared;
  end if;
end;
$$;

drop index if exists idx_profiles_phone_digits_unique;

create unique index idx_profiles_phone_digits_unique
  on public.profiles (regexp_replace(phone, '\D', '', 'g'))
  where phone is not null
    and btrim(phone) <> ''
    and length(regexp_replace(phone, '\D', '', 'g')) >= 7;

comment on column public.profiles.email is
  'Client-facing email when provided. NULL when the account signs in by name/phone only.';

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
