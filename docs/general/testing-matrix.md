<!--
Testing Matrix for Milestone 2 (smoke scope)
Do not add test code here — this file defines the minimum testable surfaces
based on the current Milestone 1 scaffold.
-->

# Testing Matrix — Milestone 2 (scaffold smoke tests)

## Purpose

This document defines the minimum testable surfaces for Milestone 2 using the
current repository scaffold. Each entry lists the route/component/surface,
recommended test level, why it matters, the minimum assertion for a smoke test,
and whether it belongs in the immediate smoke-test scope (Now) or should be
deferred until later (Later).

## Scope rules

- Use the repository as it exists now — do not invent routes or features.
- Keep smoke tests narrow: renderability, metadata present, navigation, and
  indexing artifacts (robots/sitemap).
- Defer detailed content, publishing flows, authoring, and dynamic data tests
  until sample data or CMS integration exists.

## Matrix

| Route / Component / Surface                                                            |               Test level | Why it matters                                                                                 | Minimum assertion (smoke)                                                                                                                        |    Defer? |
| -------------------------------------------------------------------------------------- | -----------------------: | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------: |
| `src/app/layout.tsx` (root layout)                                                     |              integration | Global layout and metadata defaults; wraps all pages                                           | Renders without error; page contains `header`, `main`, and `footer` landmarks; metadata defaults exist                                           |       Now |
| `src/components/layout/page-shell.tsx`                                                 |              integration | App shell composition used by pages                                                            | Renders children and exposes main content area (role=main)                                                                                       |       Now |
| `src/components/layout/site-header.tsx`                                                |                     unit | Primary navigation entrypoint and branding                                                     | Logo (or site title) present and primary nav element exists with at least one anchor                                                             |       Now |
| `src/components/layout/site-footer.tsx`                                                |                     unit | Trust signals and contact links                                                                | Footer renders and contains at least one link (contact/legal)                                                                                    |       Now |
| `src/config/navigation.ts` (nav data) + `site-navigation` component                    |              integration | Ensures nav config maps to visible links and routes                                            | Navigation configuration yields anchor elements whose `href` match known marketing routes                                                        |       Now |
| `src/components/sections/page-placeholder.tsx`                                         |                     unit | Placeholder used across scaffold pages                                                         | Renders expected heading/text for placeholders when included by pages                                                                            |       Now |
| `src/app/(marketing)/page.tsx` (marketing home placeholder)                            |              integration | Entry page for public site — core conversion surface                                           | Page renders (status 200 in e2e) and contains a top-level heading and either the placeholder component or hero text                              |       Now |
| Public marketing pages: `about`, `classes`, `contact`, `faq`, `instructors`, `pricing` |              integration | Core marketing routes for local SEO and conversion                                             | Each route renders and includes a meaningful `<h1>` and page-level metadata (`title`)                                                            |       Now |
| `src/app/(marketing)/blog/page.tsx` (blog index placeholder)                           |              integration | Blog index scaffold — discoverability and list surface                                         | Page renders and includes a list/placeholder area for posts or a clear stub message                                                              |       Now |
| `src/app/(marketing)/blog/[slug]/page.tsx` (blog slug)                                 |        integration / e2e | Individual post pages (dynamic). Repo currently has a dynamic route but no guaranteed fixtures | Defer until sample slugs or fixtures are added; Later. When implemented: rendering for a known sample slug returns 200 and includes a post title |     Later |
| `src/app/robots.ts`                                                                    |              integration | Search indexing control                                                                        | `robots.txt` exports/route renders valid robots content and contains `User-agent` rules                                                          |       Now |
| `src/app/sitemap.ts`                                                                   |              integration | Site indexing; ensures sitemap includes public routes                                          | Sitemap generation returns entries for marketing routes and is machine-readable (valid XML)                                                      |       Now |
| `src/lib/metadata.ts` (metadata helpers)                                               |                     unit | Centralized metadata utilities used by pages                                                   | Utilities return title/description shapes and pages override root metadata where expected                                                        |       Now |
| Basic accessibility landmarks (header/nav/main/footer)                                 | integration / a11y-smoke | Verify basic semantics are present across pages                                                | `nav` is present and labelled; page has a single `main` landmark; headings exist for content sections                                            |       Now |
| Primary nav link integrity (sanity click-through)                                      |                      e2e | Ensure navigation actually reaches pages (smoke E2E)                                           | Clicking primary nav links loads destination pages without 404 (status 200)                                                                      | Now (E2E) |
| Static asset availability (public/)                                                    |              integration | Critical images/brand assets should resolve                                                    | Representative asset(s) referenced by layout load without 404                                                                                    |       Now |

## Deferred / Later tests (examples)

- Blog slug content rendering and metadata for multiple slugs — Later (requires fixtures)
- Form submission flows (e.g., contact) — Later (requires backend or stubbed endpoints)
- Visual regression / design token checks — Later
- Detailed accessibility audits (axe) and WCAG conformance testing beyond landmarks — Later
- Link-crawl for all internal links across the site (full-site broken-link sweep) — Later

## Assumptions and notes

- The matrix is conservative and reflects only files and routes present in the
  current scaffold under `src/app` and `src/components`.
- Dynamic routes (blog `[slug]`) are present but lack guaranteed sample
  fixtures in the scaffold; therefore slug-level rendering is deferred until
  example content is added or fixtures are provided.
- E2E entries are included in the smoke scope to cover basic navigation and
  indexability, but actual implementation requires Playwright (installation
  planned in the testing foundation milestone).

## Recommended immediate smoke-test scope

- Render tests (Vitest/React Testing Library): root layout, page-shell,
  header, footer, placeholder component, metadata helpers.
- Integration render checks: marketing homepage and public pages listed above.
- Simple E2E smoke checks (Playwright): primary nav click-throughs, robots,
  and sitemap endpoints.

## Next step

Implement the manual QA checklist to mirror these smoke tests:

- See `docs/copilot-task-queue.md` → Task 2 — Manual QA checklist.

File: [docs/testing-matrix.md](docs/testing-matrix.md)
