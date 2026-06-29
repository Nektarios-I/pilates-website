-- =============================================================================
-- 17_booking_one_per_time_slot.sql — One active booking per time slot per client
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- RULE
--   A client may book multiple sessions on the same day, but not two sessions
--   that share the same starts_at + ends_at (e.g. parallel Reformer and Mat).
--   Enforced in book_session() and book_session_with_credits() via P0013.
--
-- RUN: Once on existing databases after 03_functions.sql.
-- SAFE TO RE-RUN: Yes (CREATE OR REPLACE).
-- =============================================================================

create or replace function private.user_has_active_booking_at_slot(
  p_user_id   uuid,
  p_starts_at timestamptz,
  p_ends_at   timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.bookings b
      join public.sessions s on s.id = b.session_id
     where b.user_id = p_user_id
       and b.status in ('booked', 'waitlisted')
       and s.starts_at = p_starts_at
       and s.ends_at = p_ends_at
  );
$$;

comment on function private.user_has_active_booking_at_slot(uuid, timestamptz, timestamptz) is
  'True when the user already has a booked or waitlisted session at the same time slot.';

-- book_session — add slot guard after session validation
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
  v_package_class_type text;
  v_required_credits integer;
  v_confirmed_count integer;
  v_new_booking     public.bookings;
  v_status          text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  select * into v_session
    from public.sessions
   where id = p_session_id
     for update;

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

  if private.user_has_active_booking_at_slot(v_user_id, v_session.starts_at, v_session.ends_at) then
    raise exception 'You already have a booking at this time slot'
      using errcode = 'P0013';
  end if;

  select * into v_user_package
    from public.user_packages
   where id = p_user_package_id
     and user_id = v_user_id
     for update;

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

  select p.class_type into v_package_class_type
    from public.packages p
   where p.id = v_user_package.package_id;

  v_required_credits := case v_package_class_type
    when 'reformer' then coalesce(v_session.reformer_credits_required, v_session.credits_required)
    when 'mat' then coalesce(v_session.mat_credits_required, v_session.credits_required)
    else 0
  end;

  if v_required_credits <= 0 then
    raise exception 'Selected package type is not required for this session'
      using errcode = 'P0009';
  end if;

  if v_user_package.credits_remaining is not null
     and v_user_package.credits_remaining < v_required_credits then
    raise exception 'Insufficient credits (have %, need %)',
      v_user_package.credits_remaining, v_required_credits
      using errcode = 'P0008';
  end if;

  select count(*) into v_confirmed_count
    from public.bookings
   where session_id = p_session_id
     and status = 'booked';

  if v_confirmed_count >= v_session.capacity then
    v_status := 'waitlisted';
  else
    v_status := 'booked';
  end if;

  if v_status = 'booked' then
    update public.user_packages
       set credits_remaining = case
             when credits_remaining is null then null
             else credits_remaining - v_required_credits
           end
     where id = p_user_package_id;
  end if;

  insert into public.bookings (
    user_id, session_id, user_package_id, status, credits_used, booked_at
  )
  values (
    v_user_id, p_session_id, p_user_package_id,
    v_status, v_required_credits, now()
  )
  returning * into v_new_booking;

  if v_status = 'booked' then
    insert into public.booking_credit_charges (
      booking_id, user_package_id, class_type, credits_used
    )
    values (
      v_new_booking.id, p_user_package_id, v_package_class_type, v_required_credits
    )
    on conflict (booking_id, class_type) do nothing;
  end if;

  return v_new_booking;
end;
$$;

-- book_session_with_credits — same slot guard
create or replace function public.book_session_with_credits(
  p_session_id uuid,
  p_reformer_user_package_id uuid default null,
  p_mat_user_package_id uuid default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_session public.sessions%rowtype;
  v_reformer_required integer;
  v_mat_required integer;
  v_reformer_package public.user_packages%rowtype;
  v_mat_package public.user_packages%rowtype;
  v_confirmed_count integer;
  v_status text;
  v_primary_package_id uuid;
  v_new_booking public.bookings;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  select * into v_session
    from public.sessions
   where id = p_session_id
     for update;

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

  if private.user_has_active_booking_at_slot(v_user_id, v_session.starts_at, v_session.ends_at) then
    raise exception 'You already have a booking at this time slot'
      using errcode = 'P0013';
  end if;

  v_reformer_required := coalesce(v_session.reformer_credits_required, 0);
  v_mat_required := coalesce(v_session.mat_credits_required, 0);

  if v_reformer_required <= 0 and v_mat_required <= 0 then
    raise exception 'This session has no credit requirement configured'
      using errcode = 'P0009';
  end if;

  if v_reformer_required > 0 then
    if p_reformer_user_package_id is null then
      raise exception 'A reformer package is required' using errcode = 'P0005';
    end if;

    select up.* into v_reformer_package
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.id = p_reformer_user_package_id
       and up.user_id = v_user_id
       and p.class_type = 'reformer'
     for update;

    if not found then
      raise exception 'Reformer package not found or does not belong to you'
        using errcode = 'P0005';
    end if;

    if v_reformer_package.status != 'active' then
      raise exception 'Reformer package is not active (status: %)', v_reformer_package.status
        using errcode = 'P0006';
    end if;

    if v_reformer_package.expires_at is not null and v_reformer_package.expires_at < now() then
      raise exception 'Reformer package has expired' using errcode = 'P0007';
    end if;

    if v_reformer_package.credits_remaining is not null
       and v_reformer_package.credits_remaining < v_reformer_required then
      raise exception 'Insufficient reformer credits (have %, need %)',
        v_reformer_package.credits_remaining, v_reformer_required
        using errcode = 'P0008';
    end if;
  end if;

  if v_mat_required > 0 then
    if p_mat_user_package_id is null then
      raise exception 'A mat package is required' using errcode = 'P0005';
    end if;

    select up.* into v_mat_package
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.id = p_mat_user_package_id
       and up.user_id = v_user_id
       and p.class_type = 'mat'
     for update;

    if not found then
      raise exception 'Mat package not found or does not belong to you'
        using errcode = 'P0005';
    end if;

    if v_mat_package.status != 'active' then
      raise exception 'Mat package is not active (status: %)', v_mat_package.status
        using errcode = 'P0006';
    end if;

    if v_mat_package.expires_at is not null and v_mat_package.expires_at < now() then
      raise exception 'Mat package has expired' using errcode = 'P0007';
    end if;

    if v_mat_package.credits_remaining is not null
       and v_mat_package.credits_remaining < v_mat_required then
      raise exception 'Insufficient mat credits (have %, need %)',
        v_mat_package.credits_remaining, v_mat_required
        using errcode = 'P0008';
    end if;
  end if;

  select count(*) into v_confirmed_count
    from public.bookings
   where session_id = p_session_id
     and status = 'booked';

  if v_confirmed_count >= v_session.capacity then
    v_status := 'waitlisted';
  else
    v_status := 'booked';
  end if;

  v_primary_package_id := coalesce(p_reformer_user_package_id, p_mat_user_package_id);

  if v_status = 'booked' then
    if v_reformer_required > 0 then
      update public.user_packages
         set credits_remaining = case
               when credits_remaining is null then null
               else credits_remaining - v_reformer_required
             end
       where id = p_reformer_user_package_id;
    end if;

    if v_mat_required > 0 then
      update public.user_packages
         set credits_remaining = case
               when credits_remaining is null then null
               else credits_remaining - v_mat_required
             end
       where id = p_mat_user_package_id;
    end if;
  end if;

  insert into public.bookings (
    user_id, session_id, user_package_id, status, credits_used, booked_at
  )
  values (
    v_user_id, p_session_id, v_primary_package_id,
    v_status, v_reformer_required + v_mat_required, now()
  )
  returning * into v_new_booking;

  if v_status = 'booked' and v_reformer_required > 0 then
    insert into public.booking_credit_charges (
      booking_id, user_package_id, class_type, credits_used
    )
    values (
      v_new_booking.id, p_reformer_user_package_id, 'reformer', v_reformer_required
    );
  end if;

  if v_status = 'booked' and v_mat_required > 0 then
    insert into public.booking_credit_charges (
      booking_id, user_package_id, class_type, credits_used
    )
    values (
      v_new_booking.id, p_mat_user_package_id, 'mat', v_mat_required
    );
  end if;

  return v_new_booking;
end;
$$;
