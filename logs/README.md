# Logs

This folder stores structured project logs for the Corehouse Pilates Studio website.

## Purpose

Logs capture meaningful project activity across planning, implementation, testing, bug fixing, deployment, review, and session summaries.

They should help answer:

- what happened,
- when it happened,
- who performed it,
- what changed,
- what was verified,
- and what should happen next.

## Folder structure

- `planning/` — planning passes, audits, task decomposition
- `implementation/` — meaningful coding or scaffold work
- `testing/` — test setup, test runs, verification summaries
- `bugs/` — bug investigations and fixes
- `deployment/` — deployment setup and deployment outcomes
- `review/` — review findings and quality assessments
- `sessions/` — session-level summaries spanning multiple tasks

## File naming convention

Use:

`YYYY-MM-DD_HHMMZ__actor__category__topic.md`

Example:
`2026-05-01_1735Z__codex__planning__foundation-audit.md`

## Allowed actor values

- `codex`
- `copilot`
- `manual`
- `ci`

## Suggested template

```md
# Log Entry

- Date:
- Actor:
- Category:
- Topic:
- Branch:
- Commit:
- Related Plan:
- Related Prompt:
- Status:

## Purpose

## Inputs / Context Used

## Actions Performed

## Files Changed or Inspected

## Commands Run

## Result

## Verification

## Blockers / Risks

## Next Recommended Action
```

## Logging policy

- Commit markdown summary logs.
- Avoid committing noisy raw terminal output.
- Keep one main topic per log file.
- If the work is trivial, do not create a log.
