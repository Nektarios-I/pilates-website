# Logging Strategy

## Purpose

This document defines the long-term logging and traceability system for the Corehouse Pilates Studio website project.

The project uses multiple AI-assisted workflows, so logs must make it easy to understand:

- what was done,
- by whom,
- why it was done,
- what changed,
- what was verified,
- and what still remains open.

## Logging goals

The logging system should be:

- simple,
- human-readable,
- consistent,
- easy to search,
- easy to classify,
- and sustainable for long-term use.

## What this logging system is for

This logging system is for:

- planning records,
- implementation summaries,
- testing summaries,
- bug investigation notes,
- deployment notes,
- review outcomes,
- and session-level agent activity summaries.

It is not meant to replace Git history.
It complements Git history by giving higher-level, structured records.

## Log categories

All logs live under the `logs/` directory.

Categories:

- `logs/planning/`
- `logs/implementation/`
- `logs/testing/`
- `logs/bugs/`
- `logs/deployment/`
- `logs/review/`
- `logs/sessions/`

## Naming convention

All committed markdown log files should use this naming format:

`YYYY-MM-DD_HHMMZ__actor__category__topic.md`

Examples:

- `2026-05-01_1735Z__codex__planning__foundation-audit.md`
- `2026-05-02_1010Z__copilot__implementation__header-shell.md`
- `2026-05-02_1415Z__manual__testing__mobile-nav-smoke.md`

Rules:

- use UTC time in the filename,
- use lowercase kebab-case for the topic,
- use one of the approved categories,
- use one actor label only.

## Approved actor labels

- `codex`
- `copilot`
- `manual`
- `ci`

## Required metadata in each log

Each markdown log should start with a short metadata block.

Required fields:

- date
- actor
- category
- topic
- branch
- commit
- related plan
- related prompt
- status

## Required content sections

Each committed log file should contain these sections:

1. Purpose
2. Inputs / context used
3. Actions performed
4. Files changed or inspected
5. Commands run
6. Result
7. Verification
8. Blockers / risks
9. Next recommended action

## What should be logged

Create a log entry when:

- a Codex planning pass is completed,
- a Codex implementation pass changes files,
- Copilot is used for a non-trivial generation or refactor,
- tests are added or a significant test run is completed,
- a bug is investigated,
- a deployment is prepared or executed,
- a review identifies important issues,
- a milestone starts or finishes.

## What should not be logged

Do not create committed logs for:

- trivial autocomplete events,
- tiny typo fixes,
- repeated failed experiments with no learning value,
- large raw terminal dumps,
- redundant copies of information already captured better elsewhere.

## Relationship to other tracking files

### CHANGELOG.md

Use `CHANGELOG.md` for curated notable project changes intended for humans reading project progress at a high level.

### docs/decision-log.md

Use `docs/decision-log.md` for architectural or workflow decisions.

### docs/project-ledger.md

Use `docs/project-ledger.md` for overall project status and milestone tracking.

### PLANS.md

Use `PLANS.md` for the active execution plan of the current major task.

## Raw outputs and temporary files

Raw machine-generated outputs should not usually be committed unless they are genuinely useful.
Prefer a short human summary log over dumping raw text.

If raw output must be preserved temporarily, keep it outside the committed log structure or convert it into a summarized markdown log.

## Logging quality rules

- Keep logs concise but informative.
- Prefer facts over vague summaries.
- Record verification honestly.
- State blockers clearly.
- Name files consistently.
- Do not mix categories.
- Keep one primary topic per log file.

## Minimum logging rule for agents

Any Codex or Copilot task that materially changes the repo or produces a major plan should also produce a matching markdown log entry.

## Definition of success

The logging system is successful if:

- a future developer can understand what happened,
- important actions are easy to trace,
- milestones are auditable,
- and the project remains readable over time.
