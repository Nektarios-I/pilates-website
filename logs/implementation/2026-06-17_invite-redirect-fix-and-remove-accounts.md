# 2026-06-17 — Invite redirect fix, Remove Accounts page, header user name

## Task summary

Fix two bugs reported from manual testing of the staff invite flow, add a Remove
Accounts staff page, and show the signed-in user's first name in the header.

---

## Root cause analysis

### Bug 1 — Invited user redirected to admin's account instead of set-password page

`inviteUserByEmail` was called with:
```
redirectTo: `${site_url}/auth/callback?next=/auth/reset-password`
```

Supabase does **not** reliably forward query params from `redirectTo` into the
actual invite email link. The email link arrived at `/auth/callback` WITHOUT the
`?next=` param, so `next` defaulted to `/account`. The callback ran correctly,
created a session for the new user, then redirected them to `/account` instead
of `/auth/reset-password`.

### Bug 2 — "User already exists" error on reinvite

After Bug 1, the new user's email was **confirmed** by the `verifyOtp` call in
the callback (type=invite confirms the email). The user landed on `/account` but
never set a password. On reinvite, `inviteUserByEmail` detects a confirmed email
and returns "User already registered" — a dead-end with no recovery path.

---

## Changes

### New: `src/app/auth/invite-callback/route.ts`

Dedicated Route Handler for admin-initiated invites. It hardcodes the
post-invite destination to `/auth/reset-password` — no `?next=` param needed.
Handles both code (PKCE) and token_hash+type=invite flows. Errors redirect to
`/login?error=invite_link_invalid`.

### Modified: `src/app/(marketing)/staff/invite/actions.ts`

Changed `redirectTo` from `…/auth/callback?next=/auth/reset-password` to
`…/auth/invite-callback`. Also improved the "user already registered" error
message to explain the situation and direct staff to the Remove Accounts page.

### Modified: `src/components/layout/site-header.tsx`

- `get_header_auth()` now fetches `full_name` from `profiles` in parallel with
  the roles query.
- Returns `display_name` (first name from profile, or email prefix as fallback).
- Header shows `Hi, {display_name}` between the Account button and Book Now.
- Added a "Remove account" `ButtonLink` for staff users (shown alongside
  "Add account").

### New: `src/app/(marketing)/staff/remove/actions.ts`

Server actions:
- `list_removable_users()` — fetches accounts the caller can remove based on
  role permissions (admin → all, owner → instructor+client, instructor → client).
  Uses the admin client to bypass RLS. Excludes the caller themselves.
- `remove_user(target_user_id)` — re-verifies permissions server-side, then
  calls `admin.auth.admin.deleteUser()`. Cascade FK constraints on `auth.users`
  automatically clean up `profiles` and `user_roles`.

### New: `src/app/(marketing)/staff/remove/remove-accounts-panel.tsx`

Client component. Renders the account list with inline "Remove → Confirm/Cancel"
flow. Optimistically hides removed rows and refreshes the page after deletion.

### New: `src/app/(marketing)/staff/remove/page.tsx`

Server component. Redirects to `/login` if unauthenticated (middleware also
protects `/staff`). Fetches the removable users list server-side and passes it
to `RemoveAccountsPanel`. Two-column layout with an info/warning side panel.

---

## Supabase dashboard action required

Add `http://localhost:3000/auth/invite-callback` (and the production equivalent)
to **Redirect URLs** in the Supabase Auth dashboard so Supabase accepts it as a
valid redirect destination for `inviteUserByEmail`.

---

## Verification

- lint: **pass**
- typecheck: **pass**
- build: **pass** (23 routes, including new `/auth/invite-callback` and `/staff/remove`)

## Next recommended action

1. Add `/auth/invite-callback` to Supabase Redirect URLs in the dashboard.
2. Remove the stranded invited-but-no-password account via the new Remove
   Accounts page, then re-invite to test the full flow end-to-end.
3. Mobile testing pass (deferred).
