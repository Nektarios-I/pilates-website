# Auth sign-in flow

## Standard pattern (Supabase SSR + Next.js App Router)

Password and OTP **verification** use **server actions** in `src/app/(marketing)/login/actions.ts`:

1. `createClient()` from `@/lib/supabase/server` (cookie-backed)
2. `signInWithPassword` or `verifyOtp`
3. `revalidatePath('/', 'layout')`
4. `redirect()` to a safe internal path

Session cookies are written on the **server response**. Do not duplicate this with browser `signInWithPassword` for the same flow.

## OTP email request (client-only exception)

`signInWithOtp` in `login-form.tsx` stays in the **browser** so the PKCE verifier cookie is stored in the same browser that opens the email link.

## Middleware

`src/lib/supabase/middleware.ts` must:

1. Call `supabase.auth.getClaims()` on every matched request (session refresh)
2. Redirect unauthenticated users away from `/account` and `/staff`
3. Redirect authenticated users away from `/login` to their `next` path

## Header auth

`SiteHeader` reads auth **only from the server** (`site-header.tsx`). Do not add client-side session sync in the header — stale browser cookies caused 400 errors against Supabase when the server session was already signed out.

## Forbidden without discussion

- Client `signInWithPassword` / client `verifyOtp` followed by `router.push` or `window.location`
- `useHeaderAuth` or `onAuthStateChange` + `router.refresh()` in layout/header
- `getSession()` on the server for authorization decisions

## Logout

Server action `signOut()` → `revalidatePath` → `redirect('/login')`. Do not add extra client navigations after it.

## Files

| File | Role |
|------|------|
| `login/actions.ts` | Server sign-in, sign-out |
| `login/login-form.tsx` | UI; calls server actions for password/OTP verify |
| `lib/supabase/middleware.ts` | Session refresh + route guards |
| `lib/auth/safe-auth-redirect.ts` | Validates `next` query param |
