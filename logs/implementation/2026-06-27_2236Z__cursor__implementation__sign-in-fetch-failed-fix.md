# Sign-in fetch failed (ENOTFOUND) fix + auth UI cleanup

## Problem
Password sign-in showed `fetch failed` after moving auth to server actions. Terminal:
`getaddrinfo ENOTFOUND xzlirjwzpmvugkbhtzxw.supabase.co` during `sign_in_with_password`.

## Root cause
Server actions run in the Next.js Node process. That process could not resolve the Supabase hostname (DNS ENOTFOUND), while the browser often can. The previous client-side sign-in avoided this path.

Also `.env.local` set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...` which was preferred over the JWT anon key; env now prefers `NEXT_PUBLIC_SUPABASE_ANON_KEY` for `@supabase/ssr`.

## Fix
- Restored browser `signInWithPassword` / `verifyOtp` with `complete_sign_in_navigation()` (`window.location.assign('/account')`) to avoid white-screen races and Node DNS auth calls.
- Kept `resolve_sign_in_email` server action for name lookup only.
- Removed Google button from login page.
- Invite form: manual account only (removed Email + Password option from UI).
- Friendlier network error messages.

## Verification
- lint, tsc, login + post-sign-in tests — pass
- Restart `npm run dev` after pulling so env key preference reloads.
