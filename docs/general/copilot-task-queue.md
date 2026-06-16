# Copilot Task Queue

## Purpose

This file controls low-risk, high-value Copilot work while Codex is unavailable.

Use Copilot for:

- documentation,
- testing preparation,
- design-system preparation,
- deployment/SEO preparation,
- small isolated implementation tasks.

Do not use Copilot for:

- broad repo redesign,
- multi-milestone implementation,
- large refactors without a reviewed plan,
- booking/CMS/analytics integrations,
- major architecture changes.

---

## Current repository state

- Milestone 1 foundation scaffold is complete.
- Milestone 1 cleanup/review is complete.
- The next Codex milestone is Milestone 2: testing foundation.
- The codebase currently has scaffold routes, shared layout, config, metadata, robots, and sitemap.
- Real homepage sections, final design system, test framework setup, and deployment hardening are not complete yet.

---

## Global rules for Copilot

1. Work on exactly one task at a time.
2. Read the required context files before making suggestions.
3. Prefer updating docs and structured plans before code.
4. For code tasks, first propose a short file-by-file plan unless the task is trivial.
5. Keep route files thin.
6. Follow the documented architecture exactly.
7. Prefer server components unless interactivity is required.
8. Do not add unnecessary dependencies.
9. Do not invent business facts or fake production content.
10. When a task is complete, summarize:

- files changed,
- what was done,
- what remains,
- what the next task should be.

---

## Standard context files

Always include these in Copilot context:

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `README.md`
- `docs/current-state.md`
- `docs/project-ledger.md`
- `docs/architecture.md`

Add task-specific files as needed.

---

## Milestone-prep queue

### Task 0 — Repository consistency pass

**Goal**
Make sure the written project state matches reality before more work starts.

**Files to inspect**

- `README.md`
- `PLANS.md`
- `CHANGELOG.md`
- `docs/current-state.md`
- `docs/project-ledger.md`
- `.github/prompts/*`
- `.codex/prompts/*`

**Deliverables**

- small doc cleanup only if needed
- remove empty/duplicate/typo prompt files if they exist
- no architecture changes

**Done when**

- repo status wording is consistent
- current milestone wording is consistent
- no obviously stale prompt/template noise remains

**Avoid**

- feature work
- testing framework installation
- content expansion

---

### Task 1 — Testing matrix

**Goal**
Define exactly what must be tested in Milestone 2.

**Create**

- `docs/testing-matrix.md`

**Include**

- test target
- route/component/surface
- test level: unit, integration, e2e
- why it matters
- minimum assertion
- deferred until later? yes/no

**Minimum entries**

- root layout/app shell
- homepage placeholder
- primary navigation
- public marketing routes
- blog index placeholder
- blog slug placeholder
- robots
- sitemap
- metadata behavior where practical

**Done when**

- Milestone 2 test scope is explicit and minimal
- smoke coverage targets are clear
- later tests are separated from current tests

**Avoid**

- writing actual test files
- framework setup
- over-expanding into full regression planning

---

### Task 2 — Manual QA checklist

**Goal**
Create a manual verification checklist that mirrors the future smoke tests.

**Create**

- `docs/manual-qa-checklist.md`

**Include**

- route loading
- navigation links
- placeholder rendering
- blog slug behavior
- metadata spot-checks
- robots/sitemap availability
- mobile checks
- broken-link checks
- accessibility spot-check basics

**Done when**

- a human can verify the scaffold quickly before and after Milestone 2

**Avoid**

- long prose
- future feature QA that is not relevant yet

---

### Task 3 — Testing runbook

**Goal**
Prepare the repo for a clean future testing setup.

**Create**

- `docs/testing-runbook.md`

**Include**

- intended test folders
- naming conventions
- test file patterns
- smoke-test philosophy
- accessible selector guidance
- unit vs integration vs e2e boundaries
- expected commands
- how to add tests safely later

**Done when**

- Codex can use this file as an exact implementation target for Milestone 2

**Avoid**

- package installation
- test implementation
- advanced mocking strategy

---

### Task 4 — Brand direction brief

**Goal**
Choose 2–3 plausible aesthetic directions for the Pilates studio.

**Create**

- `docs/brand-direction.md`

**Include for each direction**

- name of direction
- mood
- typography direction
- color direction
- imagery direction
- spacing density
- motion tone
- why it fits a Pilates studio
- what to avoid
- 3 reference site examples to study manually

**Done when**

- one direction can be chosen as the basis for token design

**Avoid**

- writing final marketing copy
- implementing the full homepage

---

### Task 5 — Design tokens plan

**Goal**
Define the design-token system before UI implementation expands.

**Create**

- `docs/design-tokens.md`

**Include**

- color tokens
- surface tokens
- text tokens
- spacing tokens
- radius tokens
- shadow tokens
- layout/container tokens
- component intent tokens for button, card, input, section, badge

**Done when**

- the visual system is described well enough to build a design test page

**Avoid**

- random ad hoc CSS values
- premature component implementation

---

### Task 6 — Design test page spec

**Goal**
Specify exactly what the design test page should contain before building it.

**Create**

- `docs/design-test-page-spec.md`

**Include**

- typography specimen
- color/surface stack
- primary/secondary/ghost buttons
- inputs and focus states
- cards
- badges
- section container spacing
- light/dark mode expectations
- mobile vs desktop checks

**Done when**

- the test page can be implemented without making new design decisions

**Avoid**

- building the page yet if the design direction is not chosen

---

### Task 7 — Design test page implementation

**Goal**
Build a private or clearly non-production design sandbox page using the approved tokens.

**Suggested output**

- one isolated page or route
- clearly marked as design/dev sandbox
- reusable primitives only
- no business claims
- no production homepage content

**Done when**

- buttons, typography, spacing, surfaces, cards, and form elements can be reviewed visually
- light/dark mode works if already supported

**Avoid**

- turning the sandbox into the real homepage
- large business-content sections

---

### Task 8 — Component inventory

**Goal**
Identify which components should be reusable before homepage implementation.

**Create**

- `docs/component-inventory.md`

**Include**

- component name
- purpose
- likely props
- depends on tokens? yes/no
- used by which pages
- priority: now/later

**Minimum candidates**

- header
- footer
- nav item
- section wrapper
- CTA block
- page hero
- class card
- instructor card
- testimonial card
- pricing card
- FAQ item

**Done when**

- future homepage implementation can be split into reusable pieces cleanly

---

### Task 9 — Environment matrix

**Goal**
Prepare environment-variable handling clearly before deployment or integrations.

**Create**

- `docs/environment-matrix.md`

**Inspect**

- `.env.example`
- `src/config/*`

**Include**

- variable name
- purpose
- server-only or public
- local / preview / production
- required or optional
- current status
- notes

**Done when**

- env handling is explicit and future-safe

**Avoid**

- inventing secrets
- adding production values

---

### Task 10 — Deployment runbook

**Goal**
Prepare for Vercel deployment and later non-Vercel portability.

**Create**

- `docs/deployment-runbook.md`

**Include**

- local build expectations
- preview deployment flow
- production deployment flow
- env var checklist
- domain/DNS checklist
- rollback notes
- post-deploy smoke checks
- portability notes for non-Vercel hosting

**Done when**

- deployment has a documented operational path

**Avoid**

- changing hosting provider setup now
- adding infra complexity prematurely

---

### Task 11 — SEO plan

**Goal**
Define metadata and SEO expectations before real content arrives.

**Create**

- `docs/seo-plan.md`

**Include**

- page purpose per route
- title/description ownership
- canonical expectations
- robots expectations
- sitemap expectations
- OG image plan
- structured-content notes for later
- local SEO notes for the studio

**Done when**

- metadata/content implementation later has a clear blueprint

---

### Task 12 — Content architecture

**Goal**
Prepare page-level content structure without writing final copy.

**Create**

- `docs/content-architecture.md`

**Include**

- each key page
- page purpose
- target visitor intent
- primary CTA
- secondary CTA
- required sections
- trust signals needed
- content still unknown

**Done when**

- homepage and public pages can be implemented structurally without inventing messaging

**Avoid**

- polished marketing copywriting
- CMS integration

---

## Handoff back to Codex

Pause Copilot-first work and return to Codex when one of these is true:

- `docs/testing-matrix.md`, `docs/manual-qa-checklist.md`, and `docs/testing-runbook.md` are complete
- the design direction and token plan are approved
- the design test page is implemented and reviewed
- the deployment and SEO runbooks are in place

At that point ask Codex to:

1. implement Milestone 2 test tooling,
2. review and tighten the design sandbox if needed,
3. scaffold the next implementation milestone with the new docs as context.
