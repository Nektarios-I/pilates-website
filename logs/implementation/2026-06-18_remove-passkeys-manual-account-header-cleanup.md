# 2026-06-18 — Remove passkeys, add manual account creation, simplify header

## Task summary

Removed passkey sign-in and passkey registration from the website, added a
manual staff-created account method, removed Email OTP from the Add Account
UI/UX, and simplified the signed-in header layout so the actions fit more
cleanly on one line.

## Changes

### Removed passkeys from website UI and client setup

- Removed passkey sign-in from `src/app/(marketing)/login/login-form.tsx`.
- Removed passkey copy from `src/app/(marketing)/login/page.tsx`.
- Removed passkey registration state, handler, and Security section from
  `src/app/(marketing)/account/account-content.tsx`.
- Removed `createPasskeyClient()` from `src/lib/supabase/client.ts`.

### Added Manual Account method

- Added `manual_account` to `src/app/(marketing)/staff/invite/actions.ts`.
- Manual account creation calls `admin.auth.admin.createUser()` with:
  - `email`
  - staff-entered temporary `password`
  - `email_confirm: true`
  - profile metadata
- After auth user creation, the existing profile update and role assignment flow
  runs as before.
- Manual accounts are marked `active`; email invite accounts remain `invited`.

### Removed Email OTP from Add Account UI/UX

- Removed Email OTP option from `src/app/(marketing)/staff/invite/invite-form.tsx`.
- Updated side-panel copy in `src/app/(marketing)/staff/invite/page.tsx`.
- Staff now sees only:
  - Email + Password
  - Manual account

### Header cleanup

- Updated `src/components/layout/site-header.tsx`.
- Staff/account actions are compact text links.
- Book Now remains the primary button.
- Desktop layout uses a single compact action row with non-wrapping labels.

## Verification

- Focused staff invite action tests: pass.
- lint: pass.
- typecheck: pass.
- build: pass.

## Notes

Manual account creation requires a temporary password because Supabase cannot
create a usable password-based auth account without either a password or an
email-based recovery/invite flow.
