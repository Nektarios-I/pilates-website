# Optional email and phone for account signup

**Date:** 2026-07-11  
**Status:** Complete — apply migration 33 in Supabase

## Changes

- Add account: email and phone are optional; only full name + password required for manual accounts
- Internal auth emails (`@accounts.corehouse.internal`) used when no real email is provided
- Sign-in supports name, email, or phone
- Search/filter bars updated for name, email, and phone across staff tools
- Migration 33: nullable `profiles.email`, unique phone index, updated auth trigger

## Verification

- `npm run lint` — pass
- `npm run test` — 205 passed

## Next action

Apply `supabase/33_optional_profile_contact.sql` in production Supabase. If the phone unique index fails because two profiles share the same number, run `supabase/34_fix_duplicate_profile_phones.sql`.
