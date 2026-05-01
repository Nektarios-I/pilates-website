# AGENTS.md

## Purpose

This repository contains a production-grade website for a professional Pilates studio.

The project is built with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Testing Library
- Playwright

Primary goals:

- maintainability
- modularity
- accessibility
- SEO
- performance
- safe future extensibility
- portability beyond Vercel

Codex should behave like a careful senior engineer working inside an existing architecture, not like an unconstrained generator.

---

## Read these files first

Before making non-trivial changes, read these files:

- `README.md`
- `.github/copilot-instructions.md`
- `docs/product-requirements.md`
- `docs/site-map.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`

If any of those files conflict with your assumptions, follow the repository docs and do not invent alternatives silently.

---

## Repository layout

Important directories:

- `src/app` → routes, layouts, metadata, route-level composition
- `src/components` → reusable presentational components
- `src/components/ui` → low-level UI primitives
- `src/components/layout` → shared layout pieces such as header/footer
- `src/components/sections` → reusable marketing sections
- `src/features` → domain/business modules such as classes, pricing, instructors
- `src/lib` → shared utilities
- `src/config` → typed environment/config access
- `src/hooks` → reusable hooks
- `src/styles` → global styling and design-system related files
- `src/test` → shared test utilities and setup
- `e2e` → Playwright tests
- `public` → static assets

Keep routing concerns in `src/app`.
Keep business/domain logic out of route files whenever possible.
Keep components small and cohesive.

---

## Working style

For difficult, multi-file, ambiguous, or risky tasks:

1. Read the relevant docs first.
2. Summarize the task briefly.
3. Propose a file plan before editing.
4. Implement the smallest clean solution that fits the architecture.
5. Add or update tests when behavior changes.
6. Run the relevant checks.
7. Review the diff for architectural drift, regressions, and unnecessary complexity.
8. Report exactly what changed and anything still unresolved.

For small, obvious tasks, a short implementation is acceptable, but still respect structure and verification rules.

---

## Architecture rules

- Use Next.js App Router only.
- Prefer Server Components by default.
- Use Client Components only when interactivity or browser APIs are required.
- Keep page files thin.
- Do not place heavy business logic in `page.tsx`.
- Extract reusable UI early when repetition becomes clear.
- Keep shared utilities pure where possible.
- Centralize environment variable access in `src/config`.
- Avoid unnecessary dependencies.
- Prefer explicit props and types over hidden coupling.
- Prefer boring, stable solutions over clever abstractions.

If a route needs substantial content sections, compose the page from section components rather than building one giant file.

---

## Design and content rules

This is a premium Pilates studio website, not a generic SaaS landing page.

The desired tone is:

- calm
- elegant
- trustworthy
- modern
- restrained

Avoid:

- purple gradient-heavy startup aesthetics
- generic AI-style marketing copy
- giant monolithic feature grids
- lorem ipsum
- fake integrations
- over-designed placeholders

Use clear placeholder copy when final business copy is not available.
Prefer semantic HTML and accessible structure from the beginning.

---

## SEO and metadata rules

- Every public page should have meaningful metadata.
- Use root metadata defaults and page-level overrides where appropriate.
- Support `robots.ts` and `sitemap.ts`.
- Structure content for real Pilates studio discovery and conversion.
- Keep local business SEO in mind for classes, instructors, pricing, and contact pages.

Do not leave important public pages without titles/descriptions once metadata scaffolding exists.

---

## Testing and verification rules

Behavior changes should usually include tests.

Use:

- React Testing Library for unit/integration behavior
- Playwright for end-to-end critical journeys

Preferred verification flow:

1. lint
2. typecheck
3. relevant unit/integration tests
4. relevant e2e or smoke tests when routing or critical UX changed
5. build when the change is substantial

Test behavior, not implementation details.
Prefer accessible selectors such as role and label based queries.

---

## Commands

Use these commands when available:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:e2e
```

If a script is missing, inspect `package.json` before assuming the correct command.
If setup is incomplete, propose the minimal missing script/config needed.

---

## Safety rules

- Do not invent APIs, env vars, routes, or CMS schemas unless the docs explicitly support them.
- Do not rewrite large parts of the repository without first proposing a plan.
- Do not silently move files to a new architecture style.
- Do not introduce vendor lock-in in core app logic.
- Do not hardcode secrets, production URLs, or credentials.
- Do not edit unrelated files “while you are there”.
- Do not change formatting/config/tooling rules unless the task requires it.

When uncertain, ask for clarification or state the assumption explicitly.

---

## Definition of done

A task is only done when all of the following are true:

- the requested behavior is implemented
- the code fits the documented architecture
- changes are small enough to review comfortably
- relevant tests were added or updated when needed
- relevant checks were run or explicitly reported as pending
- the final diff does not introduce obvious duplication or architectural drift

---

## Task output format

At the end of non-trivial tasks, report:

1. files changed
2. what was implemented
3. checks run
4. any assumptions made
5. any remaining follow-up work

Keep the summary concise and concrete.
