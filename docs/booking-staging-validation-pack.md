# Booking staging & DB validation pack

Use this checklist after applying migration 24 on staging/dev. Copy into your run notes.

---

## 1. Migration checklist

**Apply (in order, if not already):**

- `supabase/24_public_full_fail_cancel_cutoff.sql`

**Confirm applied:**

```sql
-- Public wrappers must pass allow_waitlist = false
select pg_get_functiondef('public.book_session(uuid,uuid)'::regprocedure);
-- Expect: private.book_session_core(..., false, false, 'client', ...)

select pg_get_functiondef('public.cancel_booking(uuid,text)'::regprocedure);
-- Expect: P0029 when starts_at <= now() + interval '2 hours' for client self-cancel
```

---

## 2. SQL / DB scripts

**Run:** `supabase/tests/booking_policy_regression.sql` (section by section in SQL Editor)

Replace placeholders with real UUIDs from your seed data. Use client JWT for client scenarios; instructor JWT for staff scenario 5.

| # | Action | Expected |
|---|--------|----------|
| 1 | `select public.book_session('<full_session>', '<pkg>');` | ERROR **P0015**; no `waitlisted` row |
| 2 | `select public.book_session('<open_session>', '<pkg>');` | `status = booked`; credits deducted |
| 3 | Client `cancel_booking` on booking >2h away | `status = cancelled`; credits restored |
| 4 | Client `cancel_booking` on booking <2h away | ERROR **P0029**; `status = booked`; credits unchanged |
| 4b | Cancel at exactly 2h | ERROR **P0029** |
| 4c | Cancel at 2h + 1ms | Success; credits restored |
| 5 | Staff `cancel_booking` on same near-start booking | Success; credits restored |
| 6 | Book same slot twice for one client | Second call ERROR **P0013** |
| 7 | Book with 0 credits | ERROR **P0008**; no booking row |
| 8 | Client cancel on past session | ERROR **P0029** |

**Credit helper (replace booking id):**

```sql
select b.status, b.credits_used, up.credits_remaining, s.starts_at,
       s.starts_at <= now() + interval '2 hours' as inside_cutoff
  from public.bookings b
  join public.user_packages up on up.id = b.user_package_id
  join public.sessions s on s.id = b.session_id
 where b.id = '<booking_id>';
```

**E2E fixture for Scenario B (<2h booking):**

```sql
-- Create a booked row with session starting in ~90 minutes, then set:
-- E2E_NEAR_CUTOFF_BOOKING_ID=<uuid>
-- E2E_NEAR_CUTOFF_BOOKING_TITLE=<session title shown in UI>
```

---

## 3. Manual UI checklist

### Client book + cancel outside 2h

1. Sign in as client with active package + credits.
2. `/book` → enable “Show available only” → pick open slot → Confirm booking.
3. Verify “Booking confirmed” and policy text on confirm panel.
4. `/account` → upcoming booking shows **Cancel booking**.
5. Cancel → booking leaves upcoming list; package credit increases by 1.

### Client blocked cancel inside 2h

1. Use booking with session start <2h away.
2. `/account` → no **Cancel booking** button; blocked message visible.
3. Optional: force RPC `cancel_booking` → P0029; credits unchanged.

### Staff cancel inside 2h

1. Sign in as instructor/admin.
2. `/staff/client-bookings?client=<uuid>` → cancel near-start client booking.
3. Verify success; client credits restored.

### Policy + no waitlist

1. `/book` confirm panel → 2-hour cancellation copy.
2. `/account` → short policy under Upcoming Bookings.
3. `/faq` → 2-hour rule (not 12 hours).
4. Full slot → **Full** label; no confirm CTA; no waitlist success path.

### Legacy waitlisted rows

1. If any `status = waitlisted` rows exist → show on account with badge; no cancel button.
2. Confirm new public bookings never create waitlisted rows.

---

## 4. Key caveats / risks

- **Migration 24 must be live** before UI/RPC behavior matches tests.
- **Client cancel gating** uses ISO `starts_at` vs `Date.now()`; slot “past” uses studio-local date keys — validate once on staging at a real boundary.
- **Authenticated Playwright** requires `.env.local` + E2E vars; skipped in CI when unset.
- **`/account/bookings`** is read-only; cancel only on `/account` dashboard.
- **Legacy waitlisted rows** are display-only; optional post-launch data cleanup.

---

## Playwright (optional local/staging)

```bash
# Set in .env.local: E2E_CLIENT_EMAIL, E2E_CLIENT_PASSWORD, Supabase keys
# For Scenario B also: E2E_NEAR_CUTOFF_BOOKING_ID, E2E_NEAR_CUTOFF_BOOKING_TITLE
npx playwright test e2e/booking-flow.spec.ts --project=authenticated-booking
```
