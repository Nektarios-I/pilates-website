# PLANS.md

This file is the working execution plan for the current major Codex task.

Use it for:

- multi-step tasks
- higher-risk refactors
- scaffold + verify workflows
- tasks that span multiple Codex threads
- tasks that need explicit acceptance criteria

Update it as work progresses.
Keep it concrete and short.
Do not turn it into a generic project wiki.

---

## Current task

### Title

Homepage shell milestone

### Goal

Implement a maintainable homepage shell for Corehouse Pilates Studio using the current Next.js App Router scaffold, shared UI primitives, and testing foundation.

The homepage should introduce the studio structure without locking the project into final visual direction, final business claims, pricing, booking, CMS, or testimonials.

### Scope

- Audit current homepage route, shared components, config, tests, and E2E coverage.
- Replace the homepage placeholder with thin route composition.
- Add reusable homepage/shared section components for:
  - hero
  - value proposition / benefits
  - classes preview
  - instructors preview
  - trust/testimonials preview
  - final CTA
- Separate homepage placeholder-safe content from presentation.
- Add or update tests for homepage rendering, landmarks, heading structure, and primary CTA presence.
- Add `docs/component-implementation-notes.md`.
- Add one concise milestone log entry under `logs/implementation/`.

### Out of scope

- Final visual design direction or design-system sandbox work.
- Booking backend, scheduling, payments, CMS, forms backend, analytics, or authentication.
- Real pricing, credentials, class schedules, addresses, testimonials, or unapproved business claims.
- Rewriting unrelated public routes.
- New dependencies.

### Implementation sequence

1. [done] Read required documentation and audit the current implementation.
2. [done] Update this plan for the homepage-shell milestone.
3. [done] Add homepage content fixtures/types separate from route composition.
4. [done] Add reusable section/card components around existing primitives.
5. [done] Replace the home route placeholder with section composition and route metadata.
6. [done] Add/update RTL and Playwright coverage for the homepage shell.
7. [done] Add component implementation notes and milestone log.
8. [done] Run lint, typecheck, tests, E2E, and build where supported.
9. [done] Review the final diff for scope control and architecture drift.

### Verification plan

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test`
- [x] `npm run test:e2e` passed from `C:\Users\User\Desktop\pilateswebsite`; the mixed-case path first timed out, then reproduced the existing Tailwind resolution issue.
- [x] `npm run build` passed from `C:\Users\User\Desktop\pilateswebsite`.

If a command fails, record the exact command, failure, and recommended next action.

### Status log

- 2026-05-20 08:11Z - in_progress - Homepage shell milestone started; required docs and current scaffold audit completed.
- 2026-05-20 08:25Z - done - Homepage shell, reusable sections, content module, component notes, implementation log, RTL coverage, Playwright coverage, and build verification completed.

### Risks / review points

- `docs/current-state.md` and `docs/project-ledger.md` still describe the testing foundation as next, but the repository now contains Vitest, React Testing Library, Playwright, and test scripts.
- Final copy and visual direction remain unresolved, so this milestone must use clear placeholder-safe wording and restyle-friendly component surfaces.
- Existing untracked docs/logs and one deleted prompt file are outside this task and should not be normalized here.

### Done when

- The home route renders a real shell with the required sections.
- Route composition stays thin and server-first.
- New content is isolated from presentational components.
- Component notes and a milestone log exist.
- Relevant tests are added or updated.
- Verification commands were run or exact blockers were reported.
