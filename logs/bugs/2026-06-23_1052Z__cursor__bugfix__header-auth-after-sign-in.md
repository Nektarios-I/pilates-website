# Header auth after sign-in fix

- Date: 2026-06-23
- Actor: cursor
- Category: bugs
- Topic: header-auth-after-sign-in
- Status: complete

## Problem

After password sign-in, the header stayed on "Sign in" until a full page reload. Account page content loaded correctly.

## Root cause

`SiteHeader` is a server component inside the persistent `(marketing)` layout. Client-side `signInWithPassword` sets session cookies, but soft navigation (`router.push('/account')`) reuses the cached layout RSC payload rendered before sign-in.

## Fix

- `useHeaderAuth` hook listens to Supabase `onAuthStateChange` and reads the client session when the server layout is stale.
- `merge_header_auth` prefers server auth once the layout refreshes.
- `dynamic = 'force-dynamic'` on `SiteHeader` so server re-fetches are not statically cached.

## Verification

- `npm run lint` — pass
- `npx tsc --noEmit` — pass
- `npm run test` — 63/64 pass (pre-existing `indexing.test.ts` sitemap count)

## Next action

Manually verify: sign in on `/login` and confirm header switches to Account without reload.
