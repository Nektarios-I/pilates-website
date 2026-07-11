-- =============================================================================
-- 20_staff_booking_rpc.sql — Staff-on-behalf booking RPCs
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- Staff (instructor / admin / owner) book for clients via security-definer RPCs.
-- Fail on full capacity (no waitlist). Writes booking_source = staff_manual.
--
-- RUN ORDER: After 19_booking_core_refactor.sql.
-- SAFE TO RE-RUN: Yes (CREATE OR REPLACE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- private.assert_staff_may_book_for_client(p_client_user_id)
-- ---------------------------------------------------------------------------
create or replace function private.assert_staff_may_book_for_client(p_client_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  if not (select private.is_staff()) then
    raise exception 'Not authorised to book on behalf of clients'
      using errcode = 'P0011';
  end if;

  if not exists (
    select 1
      from public.user_roles
     where user_id = p_client_user_id
       and role = 'client'
  ) then
    raise exception 'Target user is not a client account'
      using errcode = 'P0017';
  end if;
end;
$$;

comment on function private.assert_staff_may_book_for_client(uuid) is
  'Ensures caller is staff and target user holds the client role.';

-- ---------------------------------------------------------------------------
-- staff_book_session_for_client(p_client_user_id, p_session_id, p_user_package_id)
-- ---------------------------------------------------------------------------
create or replace function public.staff_book_session_for_client(
  p_client_user_id  uuid,
  p_session_id      uuid,
  p_user_package_id uuid
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id           uuid;
  v_package_class_type text;
  v_reformer_id        uuid;
  v_mat_id             uuid;
begin
  perform private.assert_staff_may_book_for_client(p_client_user_id);

  v_staff_id := auth.uid();

  select p.class_type into v_package_class_type
    from public.user_packages up
    join public.packages p on p.id = up.package_id
   where up.id = p_user_package_id
     and up.user_id = p_client_user_id;

  if not found then
    raise exception 'Package not found or does not belong to the client'
      using errcode = 'P0005';
  end if;

  v_reformer_id := case when v_package_class_type = 'reformer' then p_user_package_id else null end;
  v_mat_id      := case when v_package_class_type = 'mat' then p_user_package_id else null end;

  return private.book_session_core(
    p_client_user_id,
    p_session_id,
    v_reformer_id,
    v_mat_id,
    false,  -- no waitlist for staff manual booking
    false,  -- no public horizon cap for staff manual booking
    'staff_manual',
    v_staff_id,
    null
  );
end;
$$;

comment on function public.staff_book_session_for_client(uuid, uuid, uuid) is
  'Staff books a session for a client. Fails when session is at capacity.';

grant execute on function public.staff_book_session_for_client(uuid, uuid, uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- staff_book_session_with_credits_for_client(...)
-- ---------------------------------------------------------------------------
create or replace function public.staff_book_session_with_credits_for_client(
  p_client_user_id           uuid,
  p_session_id               uuid,
  p_reformer_user_package_id uuid default null,
  p_mat_user_package_id      uuid default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid;
begin
  perform private.assert_staff_may_book_for_client(p_client_user_id);

  v_staff_id := auth.uid();

  return private.book_session_core(
    p_client_user_id,
    p_session_id,
    p_reformer_user_package_id,
    p_mat_user_package_id,
    false,
    false,
    'staff_manual',
    v_staff_id,
    null
  );
end;
$$;

comment on function public.staff_book_session_with_credits_for_client(uuid, uuid, uuid, uuid) is
  'Staff books with explicit reformer/mat packages for a client. Fails when at capacity.';

grant execute on function public.staff_book_session_with_credits_for_client(uuid, uuid, uuid, uuid)
  to authenticated;
