# Deployment Runbook

Purpose: define a safe, repeatable deployment path for this repository with Vercel as the current hosting target and a clear portability path for non-Vercel hosting later.

## Scope and assumptions

- Current app type: Next.js App Router site with server rendering support.
- Current scripts available: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.
- Current environment model: public runtime config values in `.env.example` and `src/config/site.ts`.
- Current phase: scaffold and planning heavy; this runbook is operational guidance, not infrastructure automation.

---

## 1) Local build expectations

Use this sequence before creating or promoting deployments.

1. Install dependencies.
2. Ensure local environment file is present and populated.
3. Run lint.
4. Run production build.
5. Optionally run local production start for smoke checks.

Reference commands:

```bash
npm install
npm run lint
npm run build
npm run start
```

Expected outcome:

- `npm run lint` exits successfully.
- `npm run build` exits successfully and generates a production build.
- Local production server starts without runtime configuration errors.

If build fails:

- Stop release promotion.
- Fix code/config in branch.
- Re-run lint and build before retrying deployment.

---

## 2) Environment variable checklist

All active variables are public values and should be set in local, preview, and production as appropriate.

Required for correct production behavior:

- `NEXT_PUBLIC_SITE_URL` (must match active deployment domain)

Operationally recommended (business content correctness):

- `NEXT_PUBLIC_STUDIO_NAME`
- `NEXT_PUBLIC_CONTACT_EMAIL`
- `NEXT_PUBLIC_CONTACT_PHONE`
- `NEXT_PUBLIC_INSTAGRAM_URL`
- `NEXT_PUBLIC_FACEBOOK_URL`
- `NEXT_PUBLIC_BOOKING_URL`
- `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL`

Checklist before preview/production deploy:

1. Confirm variable names exactly match `.env.example`.
2. Confirm no placeholder values remain for live environment.
3. Confirm `NEXT_PUBLIC_SITE_URL` points to the correct preview or production URL.
4. Confirm social/contact/booking links are valid URLs.

Related source of truth:

- `.env.example`
- `src/config/site.ts`
- `docs/environment-matrix.md`

---

## 3) Preview deployment flow (Vercel)

Goal: validate changes in an isolated URL before production.

1. Push feature branch.
2. Open or update pull request.
3. Let Vercel create/update preview deployment for that branch.
4. Verify preview environment variables are present and correct.
5. Run post-deploy preview smoke checks (see Section 7).
6. Resolve issues, push fixes, and re-verify until green.

Promotion gate from preview to production:

- Local lint and build are passing.
- Preview smoke checks pass.
- No critical regressions in routing, metadata, robots, sitemap, or navigation.

---

## 4) Production deployment flow (Vercel)

Goal: promote validated code to live domain safely.

**Branch and promotion policy**: Production deploys from the `master` branch. Merge feature work into `master`, then push to trigger Vercel production.

1. Merge approved PR to production branch per documented promotion policy.
2. Trigger production deployment through normal Vercel integration (automated or manual per your setup).
3. Confirm production environment variables are set.
4. Confirm deployment completes without build/runtime errors.
5. Run post-deploy production smoke checks (see Section 7).
6. Announce deployment status in project logs/changelog as needed.

Production go/no-go criteria:

- Deployment status is successful.
- Home and key marketing routes load.
- Metadata and indexing endpoints are healthy.
- Primary conversion links are functional.

---

## 5) Domain and DNS checklist

Apply this checklist before first production launch or when changing domains.

### Corehouse production domain (locked)

| Role | Host |
|------|------|
| Canonical production URL (`NEXT_PUBLIC_SITE_URL`) | `https://corehousepilatescy.com` |
| www alias (redirect only — configure in Vercel Domains) | `https://www.corehousepilatescy.com` |
| Vercel default hostname (redirect to custom domain in Vercel) | `pilates-website-orpin.vercel.app` |

Code reads the canonical base URL from `NEXT_PUBLIC_SITE_URL` via `src/config/site.ts`. That value drives:

- `metadataBase` and page canonical/Open Graph URLs (`src/lib/metadata.ts`)
- `/robots.txt` sitemap pointer (`src/app/robots.ts`)
- `/sitemap.xml` absolute URLs (`src/app/sitemap.ts`)
- Staff invite email redirect targets (`src/app/(marketing)/staff/invite/actions.ts`)

Do **not** set `NEXT_PUBLIC_SITE_URL` to the `www` host or the `*.vercel.app` host in production.

1. Domain is connected to hosting project.
2. DNS records point to the expected hosting provider targets.
3. Primary domain and redirect domain strategy is defined.
4. TLS/HTTPS is active for all user-facing domains.
5. `NEXT_PUBLIC_SITE_URL` matches canonical production domain.
6. Canonical and indexing outputs reflect production domain:
   - page metadata canonical behavior
   - `/robots.txt`
   - `/sitemap.xml`

Do not launch production on a domain mismatch between DNS and `NEXT_PUBLIC_SITE_URL`.

---

## 6) Rollback notes

Use the smallest safe rollback first.

Preferred rollback order:

1. Platform rollback to last known healthy deployment.
2. Revert offending commit(s) and redeploy.
3. Disable or neutralize broken public config values if issue is env-related.

Rollback triggers:

- Critical route fails to load.
- Core navigation broken.
- Severe metadata/indexing issue caused by bad URL config.
- Primary conversion path unavailable.

After rollback:

1. Confirm smoke checks pass on restored version.
2. Document incident in `logs/deployment/` or `logs/bugs/`.
3. Capture root cause and prevention action.

---

## 7) Post-deploy smoke checks

Run in preview and production after each meaningful deployment.

Route health:

- `/`
- `/about`
- `/classes`
- `/pricing`
- `/instructors`
- `/contact`
- `/faq`
- `/blog`
- `/blog/placeholder-slug` (test dynamic route behavior; expect 200 and placeholder content)

Platform/indexing checks:

- `/robots.txt` loads
- `/sitemap.xml` loads

Functional checks:

- Header navigation links work.
- Footer key links work.
- Primary CTA destination works.
- Contact and booking links are valid.

Metadata spot checks:

- Page title/description appear.
- Canonical URL is environment-correct.
- No obvious localhost canonicals on preview/production.

Responsive spot checks:

- Phone width
- Tablet width
- Desktop width

---

## 8) Portability notes for non-Vercel hosting

This project should remain portable.

Portability principles:

- Keep business logic platform-agnostic.
- Keep env access centralized in `src/config/site.ts`.
- Avoid provider-specific runtime assumptions in app code.

If migrating from Vercel later, preserve this lifecycle:

1. Build artifact generation (`npm run build`).
2. Runtime server startup (`npm run start`) or equivalent Next.js runtime support.
3. Environment variable injection for all `NEXT_PUBLIC_*` values.
4. Domain, TLS, and DNS configuration.
5. Equivalent preview/staging flow.
6. Equivalent rollback mechanism.

Portability validation checklist:

- Can run production build on target platform.
- Can serve all routes and metadata/indexing endpoints.
- Can inject environment variables without code changes.
- Can support preview and production environments separately.

---

## 9) Operational logging expectations

For non-trivial deployment planning/execution:

- Create a timestamped log in `logs/deployment/`.
- Keep entries concise and factual.
- Record branch, commit, actions, verification, and next action.

Related policy:

- `docs/logging-strategy.md`

## 10) Future: automated test gates

Once `npm run test` and `npm run test:e2e` are implemented (Milestone 2+):

- Add test execution to the local build expectations (Section 1).
- Include test results in the promotion gate from preview to production.
- Ensure test suites pass before merging to production branch.
- Run smoke tests as part of CI/CD, not just manual post-deploy checks.

Until tests exist, smoke checks remain manual and documented in Section 7.

---

## Definition of done for Task 10

This runbook is considered complete when:

- local build expectations are explicit,
- preview and production flows are documented,
- environment/domain/rollback checklists are defined,
- post-deploy smoke checks are listed,
- and non-Vercel portability is addressed without changing infrastructure now.
