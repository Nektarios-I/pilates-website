# 2026-06-17 — Auth debug, invite callback diagnostics, pending OTP invites

## Task summary

Diagnosed current Supabase auth issues with minimal-risk changes, added
AUTH_DEBUG-gated diagnostics, fixed invite callback failure behavior, and changed
the staff "Email OTP" invitation method so it no longer creates an auth user
immediately.

## Root cause analysis

### Invite callback receives no auth params

The existing invite callback was a server Route Handler. Server routes can read
query params (`?code=...`, `?token_hash=...`) but cannot read URL fragments
(`#access_token=...`) because fragments never leave the browser. The logged
`[invite-callback] No auth params in request` strongly matches either:

- Supabase redirect/email-template configuration points to the wrong URL, or
- Supabase redirects to the app with fragment-based auth payloads.

### Existing admin session masked invite failures

When an invite callback failed, the app could still behave as if the currently
signed-in admin session was relevant. Failure now redirects to `/auth/invite-error`
instead of falling through toward `/account`.

### Staff Email OTP invite created an auth user immediately

The `email_otp` branch called `admin.auth.admin.createUser({ email_confirm: true })`.
That created a Supabase auth user at staff-invite time, before the invitee
participated in any real auth flow. The branch now inserts only a
`public.staff_invites` pending record.

### Google and passkey issues

Google's `Unsupported provider: provider is not enabled` error is a Supabase
project/provider configuration issue unless proven otherwise. Passkey prompts on
localhost are expected browser/OS WebAuthn behavior if the browser and Supabase
client reach passkey auth. Code now adds gated diagnostics and clearer user
messaging without inventing custom auth behavior.

## Files changed

- `src/lib/auth/debug.ts` — single reusable AUTH_DEBUG-gated auth logging helper.
- `src/lib/auth/invite-callback.ts` — pure invite callback payload parser and
  decision helper for query/hash/code/token_hash shapes.
- `src/app/auth/invite/page.tsx` and `invite-client.tsx` — client-side invite
  landing page that can process URL fragments and then redirect to reset password.
- `src/app/auth/invite-callback/route.ts` — guarded diagnostics and explicit
  invite error redirects; no permanent raw console noise.
- `src/app/auth/invite-error/page.tsx` — explicit failure state for invite
  callback problems.
- `src/app/auth/debug-fragment/*` — AUTH_DEBUG-gated temporary fragment
  inspection page.
- `src/app/auth/callback/route.ts` — guarded diagnostics for normal OAuth/email
  callback params and exchange results.
- `src/app/(marketing)/login/page.tsx` — passes AUTH_DEBUG state into the client
  form.
- `src/app/(marketing)/login/login-form.tsx` — guarded Google/passkey diagnostics
  and clearer Google/passkey failure messaging.
- `src/app/(marketing)/staff/invite/actions.ts` — Email+Password now redirects to
  `/auth/invite`; Email OTP creates only pending invite state.
- `src/app/(marketing)/staff/invite/invite-form.tsx` and `page.tsx` — copy updated
  to reflect pending OTP invite behavior.
- `supabase/11_staff_invites.sql` — pending invite table required by Email OTP.
- `src/lib/auth/invite-callback.test.ts` — parser tests.
- `src/app/auth/invite-callback/route.test.ts` — route behavior tests.
- `src/app/(marketing)/staff/invite/actions.test.ts` — staff invite action tests.

## Env flags

- `AUTH_DEBUG=true` enables auth debug logging and the `/auth/debug-fragment`
  page. Off by default; production stays silent unless explicitly enabled.

## Verification

- Focused auth regression tests: pass (3 files, 11 tests).
- lint: pass.
- typecheck: pass.
- build: pass (26 routes).
- full Vitest suite: fail due existing non-auth test failures around async
  `SiteHeader` rendering in component tests and older marketing placeholder
  expectations. Focused auth tests pass.

## Next recommended action

1. Run `supabase/11_staff_invites.sql`.
2. In Supabase Auth URL Configuration, allowlist:
   - local `/auth/invite`
   - production `/auth/invite`
   - optionally `/auth/debug-fragment` only while AUTH_DEBUG testing
3. Check the invite email template uses `{{ .RedirectTo }}` so the app receives
   the intended callback URL.
4. Verify Google provider is enabled in the same Supabase project used by
   `NEXT_PUBLIC_SUPABASE_URL`.
5. Verify passkeys are enabled and that a passkey was registered for the test
   account/device before expecting passkey sign-in to succeed.
