# Manual QA Checklist — Milestone 2 Scaffold Smoke Scope

Use this checklist before and after automated test setup to verify the current scaffold manually.

## Run metadata

- Date (UTC):
- Environment: Local / Preview
- Base URL:
- Tester:
- Result summary: Pass / Fail
- Notes:

## Do now checks (current scaffold smoke scope)

Mark each item:

- [ ] Pass
- [ ] Fail
- [ ] N/A

### A. Route loading and basic rendering

- [ ] `/` loads without error and shows a clear page heading.
- [ ] `/about` loads without error and shows a meaningful page heading.
- [ ] `/classes` loads without error and shows a meaningful page heading.
- [ ] `/contact` loads without error and shows a meaningful page heading.
- [ ] `/faq` loads without error and shows a meaningful page heading.
- [ ] `/instructors` loads without error and shows a meaningful page heading.
- [ ] `/pricing` loads without error and shows a meaningful page heading.
- [ ] `/blog` loads without error and shows blog placeholder/stub content.

### B. Layout shell and navigation

- [ ] Global layout appears on public pages with visible header, main content area, and footer.
- [ ] Primary navigation is visible in header.
- [ ] Each primary nav link loads the expected destination page without 404.
- [ ] Footer renders and includes at least one meaningful link.

### C. Placeholder rendering

- [ ] Placeholder-based pages render expected placeholder heading/text (no blank states).
- [ ] Blog index placeholder content is visible and readable.

### D. Blog slug handling limits (current known constraint)

- [ ] Blog slug behavior is treated as limited/deferred in this milestone due to missing guaranteed fixtures.
- [ ] If testing a sample slug manually, record exact slug and observed behavior in Notes.

### E. Metadata spot-checks (manual)

- [ ] Home page has a non-empty document title.
- [ ] At least two additional marketing pages have non-empty and route-appropriate document titles.
- [ ] At least one checked page has a non-empty meta description.

### F. Robots and sitemap

- [ ] `/robots.txt` is reachable and contains `User-agent` rules.
- [ ] `/sitemap.xml` is reachable and parseable as XML in browser.
- [ ] Sitemap includes expected marketing route URLs (home + primary public pages).

### G. Mobile and responsive spot-checks

- [ ] At a mobile viewport (~375px wide), header/nav remain usable and readable.
- [ ] At a mobile viewport, page heading and primary content remain visible without horizontal scroll.
- [ ] At a desktop viewport, layout spacing remains readable and stable.

### H. Static assets and broken links (smoke)

- [ ] Representative static assets used by layout/pages load without obvious missing-file errors.
- [ ] No obvious broken internal links are found during primary nav click-through.

### I. Basic accessibility spot-checks

- [ ] Each checked page includes one main landmark (`<main>`).
- [ ] Navigation landmark is present and identifiable.
- [ ] A meaningful heading is present on each checked page.
- [ ] Keyboard-only tab flow reaches primary nav links and at least one footer link.

## Deferred / later checks (do not block this milestone)

- [ ] Blog slug fixture-based validation across multiple known slugs.
- [ ] Contact form submission behavior (backend/stub dependent).
- [ ] Full broken-link crawl across all internal links.
- [ ] Automated accessibility scanning and broader WCAG conformance checks.
- [ ] Visual regression or design-token regression checks.

## Failure log (fill only if any item fails)

- Item:
- Route/URL:
- Steps to reproduce:
- Expected:
- Actual:
- Severity: Low / Medium / High
- Follow-up owner:

## Sign-off

- QA checklist completed by:
- Completion date (UTC):
- Ready to proceed to automated testing setup: Yes / No
