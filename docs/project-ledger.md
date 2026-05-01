# Project Ledger

## Purpose

This file is the ongoing high-level record of the project from start to current state.

It should always allow a developer to quickly understand:

- what the project is,
- what technologies are being used,
- what has already been decided,
- what stage the project is in,
- and what should happen next.

---

## Project identity

- Project: Corehouse Pilates Studio Website
- Type: Marketing website for a professional Pilates studio
- Status: Milestone 1 foundation scaffold reviewed and ready for testing foundation

---

## Intended technology stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Vitest + React Testing Library
- Playwright
- Vercel as initial deployment target

---

## Current stage

Milestone 1 foundation scaffold is complete and has had a cleanup review. The project now has the public route structure, shared layout shell, metadata/indexing foundation, and config structure without final homepage sections or test tooling.

---

## Completed so far

- Repository guidance files prepared
- Product and architecture docs prepared
- Copilot guidance files prepared
- Codex guidance files prepared
- Structured logging system prepared
- Site map prepared for Milestone 1 public routes
- Milestone 1 foundation scaffold completed
- Milestone 1 scaffold cleanup review completed

---

## Key active priorities

1. Set up testing baseline with Vitest, React Testing Library, and Playwright
2. Implement homepage shell
3. Continue page-by-page implementation

---

## Open questions

- Final visual identity and color direction?
- Final navigation style?
- Booking integration details?
- CMS needed or not?
- Real content availability?

---

## Current risks

- Requirements still changing
- Final design direction not locked
- Content may arrive later than structure
- Over-building too early would create rework

---

## Decisions made

- App Router + TypeScript intended
- Mobile-first approach required
- Modular UI architecture required
- Vitest + React Testing Library locked for unit/integration tests
- Playwright locked for E2E tests
- Milestone 1 is foundation scaffold only
- Structured markdown logs are required for meaningful project work

---

## Next recommended action

Start the testing foundation milestone with Vitest, React Testing Library, and Playwright.

---

## Last updated

2026-05-01 17:27Z

## Logging system

The project uses a structured logging system under `logs/` for planning, implementation, testing, bug, deployment, review, and session records.

Curated notable changes should also be reflected in `CHANGELOG.md`.
