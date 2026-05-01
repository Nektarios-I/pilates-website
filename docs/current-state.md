# Current State

## Purpose

This file tells the coding agent the exact current stage of the repository so it does not assume implementation work has already started.

## Current situation

The repository has been prepared primarily at the documentation and agent-guidance level.

The following kinds of files should already exist or be in progress:

- repo guidance files for Copilot and Codex
- planning and architecture documentation
- testing strategy documentation
- prompt and playbook files for agent workflows

However, the actual application scaffold may still be incomplete or missing.
The agent must inspect the real repository contents and report the actual state instead of assuming that the Next.js project has already been initialized.

## Intended stack

The intended stack for the project is:

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Testing Library
- Playwright
- Vercel as the initial deployment target

## Current priority

The immediate priority is not final implementation.

The immediate priority is:

1. inspect the repository,
2. understand exactly what exists,
3. identify missing foundation pieces,
4. confirm the intended environment and toolchain,
5. ask clarifying questions,
6. propose the cleanest next task.

## Important rule

Do not assume package versions, libraries, scripts, or config files unless they actually exist in the repository.
If a file is missing, say it is missing.
If a version cannot be detected, say it cannot be detected.

## Expected first outcome

The first useful result from the agent is a repository audit and structured plan, not immediate code generation.

## Additional locked decisions

- Studio name is **corehouse Pilates Studio**.
- Unit/integration testing will use **Vitest + React Testing Library**.
- End-to-end testing will use **Playwright**.
- Milestone 1 is **foundation scaffold only**.
- Homepage shell implementation comes after the scaffold milestone.
- GitHub repository target is `https://github.com/Nektarios-I/pilates-website.git`.
