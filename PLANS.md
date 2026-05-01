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

Milestone 1 foundation scaffold review and cleanup

### Goal

Review the completed Milestone 1 scaffold, clean up small documentation or metadata drift, and leave the repository ready for the testing foundation milestone.

### Why this matters

Milestone 2 should start from a coherent foundation, with route structure, metadata, naming, tracking docs, and logs aligned before test tooling is introduced.

### Scope

- Check `.env.example` for duplicate or conflicting public config lines.
- Check project tracking docs for leftover scaffold-plan template text or stale status.
- Check Corehouse Pilates Studio naming consistency.
- Check route/layout consistency after removing the default scaffold page.
- Check metadata/config consistency across the app shell, sitemap, robots, and placeholders.
- Keep logging and changelog updates concise and proportionate.

### Out of scope

- Installing test packages.
- Adding test configuration.
- Implementing homepage sections.
- Adding final studio copy, pricing, schedules, booking, CMS, analytics, or integrations.

---

## Required context

- `AGENTS.md`
- `README.md`
- `PLANS.md`
- `CHANGELOG.md`
- `.github/copilot-instructions.md`
- `.codex/playbooks/review-playbook.md`
- `docs/current-state.md`
- `docs/product-requirements.md`
- `docs/site-map.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`
- `docs/ui-architecture.md`
- `docs/responsive-strategy.md`
- `docs/engineering-principles.md`
- `docs/project-ledger.md`
- `docs/decision-log.md`
- `docs/content-model.md`
- `docs/ux-notes.md`
- `docs/logging-strategy.md`
- `logs/README.md`
- Milestone 1 scaffold files under `src/app`, `src/components`, `src/config`, and `src/lib`
- Milestone 1 implementation log

---

## Constraints

- Keep changes small and reviewable.
- Preserve Milestone 1 scope.
- Do not introduce new dependencies, scripts, test tooling, or feature implementation.
- Prefer documentation cleanup over new decisions unless existing docs conflict.
- Keep placeholder copy explicit and avoid unconfirmed business facts.

---

## Proposed file changes

### Modify

- `PLANS.md`
- `CHANGELOG.md`
- `docs/current-state.md`
- `docs/project-ledger.md`
- `src/app/(marketing)/blog/[slug]/page.tsx`

### Create

- one review log under `logs/review/`

### Avoid touching

- package dependencies and lockfile
- test configuration and scripts
- homepage content sections
- booking/CMS/API/integration files

---

## Implementation sequence

1. [done] Read required docs and inspect the Milestone 1 scaffold.
2. [done] Identify cleanup issues in docs, naming, route layout, and metadata.
3. [done] Apply small scoped cleanup fixes and add a review log.
4. [done] Run `npm run lint`.
5. [done] Run `npm run build`.
6. [done] Review the final diff for scope creep.

---

## Verification plan

- [x] `npm run lint`
- [x] `npm run build` passed from `C:\Users\User\Desktop\pilateswebsite`; the mixed-case path still triggers the known Next.js Windows prerender invariant.
- [ ] `npm run test` remains intentionally unavailable until Milestone 2.
- [ ] `npm run test:e2e` remains intentionally unavailable until Milestone 2.

---

## Risks / review points

- Do not turn cleanup into homepage implementation.
- Do not install or configure testing packages before Milestone 2.
- Keep documentation aligned without rewriting the project history.
- Treat broader encoding cleanup in older docs as a separate task unless it blocks this review.

---

## Status log

- 2026-05-01 17:21Z - in_progress - Milestone 1 review and cleanup pass started.
- 2026-05-01 17:25Z - done - Lint passed; build passed from the lowercase workspace path and reproduced the known mixed-case path issue.
- 2026-05-01 17:27Z - done - Final diff reviewed for Milestone 1 scope.

---

## Done when

The task is complete when all of the following are true:

- concrete cleanup issues are fixed or explicitly marked out of scope
- Milestone 1 scope remains intact
- a concise review log exists under `logs/review/`
- lint and build pass or blockers are documented
- the next milestone recommendation is clear
