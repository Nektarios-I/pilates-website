# Supabase SSR auth refactor

## Symptoms
- Sign-in required manual refresh
- Console: `Failed to load resource: 400` on page load
- Font preload warnings (symptom of aborted navigation)

## Root causes
1. **Split auth model**: browser `signInWithPassword` + client navigation while server/middleware read different cookie state.
2. **`useHeaderAuth`**: on load, `getSession()` + REST calls with stale/invalid cookies → Supabase **400** errors.
3. **`tabs:outgoing.message.ready`**: browser extension noise (not app code).

## Fix (Supabase standard)
- Server actions: `sign_in_with_password`, `verify_sign_in_otp` → cookies on server → `revalidatePath` → `redirect`.
- Middleware: `getClaims()` session refresh + auth route guards.
- Removed `useHeaderAuth` and client sign-in handoff helpers.
- Policy tests in `auth-sign-in-guard.test.ts`.

## Verification
lint, tsc, auth + layout tests — pass
