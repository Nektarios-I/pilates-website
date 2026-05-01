# Log Entry

- Date: 2026-05-01 16:55Z
- Actor: codex
- Category: implementation
- Topic: milestone-1-foundation-scaffold
- Branch: master
- Commit: 7335d0a
- Related Plan: `PLANS.md`
- Related Prompt: User request to implement Milestone 1 foundation scaffold
- Status: done

## Purpose

Implement the Milestone 1 foundation scaffold for the Corehouse Pilates Studio website without building homepage sections or installing test tooling.

## Inputs / Context Used

Read the required repository instructions, architecture docs, product requirements, site map, testing strategy, UI and responsive guidance, project ledger, decision log, content model, UX notes, logging strategy, and logs README.

## Actions Performed

- Confirmed the site map already contains the required Milestone 1 public routes.
- Added the App Router marketing route group and placeholder pages.
- Added shared layout components, minimal UI primitives, and a reusable placeholder section.
- Added site/navigation config, metadata helper, robots, and sitemap foundations.
- Removed the default scaffold homepage route conflict.
- Updated project tracking files and environment placeholder naming.

## Files Changed or Inspected

Changed files are the Milestone 1 scaffold files, app shell files, `.env.example`, `PLANS.md`, `docs/project-ledger.md`, `CHANGELOG.md`, and this log entry.

## Commands Run

- `npm run lint`
- `npm run build`

## Result

Milestone 1 scaffold implementation is complete.

## Verification

- `npm run lint` passed.
- `npm run build` passed when run from `C:\Users\User\Desktop\pilateswebsite`.
- Running `npm run build` from `C:\Users\User\Desktop\PilatesWebsite` exposed a Windows path-casing issue in Next.js prerendering, so the verified path uses the lowercase workspace path observed by the toolchain.

## Blockers / Risks

- Test scripts are intentionally not available until the testing foundation milestone.
- Placeholder pages must remain scaffold-only until homepage and page content milestones.
- Keep workspace path casing consistent when running builds on Windows.

## Next Recommended Action

Set up the testing foundation with Vitest, React Testing Library, and Playwright.
