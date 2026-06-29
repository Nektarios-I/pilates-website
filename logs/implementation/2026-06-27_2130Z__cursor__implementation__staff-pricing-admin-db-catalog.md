---
date: 2026-06-27 21:30Z
actor: cursor
category: implementation
topic: staff-pricing-admin-db-catalog
related prompt: Owner/admin pricing management page + DB-backed public pricing
status: completed
---

## Purpose

Store package prices in `public.packages` (already existed), sync owner-approved reformer 3-month prices, add `/staff/pricing` for admin/owner CRUD, and wire homepage + pricing page to read from DB with `site_content` fallback.

## Database

- Updated `supabase/04_seed.sql` reformer 3-month prices: €265 / €400 / €520
- Added `supabase/14_update_reformer_3month_prices.sql` — idempotent upsert + price updates for existing DBs

## App changes

- `src/lib/packages/*` — fetch, display transform, fallback
- `src/app/(marketing)/staff/pricing/*` — admin page + panel + actions
- `src/app/(marketing)/pricing/page.tsx` — async, DB catalog
- `src/app/(marketing)/page.tsx` — async homepage pricing preview from DB
- `src/components/layout/account-menu.tsx` — “Manage pricing” link (admin/owner)

## Verification

- `npm run lint` — pass
- `npx tsc --noEmit` — pass
- `pricing-display.test.ts`, `homepage.test.tsx`, `marketing-pages.test.tsx` — 22/22 pass

## Owner action

Run on Supabase SQL editor (once):

`supabase/14_update_reformer_3month_prices.sql`

## Next

Phase 2 — sign-in slowness investigation
