# SEO Plan

Purpose: define route-level SEO ownership and implementation expectations before final business content is available.

## Scope and current baseline

- This is a blueprint for current scaffold and next content milestones.
- Current metadata foundation already exists in app layout and route files.
- Current indexing endpoints already exist as `/robots.txt` and `/sitemap.xml`.
- This plan covers public marketing routes only.

Current implementation anchors:

- Root defaults come from `siteMetadata` in `src/lib/metadata.ts`.
- Route-level metadata comes from `createPageMetadata` in `src/lib/metadata.ts`.
- Dynamic blog article metadata currently comes from `generateMetadata` in `src/app/(marketing)/blog/[slug]/page.tsx`.
- Robots output is defined in `src/app/robots.ts`.
- Sitemap output is defined in `src/app/sitemap.ts`.

---

## 1) Page purpose per route

| Route          | User intent                                          | SEO intent                                    | Current status                      |
| -------------- | ---------------------------------------------------- | --------------------------------------------- | ----------------------------------- |
| `/`            | Understand the studio quickly and decide next action | Primary local brand and studio discovery page | Placeholder metadata exists         |
| `/about`       | Validate studio credibility and identity             | Trust and brand-story support page            | Placeholder metadata exists         |
| `/classes`     | Understand available class types and fit             | Service-intent discovery page                 | Placeholder metadata exists         |
| `/pricing`     | Evaluate affordability and offers                    | Conversion-support and offer clarity page     | Placeholder metadata exists         |
| `/instructors` | Validate team qualifications                         | Trust and expertise page                      | Placeholder metadata exists         |
| `/contact`     | Reach the studio and plan visit                      | Local conversion and contact-intent page      | Placeholder metadata exists         |
| `/faq`         | Resolve hesitation and practical questions           | Long-tail question and support page           | Placeholder metadata exists         |
| `/blog`        | Browse educational Pilates content                   | Topical authority and internal-link hub       | Placeholder metadata exists         |
| `/blog/[slug]` | Read one specific article                            | Long-tail article ranking page                | Dynamic placeholder metadata exists |

Notes:

- Internal design route (`/design`) is not a public marketing route and must remain non-indexable. Ensure that route-level metadata exports `robots: { index: false, follow: false, nocache: true }` or that `/design` is added to a `disallow` rule in `src/app/robots.ts`.

---

## 2) Title and description ownership

Ownership model:

1. Global defaults: `src/config/site.ts` and `src/lib/metadata.ts`.
2. Static route metadata: each route `page.tsx` via `createPageMetadata`.
3. Dynamic route metadata: `generateMetadata` on dynamic routes (currently blog slug).

Rules:

- Every public route must define a unique title and description aligned with route purpose.
- Keep titles concise and human-readable.
- Keep descriptions factual and useful; no keyword stuffing.
- Replace placeholder copy route by route as real content is approved.

Implementation expectation:

- Keep metadata logic centralized in helper utilities.
- Keep route files responsible for route-specific title and description only.

---

## 3) Canonical expectations

Current baseline:

- `createPageMetadata` sets canonical via route path in `alternates.canonical`.
- Absolute URL generation depends on `NEXT_PUBLIC_SITE_URL` via `siteConfig.siteUrl`.

Canonical rules:

1. Canonical must resolve to the active domain for preview and production.
2. Avoid localhost canonicals outside local development.
3. Keep one canonical URL per public route.
4. Dynamic blog canonical should use the route slug path.

Operational dependency:

- `NEXT_PUBLIC_SITE_URL` must be set correctly per environment.

---

## 4) Robots expectations

Current baseline:

- `src/app/robots.ts` currently allows full crawl and references sitemap.

Policy expectations:

1. Public marketing routes should be crawlable.
2. Internal/dev-only routes should not be index targets.
3. Robots sitemap reference should always match canonical domain.

Future adjustment trigger:

- If a route is internal, staged, or duplicate-content only, update robots or route-level metadata to prevent indexing.

---

## 5) Sitemap expectations

Current baseline:

- `src/app/sitemap.ts` maps `primaryNavigation` into sitemap entries.

Policy expectations:

1. Sitemap must include all public canonical marketing routes.
2. Internal/dev-only routes must be excluded.
3. URL generation must use environment-correct site base URL.
4. Change frequency and priority are guidance values, not ranking guarantees.

Future extension:

- When real blog content source is introduced, include real article URLs and last-modified timestamps for indexable posts.

---

## 6) Open Graph plan

Current baseline:

- Site-level Open Graph defaults exist in `siteMetadata`.
- Route-level Open Graph title/description/url exist via `createPageMetadata`.

Plan:

1. Preserve current OG fallback behavior for all routes.
2. Add a project-level default OG image asset when brand direction is approved.
3. Add route-specific OG images only where they add clear value (for example home and blog posts).
4. Blog posts should eventually generate post-specific OG metadata once a content model exists.

Asset ownership:

- Final OG image specs and export assets should be captured in design/content workflow, then wired into metadata helpers.

---

## 7) Structured-content notes (later milestone)

Do not implement full schema now; define target shape for later.

Planned schema candidates:

- `Organization` and `LocalBusiness` for studio identity and contact context.
- `WebSite` for global site context.
- `BreadcrumbList` where breadcrumb UX exists.
- `Article` for blog detail pages.
- `FAQPage` for FAQ route when real Q/A content is finalized.

Implementation notes:

- Prefer JSON-LD injected in a controlled, centralized way.
- Use stable, verified business details only.
- Keep schema aligned with visible page content to avoid mismatches.

---

## 8) Local SEO notes for the studio

Local intent priorities:

1. Keep contact and location details consistent across routes.
2. Ensure contact route is complete and clearly discoverable from navigation.
3. Maintain studio name consistency (`Corehouse Pilates Studio`) in metadata and content.
4. Prepare for later addition of verified address, service area, and opening hours once approved.

Content direction for later:

- Classes and pricing pages should map clearly to user search intent (beginners, class type, private sessions, intro offers).
- FAQ should answer practical local-visit questions in plain language.

---

## 10) Route-level implementation checklist

Use this table to track SEO readiness for each public route:

| Route          | Metadata status                    | Canonical correctness           | OG status           | Indexing status                      | Notes/owner                                     |
| -------------- | ---------------------------------- | ------------------------------- | ------------------- | ------------------------------------ | ----------------------------------------------- |
| `/`            | Placeholder in place               | Depends on NEXT_PUBLIC_SITE_URL | OG defaults applied | Allow via robots                     | Update title/description once approved          |
| `/about`       | Placeholder in place               | Depends on NEXT_PUBLIC_SITE_URL | OG defaults applied | Allow via robots                     | Update once studio story is approved            |
| `/classes`     | Placeholder in place               | Depends on NEXT_PUBLIC_SITE_URL | OG defaults applied | Allow via robots                     | Update once class list is finalized             |
| `/pricing`     | Placeholder in place               | Depends on NEXT_PUBLIC_SITE_URL | OG defaults applied | Allow via robots                     | Update once pricing is approved                 |
| `/instructors` | Placeholder in place               | Depends on NEXT_PUBLIC_SITE_URL | OG defaults applied | Allow via robots                     | Update once instructor roster is confirmed      |
| `/contact`     | Placeholder in place               | Depends on NEXT_PUBLIC_SITE_URL | OG defaults applied | Allow via robots                     | Update once contact details are finalized       |
| `/faq`         | Placeholder in place               | Depends on NEXT_PUBLIC_SITE_URL | OG defaults applied | Allow via robots                     | Update once real Q&A is approved                |
| `/blog`        | Placeholder in place               | Depends on NEXT_PUBLIC_SITE_URL | OG defaults applied | Allow via robots                     | Update once publishing policy is set            |
| `/blog/[slug]` | Dynamic placeholder in place       | Slug-aware canonical applied    | OG defaults applied | Allow via robots                     | Add featured image once content model exists    |
| `/design`      | Internal route, no public metadata | Not applicable                  | Not applicable      | Explicitly blocked (robots/metadata) | Must remain non-indexable; verify configuration |

---

1. Replace placeholder descriptions with approved route copy.
2. Validate title uniqueness across all public routes.
3. Confirm canonical outputs in local, preview, and production.
4. Confirm `robots.txt` and `sitemap.xml` resolve on deployed environments.
5. Add default OG image and verify social preview output.
6. Add structured data in phases after content certainty.
7. Run manual SEO smoke checks alongside deployment smoke checks.

---

## Definition of done for Task 11

This SEO plan is complete when it gives a clear blueprint for:

- page purpose per route,
- metadata title/description ownership,
- canonical rules,
- robots and sitemap expectations,
- Open Graph direction,
- structured-content roadmap,
- and local SEO priorities.
