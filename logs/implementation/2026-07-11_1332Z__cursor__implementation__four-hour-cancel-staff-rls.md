# 4-hour cancel, staff access guard, profiles RLS

**Date:** 2026-07-11  
**Actor:** cursor  

## Changes

- Migration **36**: client cancel cutoff 2h → 4h (`cancel_booking` P0029)
- Migration **37**: profiles RLS — staff read all; clients read own row + staff directory only
- **`src/app/(marketing)/staff/layout.tsx`**: redirects client accounts to `/account`
- Updated cancellation copy, tests, FAQ, site content

## Verification

- lint: pass  
- test: 208 passed (after account test fix)  

## Apply in Supabase

Run `36_client_cancel_four_hour_cutoff.sql` and `37_profiles_rls_staff_directory.sql`.
