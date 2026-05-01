# Pilates Studio Website

Production-grade marketing website for a professional Pilates studio, built with Next.js App Router, TypeScript, and Tailwind CSS.

## Goals

- Strong first impression and conversion-focused UX
- Maintainable and modular architecture
- Accessibility and SEO from the start
- Full testing setup with unit/integration and E2E coverage
- Initial deployment on Vercel, without architectural lock-in

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- Prettier
- React Testing Library
- Playwright

## Project documentation

Read these first:

- `docs/product-requirements.md`
- `docs/site-map.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`
- `.github/copilot-instructions.md`

## Getting started

1. Install dependencies
2. Copy `.env.example` to `.env.local`
3. Start the dev server

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Suggested development workflow

1. Read the relevant docs
2. Ask Copilot to plan before generating code
3. Scaffold the smallest clean version
4. Add or update tests
5. Run lint, typecheck, tests, and build
6. Commit small, reviewable changes

## Expected scripts

These should exist once the scaffold is complete:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:e2e
```

## Deployment target

The initial deployment target is Vercel.
The codebase should remain portable to other professional hosting environments.

## Status

Repository foundation and planning stage.
