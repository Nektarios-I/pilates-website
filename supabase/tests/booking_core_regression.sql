-- =============================================================================
-- booking_core_regression.sql — Manual SQL regression checks (dev/staging)
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- PREREQUISITES: Scripts 01–21 applied. At least one client + staff user with
-- packages and a schedulable session. Run sections individually in SQL Editor.
--
-- This file documents expected outcomes; adapt UUIDs to your seed data.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Public booking fails at capacity (allow_waitlist = false)
--    Fill a session to capacity, then book again as another client
--    with credits → expect ERROR P0015, no waitlisted row.
-- ---------------------------------------------------------------------------
-- select public.book_session('<full_session_id>', '<client_package_uuid>');
-- expect: ERROR P0015

-- See supabase/tests/booking_policy_regression.sql for full/cancel scenarios.

-- ---------------------------------------------------------------------------
-- 2. Staff manual fails at capacity (P0015, no waitlist row)
--    As instructor JWT, call:
--    select public.staff_book_session_for_client(
--      '<client_uuid>', '<full_session_id>', '<client_package_uuid>');
-- expect: ERROR P0015

-- ---------------------------------------------------------------------------
-- 3. Staff manual provenance
--    On success:
-- expect: booking_source = staff_manual, created_by_user_id = auth.uid(),
--         user_id = client uuid, credits deducted from client package

-- ---------------------------------------------------------------------------
-- 4. Instructor cancel parity
--    As instructor JWT:
--    select public.cancel_booking('<client_booking_uuid>', 'Staff cancel test');
-- expect: success, credits refunded if was booked

-- ---------------------------------------------------------------------------
-- 5. Instructor package visibility
--    As instructor JWT:
--    select * from public.get_active_packages('<client_uuid>');
-- expect: rows returned (no P0020)

-- ---------------------------------------------------------------------------
-- 6. Client cannot use staff RPC
--    As client JWT:
--    select public.staff_book_session_for_client(...);
-- expect: ERROR P0011

-- ---------------------------------------------------------------------------
-- 7. Slot conflict P0013 unchanged for public book
--    Book same slot twice for same client
-- expect: second call ERROR P0013

-- ---------------------------------------------------------------------------
-- Sanity: core function exists (run after migration 19)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private'
       and p.proname = 'book_session_core'
  ) then
    raise exception 'FAIL: private.book_session_core not found — run 19_booking_core_refactor.sql';
  end if;

  if not exists (
    select 1 from pg_proc where proname = 'staff_book_session_for_client'
  ) then
    raise exception 'FAIL: staff_book_session_for_client not found — run 20_staff_booking_rpc.sql';
  end if;

  raise notice 'PASS: booking core + staff RPC objects present';
end;
$$;
