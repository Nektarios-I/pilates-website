# Log Entry

- Date: 2026-06-18
- Actor: codex
- Category: implementation
- Topic: studio-content-header-membership
- Status: completed

## Purpose

Replace site TODO placeholders with corehouse studio content, simplify header/footer, and add staff membership management.

## Actions Performed

- Filled `site_content.ts` with studio name, schedule, instructors, classes, pricing, FAQ, and contact phone.
- Added `StudioLogo`, redesigned `SiteHeader` with account dropdown, updated footer (Rules in Pages, removed staff dev links and email).
- Added `/staff/membership` for apply/deactivate/credits management.
- Updated package seed entries for €100 / €300 memberships.
- Updated related pages, navigation, and tests.

## Files Changed or Inspected

- `src/config/site_content.ts`, `src/config/site.ts`, `src/config/navigation.ts`
- `src/components/layout/studio-logo.tsx`, `account-menu.tsx`, `site-header.tsx`, `site-footer.tsx`
- `src/app/(marketing)/staff/membership/*`
- `src/app/(marketing)/contact/page.tsx`, `pricing/page.tsx`, `faq/page.tsx`, `classes/page.tsx`
- `src/features/home/home-content.ts`
- `supabase/04_seed.sql`, `supabase/seed.sql`
- layout and homepage tests

## Commands Run

- `npm run lint`
- `npm run build`
- focused vitest on header, footer, homepage

## Verification

- lint: pass (after membership panel effect fix)
- build: pass
- focused unit tests: pass

## Next Recommended Action

- Re-run Supabase seed on the target project so new 1 Month / 3 Months packages exist in the database.
- Add a street address when available.
