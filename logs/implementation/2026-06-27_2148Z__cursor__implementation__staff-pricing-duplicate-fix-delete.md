# Staff pricing: duplicate cards fix + permanent remove

## Task
Fix duplicate package cards on `/staff/pricing`, add permanent remove action, verify pricing flows.

## Root cause
- Double server-action submits could insert duplicate DB rows.
- Package list had no id dedupe; grouping used server `class_type` only.
- No way to delete orphan test packages from admin UI.

## Changes
- `pricing-panel-state.ts`: `dedupe_packages_by_id`, `partition_packages_by_class`.
- `actions.ts`: dedupe in `list_packages_for_staff`; new `delete_package` (blocks when assigned in `user_packages`).
- `pricing-panel.tsx`: action guard ref, partition rendering, Remove + confirm UI, deactivate vs remove copy.
- `page.tsx`: remount panel on package id set change.
- `get-public-catalog.ts`: dedupe active public packages by id.

## Verification
- `npm run lint` — pass
- `npx tsc --noEmit` — pass
- `pricing-panel-state.test.ts`, `pricing-display.test.ts` — 8/8 pass
- `homepage.test.tsx`, `marketing-pages.test.tsx` — 19/19 pass

## Next
- Remove duplicate test rows in Supabase if double-insert already created extra ids (use new Remove button).
- Run `supabase/14_update_reformer_3month_prices.sql` on production if not applied.
