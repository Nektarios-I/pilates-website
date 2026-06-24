# Auth + hydration fixes (Vercel preview)

**Date:** 2026-06-24  
**Scope:** Sign-in reliability on Vercel preview; React hydration mismatch in `SiteHeader`

## Problem

1. Sign-in worked locally but failed on Vercel preview despite Supabase data existing.
2. Console hydration error on `/instructors` (and other marketing pages): `SiteHeader` → `ButtonLink` className mismatch between server and client.

## Root causes

- **Auth:** Inconsistent env var names (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` vs `NEXT_PUBLIC_SUPABASE_ANON_KEY`); OAuth/magic-link redirects could use `localhost` when `NEXT_PUBLIC_SITE_URL` was unset at build time; missing `SUPABASE_SERVICE_ROLE_KEY` breaks name-based login only.
- **Hydration:** `SiteHeader` wrapped async auth fetch in `<Suspense fallback={<SiteHeaderView auth={unsigned} />}>` — client hydrated against fallback while server streamed resolved auth, causing DOM mismatch.

## Changes

- `src/lib/supabase/env.ts` — centralized Supabase URL/key helpers with anon-key fallback; env status helper.
- `src/lib/auth/site-url.ts` — `getAuthRedirectOrigin()` prefers live browser origin on client; falls back to `VERCEL_URL` on server.
- Wired env helpers into `client.ts`, `server.ts`, `middleware.ts`, `admin.ts`, `auth/callback`, `auth/invite-callback`.
- `login-form.tsx` — all redirect URLs use `getAuthRedirectOrigin()`; `after_sign_in()` calls `router.refresh()` before `router.push('/account')`.
- `login/actions.ts` — clearer error when service role key missing (name-based login).
- `site-header.tsx` — removed Suspense; async `SiteHeader` renders `SiteHeaderView` directly.
- `api/test-supabase/route.ts` — reports full env status + `VERCEL_URL` for deployment debugging.
- `.env.example` — documents anon-key alias and service role requirement for name login.
- Test mocks for async `SiteHeader` in `page-shell.test.tsx` and `homepage.test.tsx`.

## Verification

- `npm run lint` — pass
- `npx tsc --noEmit` — pass
- `npm run test` — 44/44 pass
- `npm run build` — pass

## Vercel checklist (manual)

Set in Vercel → Project → Settings → Environment Variables (Production + Preview):

- `NEXT_PUBLIC_SITE_URL=https://pilates-website-orpin.vercel.app`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY`

Supabase → Authentication → URL configuration:

- Site URL: `https://pilates-website-orpin.vercel.app`
- Redirect URLs: `https://pilates-website-orpin.vercel.app/**`

After deploy, open `/api/test-supabase` — all env fields should show `set`.

## Next action

Merge/push to `master`, redeploy Vercel, verify sign-in (email + password) and confirm hydration console is clean.
