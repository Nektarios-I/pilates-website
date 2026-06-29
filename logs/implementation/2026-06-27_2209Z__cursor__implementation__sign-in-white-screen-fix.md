# Sign-in white screen fix

## Problem
After logout, password or name sign-in succeeded but the UI froze on a blank/white screen until manual refresh. Refresh then showed the user signed in correctly.

## Root cause
Three competing post-sign-in navigations ran at once:

1. `login-form.tsx` `after_sign_in()` called `router.refresh()` and `router.push('/account')` after **client-side** `signInWithPassword`.
2. `use-header-auth.ts` `onAuthStateChange` fired `router.refresh()` on `SIGNED_IN`.
3. `login/page.tsx` server component redirects to `/account` when a session exists after refresh.

Client-side sign-in set browser cookies before the Next.js server saw the session. Overlapping soft navigations left the app stuck mid-transition. Full page refresh worked because it performed a single clean server render with cookies present.

## Fix
- Moved password and OTP verification to server actions (`sign_in_with_password`, `sign_in_with_otp`) that set session cookies on the server and `redirect('/account')`.
- Removed `router.refresh()` from header auth `SIGNED_IN` / `SIGNED_OUT` handlers; client header state still syncs via `merge_header_auth`.
- Removed redundant `router.push` / `router.refresh` after `signOut()` (server action already redirects).

## Verification
- `npm run lint` — pass
- `npx tsc --noEmit` — pass
- `login/actions.test.ts` — 4/4 pass
- `site-header.test.tsx` — 3/3 pass

## Manual check
Log out → sign in with email/password or NAME SURNAME → should land on `/account` without refresh.
