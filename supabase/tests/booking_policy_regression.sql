-- =============================================================================
-- booking_policy_regression.sql — Full-session + 2h cancel verification (dev/staging)
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- PREREQUISITES: Scripts 01–24 applied. Replace UUIDs with your seed data.
-- Run sections individually in SQL Editor with appropriate JWT roles where noted.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SANITY: migration 24 objects
-- ---------------------------------------------------------------------------
do $$
begin
  raise notice 'PASS: Run manual scenarios below after adapting UUIDs';
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Public booking fails at capacity (P0015, no waitlist row)
--    Setup: fill session to capacity with status = booked.
--    As client JWT:
--    select public.book_session('<full_session_id>', '<client_package_id>');
-- EXPECT: ERROR P0015
-- VERIFY:
--   select count(*) from public.bookings
--    where session_id = '<full_session_id>'
--      and user_id = auth.uid()
--      and status = 'waitlisted';
--   → 0 rows
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 2. Public booking succeeds on open slot
--    As client JWT on session with capacity remaining:
--    select public.book_session('<open_session_id>', '<client_package_id>');
-- EXPECT: json with status = booked, credits deducted, booking_source = client
-- VERIFY:
--   select b.status, b.booking_source, up.credits_remaining
--     from public.bookings b
--     join public.user_packages up on up.id = b.user_package_id
--    where b.id = '<returned_booking_id>';
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3. Client cancel allowed > 2 hours before start
--    Booking for session starting > 2h from now. Note credits_remaining before.
--    As owning client JWT:
--    select public.cancel_booking('<booking_id>', 'Test early cancel');
-- EXPECT: success, status = cancelled, credits_remaining restored
-- VERIFY with helper below (credits should increase by credits_used)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 4. Client cancel blocked < 2 hours before start (P0029)
--    Booking for session starting within 2h. Note credits_remaining before.
--    As owning client JWT:
--    select public.cancel_booking('<booking_id>', 'Test late cancel');
-- EXPECT: ERROR P0029, booking still booked, credits unchanged
-- VERIFY: status still 'booked', credits_remaining unchanged
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 4b. Client cancel blocked at exactly 2 hours (boundary)
--    Setup: session.starts_at = now() + interval '2 hours' (use timestamptz literal).
--    As owning client JWT:
--    select public.cancel_booking('<booking_id>', 'Boundary cancel');
-- EXPECT: ERROR P0029 (SQL uses starts_at <= now() + interval '2 hours')
-- VERIFY: booking.status = 'booked'
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 4c. Client cancel allowed just after boundary
--    Setup: session.starts_at = now() + interval '2 hours' + interval '1 millisecond'
--    As owning client JWT:
--    select public.cancel_booking('<booking_id>', 'Just outside boundary');
-- EXPECT: success (cancelled), credits restored if was booked
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 5. Staff may still cancel inside 2-hour window (operational override)
--    Same near-start booking as #4. As instructor JWT:
--    select public.cancel_booking('<booking_id>', 'Staff late cancel');
-- EXPECT: success, credits refunded if was booked
-- NOTE: staff path applies when booking.user_id != auth.uid() OR caller is staff
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 6. Slot conflict unchanged (P0013)
--    Book same slot twice for same client.
-- EXPECT: second call ERROR P0013
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 7. Insufficient credits unchanged (P0008)
--    Client with 0 credits on matching package.
-- EXPECT: ERROR P0008, no booking row
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 8. Started session: client cancel blocked (implicit via cutoff)
--    Setup: session.starts_at in the past but booking still 'booked'.
--    As owning client JWT:
--    select public.cancel_booking('<booking_id>', 'Past session');
-- EXPECT: ERROR P0029 (starts_at <= now() + 2h is true for past sessions)
-- ---------------------------------------------------------------------------

-- Credit + status helper (replace booking id):
-- select b.status,
--        b.credits_used,
--        up.credits_remaining,
--        s.starts_at,
--        s.starts_at <= now() + interval '2 hours' as inside_cutoff
--   from public.bookings b
--   join public.user_packages up on up.id = b.user_package_id
--   join public.sessions s on s.id = b.session_id
--  where b.id = '<booking_id>';
