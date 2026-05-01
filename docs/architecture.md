# Architecture

## Overview

This project is a production-grade marketing website for a Pilates studio built with Next.js App Router, TypeScript, and Tailwind CSS.

The architecture prioritizes:

- maintainability,
- separation of concerns,
- modularity,
- accessibility,
- SEO,
- testability,
- and deployment portability.

## Core principles

1. Separation of concerns
2. Modular feature-based organization
3. Server-first rendering
4. Reusable UI primitives
5. Testable behavior
6. Minimal coupling
7. Future-ready extensibility

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- React Testing Library
- Playwright
- ESLint
- Prettier
- Vercel for initial deployment

## Directory strategy

Use `src/` to separate application code from repository root configuration.

Recommended structure:

```text
src/
├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   └── sections/
├── features/
│   ├── classes/
│   ├── pricing/
│   ├── instructors/
│   ├── contact/
│   └── testimonials/
├── lib/
├── config/
├── hooks/
├── styles/
└── test/
```

## Responsibilities by directory

### `src/app`

Contains route definitions, layouts, route metadata, route-level loading/error boundaries, and page composition.
Route files should remain thin and should not contain heavy business logic.

### `src/components`

Contains reusable presentational components.

Suggested subfolders:

- `ui/` for primitives such as Button, Container, Section, Heading
- `layout/` for Header, Footer, Navigation, PageShell
- `sections/` for reusable marketing sections

### `src/features`

Contains domain-specific modules and page-level business sections.

Examples:

- `features/classes`
- `features/pricing`
- `features/instructors`
- `features/contact`

A feature can include:

- components
- data mappers
- types
- validation logic
- test files

### `src/lib`

Contains shared utilities and helpers that are not domain-specific.

Examples:

- formatting helpers
- metadata helpers
- schema helpers
- small pure utility functions

### `src/config`

Contains typed access to environment variables and runtime configuration.
All `process.env` access should be centralized here.

### `src/hooks`

Contains reusable React hooks.
Avoid adding hooks for logic that can remain a pure utility.

### `src/styles`

Contains global styling entry points and design-system-related styles where needed.

### `src/test`

Contains shared test utilities, custom render helpers, mocks, and setup files.

## Routing strategy

Use App Router route groups to organize public marketing pages without changing URL structure.

Recommended approach:

```text
src/app/
├── (marketing)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── about/page.tsx
│   ├── classes/page.tsx
│   ├── pricing/page.tsx
│   ├── instructors/page.tsx
│   ├── contact/page.tsx
│   ├── faq/page.tsx
│   └── blog/
│       ├── page.tsx
│       └── [slug]/page.tsx
├── favicon.ico
├── robots.ts
└── sitemap.ts
```

## Rendering strategy

- Prefer Server Components by default.
- Use Client Components only for actual interactivity.
- Keep data and content flow explicit.
- Avoid unnecessary client-side state.
- Avoid putting fetch logic directly in many presentational components.

## Metadata strategy

- Define site-wide metadata defaults at the root layout level.
- Override metadata at page level where needed.
- Support future blog article metadata generation.
- Include robots and sitemap generation in the application structure.

## Content strategy

Initial content may be static and file-based.
The architecture must allow later migration to a CMS without major route restructuring.

## Configuration strategy

- Keep env parsing centralized.
- Add `.env.example` for all required variables.
- Avoid hardcoded environment-specific URLs across the codebase.

## Accessibility strategy

- Use semantic HTML first.
- Keep heading hierarchy valid.
- Ensure keyboard accessibility.
- Prefer accessible names and roles that also help automated testing.

## Performance strategy

- Keep components server-first.
- Optimize images and metadata.
- Avoid heavy client-side libraries unless justified.
- Keep the initial implementation simple and fast.

## Maintainability rules

- Keep page files small.
- Extract repeated sections into reusable modules.
- Prefer explicit interfaces and props.
- Refactor large files early.
- Add tests for critical behaviors.
- Do not mix styling, routing, content modeling, and business logic carelessly.

## Future extensions

This architecture should support:

- booking integration,
- headless CMS,
- analytics,
- structured blog content,
- multilingual expansion,
- and additional studio locations.
