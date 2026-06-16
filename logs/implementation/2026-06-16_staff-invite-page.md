# Staff Invite Page — Frontend Implementation

**Date:** 2026-06-16
**Type:** Implementation
**Scope:** New route `/staff/invite` — UI/UX only, no backend

---

## Summary

Implemented a polished, production-like staff account invitation page at `/staff/invite`. The page is fully frontend-only with mock role-based access control, client-side validation, and simulated async submission. No Supabase calls are made.

---

## Files Changed

| File | Action | Reason |
|------|--------|--------|
| `src/app/(marketing)/staff/invite/page.tsx` | Created | Server component — page layout, metadata, two-column grid |
| `src/app/(marketing)/staff/invite/invite-form.tsx` | Created | Client component — form, validation, mock submit, all states |
| `src/components/ui/form-field.tsx` | Created | Reusable label + input + error + hint primitive |
| `src/config/site_content.ts` | Modified | Added "Staff (Dev)" footer nav group with link to `/staff/invite` |

---

## What Was Implemented

- Route `/staff/invite` under the `(marketing)` layout group (gets standard header/footer)
- Mock role constant `MOCK_CURRENT_ROLE` and `MOCK_SIMULATE_ERROR` toggle at top of `invite-form.tsx`
- Permission model: `user` → access denied; `instructor` → client only; `owner` → client + instructor; `admin` → all roles
- Form fields: full name, email, phone, role (filtered dropdown), invitation method (radio group)
- Validate on blur and on submit; inline field errors; required indicators
- Accessible: `aria-invalid`, `aria-describedby`, `role="alert"`, `role="radiogroup"`, `aria-labelledby`
- Mock submit: 800–1200ms delay, configurable failure via `MOCK_SIMULATE_ERROR`
- Success state: summary card with all submitted values + "Create another invitation" action
- Error state: preserves form values, shows banner
- Access-denied state for `user` role with lock icon and back link
- Desktop side panel: permission reference card, method descriptions, dev note on changing mock role
- Mobile responsive single-column layout
- Cancel/back link to `/account`
- Dev nav link added to footer under "Staff (Dev)" group

---

## Verification

| Check | Result |
|-------|--------|
| `npm run lint` | ✓ Clean (0 errors, 0 warnings after fixes) |
| `npm run typecheck` | ✓ Clean |
| `npm run build` | ✓ `/staff/invite` builds as static page |

---

## Notes for Backend Integration

- Replace `MOCK_CURRENT_ROLE` with real session role from Supabase auth context (e.g., from `user_roles` table)
- Replace `mock_submit` with Supabase `supabase.auth.admin.inviteUserByEmail()` or `admin.createUser()`
- Expected data shape: `{ full_name: string, email: string, phone: string, role: Role, method: InviteMethod }`
- Role validation should be re-checked server-side (never trust client-side role filtering alone)
- Add middleware protection for `/staff/*` routes once real auth roles are available

---

## Follow-up Work

- Connect to Supabase when auth/roles infrastructure is ready
- Add proper staff layout (separate from marketing layout) if staff portal grows
- Remove "Staff (Dev)" footer nav group and replace with proper staff navigation
- Add server-side route guard in `middleware.ts` for `/staff/*`
