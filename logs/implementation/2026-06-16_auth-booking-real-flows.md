# 2026-06-16 — Auth, Invite, and Booking Real Flows

## Type
implementation

## Summary
Replaced all mock stubs with real Supabase-backed flows: admin account seeding, real staff invite action, session-role connection for the invite form, full booking UI, and live cancel-booking from the account page.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/10_add_admin.sql` | New — seeds Nektarios Ioannou as admin via direct auth.users insert |
| `src/lib/supabase/admin.ts` | New — service-role Supabase client (server only) |
| `src/app/(marketing)/staff/invite/actions.ts` | New — `create_staff_invite` server action with auth checks, admin API call, profile update, role assignment |
| `src/app/(marketing)/staff/invite/invite-form.tsx` | Rewritten — removed mock constants, accepts `currentRole` prop, calls real server action |
| `src/app/(marketing)/staff/invite/page.tsx` | Rewritten — fetches session and role from DB, passes to form, redirects if unauthenticated |
| `src/lib/supabase/middleware.ts` | `/staff` added to protected routes (auth required) |
| `src/app/(marketing)/book/actions.ts` | New — `book_session_action` and `cancel_booking_action` server actions |
| `src/app/(marketing)/book/booking-panel.tsx` | New — client component: session cards, inline confirm, package selector, book/waitlist flow |
| `src/app/(marketing)/book/page.tsx` | Rewritten — server component: fetches sessions + booking counts + instructor names + user packages |
| `src/app/(marketing)/account/account-content.tsx` | Cancel booking button now live; calls `cancel_booking_action`, refreshes page on success |

---

## Key Decisions

- **Admin SQL script uses direct auth.users insert**: Runs in the Supabase SQL editor as postgres superuser. Password is a random bcrypt hash that is never used (magic link only). Script is safe to re-run — skips on duplicate email.
- **Invite uses Supabase Admin API**: `magic_link` and `email_otp` use `inviteUserByEmail`; `manual` uses `createUser` with `email_confirm: true`. Both trigger the `on_auth_user_created` trigger to create the profile.
- **MOCK_CURRENT_ROLE removed entirely**: The invite page now resolves the highest-privilege role from `user_roles` server-side and passes it as a prop. Unauthenticated → redirected to login. Client role → access denied state in form.
- **Booking uses RPC server actions**: `book_session()` and `cancel_booking()` are called via server actions which use the authenticated server Supabase client, so `auth.uid()` resolves correctly inside the Postgres functions.
- **Session data fetched server-side**: Sessions, booking counts, instructor names, and user packages are all fetched in `book/page.tsx` and passed to the client component. The client component handles interactivity only.

---

## Verification

- `npm run lint` — clean (0 errors, 0 warnings after removing unsupported `aria-selected` on `<article>`)
- `npm run typecheck` — clean
- `npm run build` — clean, all 20 routes compiled, `/book` and `/staff/invite` are `ƒ (Dynamic)`

---

## Manual Testing Steps

### Admin account
1. Paste `supabase/10_add_admin.sql` into the Supabase SQL Editor and run it.
2. Go to `/login`, enter `nektar9988@gmail.com`, click Send sign-in link.
3. Click the magic link email → redirected to `/account`.
4. Header should show "Add account" and "Account" buttons.

### Staff invite
1. Sign in as admin. Go to `/staff/invite`.
2. Fill in name, email, phone, role (Admin can choose any), method.
3. Submit → invitation created, summary shown.
4. Verify new user in Supabase Dashboard → Auth → Users.

### Booking
1. Sessions must exist in the `sessions` table (use the Supabase SQL editor to insert test sessions).
2. A `user_packages` row with credits must exist for the test user.
3. Go to `/book` while signed in → sessions list appears.
4. Select a session → inline confirm panel opens.
5. Choose package → Confirm booking → success banner.
6. Go to `/account` → booking appears with Cancel button.
7. Click Cancel → booking removed, credits refunded.

---

## Environment Variables Required

Add to `.env.local` (never commit):
```
SUPABASE_SERVICE_ROLE_KEY=<your service role key from Supabase Dashboard → Settings → API>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The `SUPABASE_SERVICE_ROLE_KEY` is required for the staff invite server action. Without it, inviting users will throw an error.

---

## Remaining Work

- Create sessions via admin UI (currently requires manual SQL inserts)
- Profile editing from the account page
- Package purchase flow
- Staff roster / session management pages
