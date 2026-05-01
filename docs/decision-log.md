# Decision Log

## Purpose

This file tracks important project decisions so the reasoning behind the architecture and workflow is not lost over time.

Use short entries.
Link to other docs when needed.

---

## Entry template

### DEC-0001 — Title

- Date:
- Status: proposed | accepted | replaced
- Context:
- Decision:
- Why:
- Consequences:
- Related files:

---

## Decisions

### DEC-0001 — Use Next.js App Router with TypeScript

- Date: 2026-05-01
- Status: accepted
- Context:
  The project needs strong structure, SEO support, maintainability, and flexible deployment.
- Decision:
  The intended stack uses Next.js App Router with TypeScript.
- Why:
  This supports route structure, metadata handling, modular implementation, and future extensibility.
- Consequences:
  Route organization, metadata files, and app structure should follow App Router conventions.
- Related files:
  - `docs/architecture.md`
  - `docs/site-map.md`

### DEC-0002 — Use mobile-first responsive implementation

- Date: 2026-05-01
- Status: accepted
- Context:
  The website must work well on phones from the beginning.
- Decision:
  The implementation should follow a mobile-first responsive strategy.
- Why:
  Phone usability is a first-class requirement, not a late-stage adjustment.
- Consequences:
  Layout, navigation, and testing must validate phone behavior early.
- Related files:
  - `docs/responsive-strategy.md`

### DEC-0003 — Prioritize modular, swappable UI architecture

- Date: 2026-05-01
- Status: accepted
- Context:
  Client requirements and visual direction may still change.
- Decision:
  The UI architecture must support easy replacement of layout patterns, sections, and styling decisions.
- Why:
  This reduces rework while the design is still evolving.
- Consequences:
  Routes stay thin, sections remain modular, and styling decisions should be centralized.
- Related files:
  - `docs/ui-architecture.md`

### DEC-0004 — Maintain persistent project meta-documentation

- Date: 2026-05-01
- Status: accepted
- Context:
  Project state, technologies, decisions, and next actions should remain easy to inspect at any time.
- Decision:
  Maintain a project ledger and decision log throughout the project lifecycle.
- Why:
  This improves continuity, onboarding, and decision traceability.
- Consequences:
  These files must be updated when meaningful changes happen.
- Related files:
  - `docs/project-ledger.md`
  - `docs/decision-log.md`

### DEC-0005 — Use Vitest for unit and integration tests

- Date: 2026-05-01
- Status: accepted
- Context:
  The project needs a modern, maintainable unit/integration testing setup for a Next.js App Router website.
- Decision:
  Use Vitest together with React Testing Library for unit and integration tests.
- Why:
  This is the initial locked testing direction for the project.
- Consequences:
  Future test setup and prompts should assume Vitest unless this decision is explicitly changed.
- Related files:
  - `docs/testing-strategy.md`

### DEC-0006 — Use Playwright for end-to-end tests

- Date: 2026-05-01
- Status: accepted
- Context:
  The project needs browser-level validation for critical user journeys and responsive behavior.
- Decision:
  Use Playwright for E2E testing.
- Why:
  This is the locked E2E testing direction for the project.
- Consequences:
  Responsive smoke tests and critical navigation flows should eventually be implemented in Playwright.
- Related files:
  - `docs/testing-strategy.md`

### DEC-0007 — First implementation milestone is foundation scaffold only

- Date: 2026-05-01
- Status: accepted
- Context:
  The repository still needs structure alignment before actual feature implementation.
- Decision:
  Milestone 1 is foundation scaffold only.
- Why:
  The project should first establish route structure, shared layout, metadata foundation, configuration structure, and architecture folders before homepage implementation.
- Consequences:
  Homepage shell work comes after the scaffold and testing foundation.
- Related files:
  - `docs/project-ledger.md`
  - `docs/current-state.md`
