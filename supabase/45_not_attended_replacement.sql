-- Not attended: one single-use replacement credit.
-- Payment tracking is intentionally not part of this script.
-- Expiry rule: expires_at = clock_timestamp() at issuance + interval '30 days'.

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in (
    'booked', 'waitlisted', 'cancelled', 'attended', 'no_show', 'finished', 'not_attended'
  ));

alter table public.packages
  add column if not exists is_replacement boolean not null default false;

create unique index if not exists packages_one_replacement_per_class
  on public.packages (class_type)
  where is_replacement;

insert into public.packages (
  name, description, class_type, package_type, credits_included, validity_days,
  price, max_per_user, sort_order, is_active, is_replacement
)
select
  'Replacement credit',
  'Single class issued when staff mark a booking Not attended. Not sold.',
  class_type,
  'drop_in',
  1,
  30,
  0,
  null,
  1000,
  false,
  true
from (values ('reformer'), ('mat')) as kinds(class_type)
where not exists (
  select 1 from public.packages p
   where p.is_replacement and p.class_type = kinds.class_type
);

alter table public.user_packages
  add column if not exists replacement_source_booking_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_packages_replacement_source_booking_id_key'
  ) then
    alter table public.user_packages
      add constraint user_packages_replacement_source_booking_id_key
      unique (replacement_source_booking_id);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'user_packages_replacement_source_booking_id_fkey'
  ) then
    alter table public.user_packages
      add constraint user_packages_replacement_source_booking_id_fkey
      foreign key (replacement_source_booking_id) references public.bookings(id) on delete restrict;
  end if;
end $$;

create table if not exists public.booking_outcome_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  prior_status text not null,
  new_status text not null,
  replacement_user_package_id uuid references public.user_packages(id) on delete restrict,
  action text not null check (action = 'not_attended'),
  occurred_at timestamptz not null default clock_timestamp(),
  unique (booking_id, action)
);

alter table public.booking_outcome_events enable row level security;

create table if not exists private.feature_gates (
  feature_key text primary key,
  enabled boolean not null,
  updated_at timestamptz not null default now()
);

insert into private.feature_gates (feature_key, enabled)
values ('not_attended_replacement', false)
on conflict (feature_key) do nothing;

create or replace function private.prevent_replacement_history_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Replacement and attendance history cannot be deleted'
    using errcode = 'P3010';
end;
$$;

drop trigger if exists user_packages_keep_replacement_history on public.user_packages;
create trigger user_packages_keep_replacement_history
  before delete on public.user_packages
  for each row
  when (old.replacement_source_booking_id is not null)
  execute function private.prevent_replacement_history_delete();

drop trigger if exists booking_outcome_events_no_delete on public.booking_outcome_events;
create trigger booking_outcome_events_no_delete
  before delete on public.booking_outcome_events
  for each row execute function private.prevent_replacement_history_delete();

drop trigger if exists packages_keep_replacement_catalog on public.packages;
create trigger packages_keep_replacement_catalog
  before delete on public.packages
  for each row
  when (old.is_replacement)
  execute function private.prevent_replacement_history_delete();

create or replace function private.pick_client_packages_for_session(
  p_client_user_id uuid,
  p_reformer_required integer,
  p_mat_required integer,
  out reformer_package_id uuid,
  out mat_package_id uuid,
  out has_sufficient_tokens boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_reformer_pkg uuid;
  v_mat_pkg uuid;
begin
  reformer_package_id := null;
  mat_package_id := null;
  has_sufficient_tokens := true;

  if coalesce(p_reformer_required, 0) > 0 then
    select up.id into v_reformer_pkg
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.user_id = p_client_user_id
       and p.class_type = 'reformer'
       and p.is_replacement = false
       and up.status = 'active'
       and (up.expires_at is null or up.expires_at > now())
       and (up.credits_remaining is null or up.credits_remaining >= p_reformer_required)
     order by up.expires_at asc nulls last, up.purchased_at asc
     limit 1;
    if v_reformer_pkg is null then
      has_sufficient_tokens := false;
      return;
    end if;
    reformer_package_id := v_reformer_pkg;
  end if;

  if coalesce(p_mat_required, 0) > 0 then
    select up.id into v_mat_pkg
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.user_id = p_client_user_id
       and p.class_type = 'mat'
       and p.is_replacement = false
       and up.status = 'active'
       and (up.expires_at is null or up.expires_at > now())
       and (up.credits_remaining is null or up.credits_remaining >= p_mat_required)
     order by up.expires_at asc nulls last, up.purchased_at asc
     limit 1;
    if v_mat_pkg is null then
      has_sufficient_tokens := false;
      reformer_package_id := null;
      return;
    end if;
    mat_package_id := v_mat_pkg;
  end if;
end;
$$;

create or replace function private.client_simulated_credit_pool(
  p_client_user_id uuid,
  p_class_type text
)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_total integer := 0;
  v_row record;
begin
  for v_row in
    select up.credits_remaining
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.user_id = p_client_user_id
       and up.status = 'active'
       and p.class_type = p_class_type
       and p.is_replacement = false
       and (up.expires_at is null or up.expires_at > now())
     order by up.expires_at asc nulls last, up.purchased_at asc
  loop
    if v_row.credits_remaining is null then
      return 1000000;
    end if;
    v_total := v_total + v_row.credits_remaining;
  end loop;
  return v_total;
end;
$$;

create or replace function private.client_simulated_credit_pool_as_of(
  p_client_user_id uuid,
  p_class_type text,
  p_as_of timestamptz
)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_total integer := 0;
  v_row record;
begin
  for v_row in
    select up.credits_remaining
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.user_id = p_client_user_id
       and up.status = 'active'
       and p.class_type = p_class_type
       and p.is_replacement = false
       and (up.expires_at is null or up.expires_at > p_as_of)
     order by up.expires_at asc nulls last, up.purchased_at asc
  loop
    if v_row.credits_remaining is null then
      return 1000000;
    end if;
    v_total := v_total + v_row.credits_remaining;
  end loop;
  return v_total;
end;
$$;

create or replace function public.mark_booking_not_attended(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_booking public.bookings;
  v_session public.sessions;
  v_charge_count integer;
  v_charge public.booking_credit_charges;
  v_package public.user_packages;
  v_catalog public.packages;
  v_replacement_catalog_id uuid;
  v_issued timestamptz;
  v_expires timestamptz;
  v_replacement_id uuid;
  v_existing_id uuid;
  v_existing_expires timestamptz;
  v_existing_type text;
begin
  if not coalesce((
    select enabled from private.feature_gates where feature_key = 'not_attended_replacement'
  ), false) then
    raise exception 'Not attended is disabled'
      using errcode = 'P3000';
  end if;

  v_actor := auth.uid();
  if v_actor is null or not private.is_staff() then
    raise exception 'Only instructors, admins, and owners can mark Not attended'
      using errcode = 'P3001';
  end if;

  select * into v_booking
    from public.bookings
   where id = p_booking_id
   for update;
  if not found then
    raise exception 'Booking not found' using errcode = 'P3002';
  end if;

  select up.id, up.expires_at, p.class_type
    into v_existing_id, v_existing_expires, v_existing_type
    from public.user_packages up
    join public.packages p on p.id = up.package_id
   where up.replacement_source_booking_id = p_booking_id;

  if v_existing_id is not null then
    if v_booking.status = 'not_attended' then
      return jsonb_build_object(
        'booking_id', p_booking_id,
        'replacement_user_package_id', v_existing_id,
        'class_type', v_existing_type,
        'expires_at', v_existing_expires,
        'already_issued', true
      );
    end if;
    raise exception 'Replacement linkage is inconsistent for this booking'
      using errcode = 'P3003';
  end if;

  select * into v_session
    from public.sessions
   where id = v_booking.session_id
   for update;
  if not found then
    raise exception 'Session not found' using errcode = 'P3002';
  end if;

  if v_session.status = 'cancelled' then
    raise exception 'The session is cancelled' using errcode = 'P3004';
  end if;
  if v_session.ends_at > clock_timestamp() then
    raise exception 'The session has not ended' using errcode = 'P3005';
  end if;
  if v_booking.status not in ('booked', 'finished') then
    raise exception 'This booking status cannot be marked Not attended'
      using errcode = 'P3006';
  end if;

  select count(*) into v_charge_count
    from public.booking_credit_charges
   where booking_id = v_booking.id;
  if v_charge_count <> 1 then
    raise exception 'Not attended requires exactly one credit charge'
      using errcode = 'P3007';
  end if;

  select * into v_charge
    from public.booking_credit_charges
   where booking_id = v_booking.id
   for update;

  if v_charge.credits_used <> 1 or v_booking.credits_used <> 1 then
    raise exception 'Not attended requires a single consumed credit'
      using errcode = 'P3008';
  end if;
  if v_charge.user_package_id <> v_booking.user_package_id then
    raise exception 'Credit charge does not match the booking package'
      using errcode = 'P3009';
  end if;

  select * into v_package
    from public.user_packages
   where id = v_booking.user_package_id
   for update;
  if v_package.user_id <> v_booking.user_id then
    raise exception 'Package owner does not match the booking'
      using errcode = 'P3009';
  end if;
  if v_package.credits_remaining is null then
    raise exception 'Unlimited packages cannot be marked Not attended'
      using errcode = 'P3008';
  end if;

  select * into v_catalog from public.packages where id = v_package.package_id;
  if v_catalog.class_type is distinct from v_charge.class_type
     or v_catalog.class_type not in ('reformer', 'mat') then
    raise exception 'Not attended requires one Reformer or Mat category'
      using errcode = 'P3009';
  end if;

  select id into v_replacement_catalog_id
    from public.packages
   where is_replacement and class_type = v_catalog.class_type;

  v_issued := clock_timestamp();
  v_expires := v_issued + interval '30 days';

  insert into public.user_packages (
    user_id, package_id, credits_remaining, purchased_at, starts_at, expires_at,
    status, replacement_source_booking_id
  ) values (
    v_booking.user_id, v_replacement_catalog_id, 1, v_issued, v_issued, v_expires,
    'active', v_booking.id
  )
  returning id into v_replacement_id;

  insert into public.booking_outcome_events (
    booking_id, actor_user_id, prior_status, new_status, replacement_user_package_id, action, occurred_at
  ) values (
    v_booking.id, v_actor, v_booking.status, 'not_attended', v_replacement_id, 'not_attended', v_issued
  );

  update public.bookings
     set status = 'not_attended'
   where id = v_booking.id;

  return jsonb_build_object(
    'booking_id', v_booking.id,
    'replacement_user_package_id', v_replacement_id,
    'class_type', v_catalog.class_type,
    'issued_at', v_issued,
    'expires_at', v_expires,
    'already_issued', false
  );
exception
  when unique_violation then
    select up.id, up.expires_at, p.class_type
      into v_existing_id, v_existing_expires, v_existing_type
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.replacement_source_booking_id = p_booking_id;
    if v_existing_id is null then
      raise;
    end if;
    return jsonb_build_object(
      'booking_id', p_booking_id,
      'replacement_user_package_id', v_existing_id,
      'class_type', v_existing_type,
      'expires_at', v_existing_expires,
      'already_issued', true
    );
end;
$$;

comment on function public.mark_booking_not_attended(uuid) is
  'Staff marks an ended booking Not attended and issues one 30-day replacement credit. Expiry is clock_timestamp() plus 30 days. Original package balance is unchanged.';

revoke all on function public.mark_booking_not_attended(uuid) from public;
grant execute on function public.mark_booking_not_attended(uuid) to authenticated;

revoke all on public.booking_outcome_events from public, anon, authenticated;
grant select on public.booking_outcome_events to authenticated;

drop policy if exists booking_outcome_events_staff_read on public.booking_outcome_events;
create policy booking_outcome_events_staff_read
  on public.booking_outcome_events
  for select to authenticated
  using ((select private.is_staff()));

drop policy if exists booking_outcome_events_client_read on public.booking_outcome_events;
create policy booking_outcome_events_client_read
  on public.booking_outcome_events
  for select to authenticated
  using (
    exists (
      select 1 from public.bookings b
       where b.id = booking_id
         and b.user_id = (select auth.uid())
    )
  );
