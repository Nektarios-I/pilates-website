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

## How to use this file

For each major task:

1. Copy this structure.
2. Fill in the current task details.
3. Keep the steps small and checkable.
4. Update status as work completes.
5. Use it alongside Codex threads and task prompts.

Recommended status values:

- planned
- in_progress
- blocked
- done

---

## Current task

### Title

<!-- Example: Scaffold initial App Router marketing foundation -->

### Goal

<!-- What should exist or be true when this task is complete? -->

### Why this matters

<!-- Why this task is worth doing now -->

### Scope

<!-- What is included -->

### Out of scope

<!-- What is intentionally excluded -->

---

## Required context

List the files and docs that must be read before implementation.

- `AGENTS.md`
- `README.md`
- `.github/copilot-instructions.md`
- `docs/product-requirements.md`
- `docs/site-map.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`

Add any task-specific files below:

- <!-- file path -->

---

## Constraints

- Follow documented architecture.
- Keep route files thin.
- Prefer server components by default.
- Use semantic HTML.
- Avoid unnecessary dependencies.
- Add or update tests when behavior changes.
- Keep the solution small, clean, and reviewable.

Add any task-specific constraints below:

- <!-- constraint -->

---

## Proposed file changes

List files to create or modify.

### Create

- <!-- path -->

### Modify

- <!-- path -->

### Avoid touching

- <!-- path -->

---

## Implementation sequence

Break the work into small ordered steps.

1. [planned] <!-- step -->
2. [planned] <!-- step -->
3. [planned] <!-- step -->
4. [planned] <!-- step -->

---

## Verification plan

List the exact checks to run.

- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run test:e2e`
- [ ] `npm run build`

Add any task-specific verification below:

- [ ] <!-- command -->

If a command is currently blocked, note why in the status section.

---

## Risks / review points

List what could go wrong or what needs special review.

- <!-- risk -->
- <!-- review point -->

---

## Status log

Use short timestamped notes.

- YYYY-MM-DD HH:MM — planned — initial plan created
- YYYY-MM-DD HH:MM — in_progress — implementation started
- YYYY-MM-DD HH:MM — blocked — waiting on missing package / config
- YYYY-MM-DD HH:MM — done — task completed and verified

---

## Done when

The task is complete when all of the following are true:

- the requested behavior or structure exists
- the implementation matches the documented architecture
- relevant tests were added or updated
- relevant checks passed or blockers were explicitly documented
- the diff is clean and reviewable

## Logging linkage

For every major task tracked in this plan, create a corresponding log entry in `logs/` when:

- planning is completed,
- implementation materially changes files,
- testing or review produces meaningful results,
- or blockers significantly change the next steps.

The log filename should follow the naming convention defined in `docs/logging-strategy.md`.
