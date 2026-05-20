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

Milestone 2 testing foundation

### Goal

Add a clean, maintainable automated testing baseline for the current Next.js App Router marketing scaffold using Vitest, React Testing Library, and Playwright.

### Why this matters

The repository is ready for follow-on homepage and route implementation, but promotion and future build work need automated smoke coverage first. This milestone turns the documented testing strategy into runnable commands without redesigning the site or inventing new business content.

### Scope

- Audit the current scaffold, scripts, source layout, and tooling config.
- Add unit/integration test tooling with Vitest and React Testing Library.
- Add E2E tooling with Playwright.
- Add focused smoke tests for the current app shell, navigation, placeholders, page route rendering, metadata helpers, robots, sitemap, and one navigation path.
- Add or update only the scripts and config required to run those tests.
- Record the milestone outcome in `logs/testing/`.

### Out of scope

- Homepage redesign or visual polish.
- Real studio copy, pricing, schedules, booking, CMS, analytics, payments, or form backends.
- Broad component refactors.
- Visual regression testing.
- Full accessibility automation beyond semantic smoke assertions.
- CI workflow implementation.

---

## Required context

- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `package.json`
- `tsconfig.json`
- `.github/copilot-instructions.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`
- `docs/copilot-task-queue.md`
- `docs/current-state.md`
- `docs/project-ledger.md`
- `docs/product-requirements.md`
- `docs/site-map.md`
- `docs/component-inventory.md`
- `docs/design-tokens.md`
- `docs/design-test-page-spec.md`
- `docs/environment-matrix.md`
- `docs/deployment-runbook.md`
- `docs/seo-plan.md`
- `docs/content-architecture.md`
- `docs/testing-matrix.md`
- `docs/testing-runbook.md`
- `docs/logging-strategy.md`
- Current implementation under `src/app`, `src/components`, `src/config`, and `src/lib`
- Current Next.js, ESLint, TypeScript, and PostCSS config files

---

## Constraints

- Keep changes small and reviewable.
- Preserve the existing server-first App Router scaffold.
- Keep route files thin and avoid unrelated app changes.
- Prefer accessible selectors and behavior-focused tests.
- Avoid unnecessary dependencies and heavyweight mocks.
- Do not touch unrelated untracked work or deleted files already present in the worktree.

---

## Proposed file changes

### Modify

- `PLANS.md`
- `package.json`
- `package-lock.json`

### Create

- `vitest.config.ts`
- `playwright.config.ts`
- `src/test/setup.ts`
- focused `*.test.ts` / `*.test.tsx` files near the surfaces they cover
- `e2e/navigation.spec.ts`
- one testing log under `logs/testing/`

### Avoid touching

- homepage or route copy beyond test imports
- design sandbox implementation
- booking/CMS/API/integration files
- unrelated docs and existing untracked files

---

## Implementation sequence

1. [done] Read required docs and inspect the current scaffold/config.
2. [done] Update this plan for Milestone 2.
3. [done] Install the minimal Vitest, React Testing Library, jsdom, and Playwright packages.
4. [done] Add Vitest and Playwright configuration plus shared test setup.
5. [done] Add initial smoke tests for layout, navigation, placeholders, route pages, metadata, robots, sitemap, and one E2E navigation path.
6. [done] Add a concise `logs/testing/` entry.
7. [done] Run lint, typecheck, unit/integration tests, E2E tests, and build where supported.
8. [done] Review the final diff for architectural drift and unnecessary scope.

---

## Verification plan

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test`
- [x] `npm run test:e2e`
- [x] `npm run build` passed from `C:\Users\User\Desktop\pilateswebsite`; the mixed-case path `C:\Users\User\Desktop\PilatesWebsite` still reproduces the known Next.js prerender invariant.

If any check is blocked, record the exact command, failure, and recommended next action.

---

## Risks / review points

- Playwright may need browser binaries installed locally before E2E tests can run.
- Next.js 16 and React 19 are current in this repo; keep the test setup aligned with installed versions rather than adding compatibility shims prematurely.
- Existing untracked docs/design sandbox files are outside this milestone and should remain untouched.
- The dynamic blog route has no content fixtures; keep slug tests smoke-level only if covered through E2E route loading later.
- `npm audit` currently reports vulnerabilities in existing framework/transitive dependencies; decide on a separate dependency patch task rather than hiding it in this milestone.

---

## Status log

- 2026-05-20 05:56Z - in_progress - Milestone 2 testing foundation started; required docs and current scaffold audit in progress.
- 2026-05-20 06:09Z - in_progress - Vitest/RTL and Playwright config added; lint, typecheck, unit/integration tests, E2E tests, and lowercase-path build pass.
- 2026-05-20 06:13Z - done - Final diff reviewed; test setup remains scoped to tooling, smoke tests, plan, gitignore, and testing log.

---

## Done when

The task is complete when all of the following are true:

- test packages and scripts exist for Vitest/RTL and Playwright
- initial smoke coverage is in place for the current scaffold
- the implementation follows the documented architecture
- a concise testing log exists under `logs/testing/`
- relevant checks were run or exact blockers were reported
- the next recommended task is clear
