# Client sign-in handoff + font preload cleanup

## Symptom
Sign-in stalled (blank/cream screen); refresh worked. Console showed 6× font preload warnings.

## Root cause
Not the fonts themselves — aborted document loads during a failed `/account` jump after client sign-in. Browser preloaded 6 woff2 files then navigated/redirected before paint → Chrome warnings.

Client cookies were set, but immediate `/account` request could run before middleware/server saw the session.

## Fix
- `complete_client_sign_in()` → `/login?next=/account` → server `redirect()` (documented in `docs/auth-sign-in-flow.md`).
- `safe_auth_next_path()` for open-redirect safety.
- Policy tests in `auth-sign-in-guard.test.ts`.
- Fraunces `preload: false`; Sora on `<body>` via `className` for immediate use.
- AGENTS.md points to auth doc.

## Verification
lint, tsc, src/lib/auth tests — pass
