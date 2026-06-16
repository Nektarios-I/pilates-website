# Current State

## Purpose

This file tells the coding agent the exact current stage of the repository so it does not assume implementation work has already started.

## Current situation

Milestone 1 foundation scaffold is complete and has been reviewed for small cleanup issues.

The repository currently includes:

- repo guidance files for Copilot and Codex
- planning and architecture documentation
- testing strategy documentation
- prompt and playbook files for agent workflows
- App Router marketing route placeholders
- shared layout components, UI primitives, site/navigation config, metadata helpers, robots, and sitemap

The agent must still inspect the real repository contents before each task instead of assuming undocumented files, scripts, packages, or content exist.

## Intended stack

The intended stack for the project is:

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Testing Library
- Playwright
- Vercel as the initial deployment target

## Current priority

The immediate priority is the testing foundation milestone.

The next task should:

1. install and configure Vitest with React Testing Library,
2. install and configure Playwright,
3. add the first scaffold-level smoke tests,
4. keep homepage implementation deferred until after the testing baseline exists.

## Important rule

Do not assume package versions, libraries, scripts, or config files unless they actually exist in the repository.
If a file is missing, say it is missing.
If a version cannot be detected, say it cannot be detected.

## Expected next outcome

The next useful result from the agent is a small, verified testing foundation that exercises the existing scaffold without implementing Milestone 2 homepage content.

## Additional locked decisions

- Studio name is **Corehouse Pilates Studio**.
- Unit/integration testing will use **Vitest + React Testing Library**.
- End-to-end testing will use **Playwright**.
- Milestone 1 is **foundation scaffold only**.
- Homepage shell implementation comes after the scaffold milestone.
- GitHub repository target is `https://github.com/Nektarios-I/pilates-website.git`.
