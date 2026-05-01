# Copilot Repository Instructions

## Project summary

This repository contains a production-grade website for a professional Pilates studio.
The website is a marketing-first, SEO-friendly, accessible, maintainable web application built with Next.js App Router, TypeScript, and Tailwind CSS.
The initial hosting target is Vercel, but the architecture must remain portable to other professional hosting platforms.

## Primary goals

- Build a clean, elegant, trustworthy Pilates studio website.
- Optimize for maintainability, readability, testability, SEO, accessibility, and performance.
- Follow separation of concerns strictly.
- Use modular design and small focused components.
- Prefer boring, stable solutions over clever or fragile ones.
- Support future additions such as a booking integration, CMS, blog growth, analytics, and
  multilingual support.
  Additional repository priorities:
- The UI architecture must remain easy to redesign and rearrange.
- The implementation must be mobile-first and strongly responsive.
- Engineering quality and clean structure are first-class requirements.
- Project meta-documentation must be maintained as the project evolves.

## Stack and framework rules

- Use Next.js App Router, not Pages Router.
- Use TypeScript with strict typing.
- Use Tailwind CSS for styling.
- Prefer Server Components by default.
- Use Client Components only when interactivity or browser-only APIs are required.
- Use Next.js metadata exports for SEO.
- Use Next.js route groups when they improve organization without changing URLs.
- Keep the application deployable beyond Vercel by avoiding vendor lock-in in core logic.

## Architecture rules

- Keep routing concerns in `src/app`.
- Keep reusable presentational UI in `src/components`.
- Keep business/domain modules in `src/features`.
- Keep shared utilities in `src/lib`.
- Keep runtime configuration and env parsing in `src/config`.
- Keep hooks in `src/hooks`.
- Keep tests in `src/test` or adjacent to relevant modules where appropriate.
- Keep end-to-end tests in `e2e`.
- Do not place complex business logic directly inside `page.tsx` files.
- Pages should compose sections and delegate logic to feature modules or reusable components.
- Extract repeated UI into reusable components quickly.
- Prefer pure functions and explicit props over hidden coupling.

## Coding style

- Write small, focused, composable functions.
- Prefer descriptive names over short names.
- Avoid deeply nested conditionals when a guard clause is clearer.
- Do not introduce unnecessary dependencies.
- Do not leave dead code, commented-out code, or unused imports.
- Keep files cohesive; split large files before they become difficult to review.
- Use semantic HTML and accessible markup.
- All interactive elements must be keyboard accessible.
- Avoid premature abstraction, but refactor repeated logic into shared modules when it becomes clear.

## Design and UI rules

- The visual style should feel premium, calm, modern, and trustworthy.
- Avoid generic AI-looking SaaS aesthetics.
- Avoid purple gradient-heavy designs, template-like three-column feature grids, and overused startup copy.
- Prefer restrained color usage, strong typography, good spacing, and clear calls to action.
- Design mobile-first.
- Use real content structure even if final marketing copy is pending.
- Use explicit placeholder copy where real client copy is not yet available; do not use lorem ipsum.

## SEO and content rules

- Every public page must have meaningful metadata.
- Use root metadata defaults and override page metadata where needed.
- Include support for sitemap and robots generation.
- Structure content around Pilates studio intent: classes, instructors, pricing, contact, FAQs, and conversion CTAs.
- Prefer local-intent SEO structure suitable for a physical studio business.

## Testing rules

- Use test-driven development for non-trivial components and flows whenever practical.
- Write or update tests for significant behavior changes.
- Use React Testing Library for unit/integration behavior tests.
- Use Playwright for critical user journeys.
- Test user-visible behavior, not implementation details.
- Keep tests readable and deterministic.
- Avoid brittle selectors in end-to-end tests; prefer roles and accessible names.

## Safety and validation rules

- Do not invent APIs, routes, env variables, or content models without checking repository docs first.
- If a required file or module does not exist yet, propose it clearly.
- Preserve existing architecture and naming conventions.
- Before suggesting large changes, explain the file plan briefly.
- When generating code, keep imports correct and consistent with the project structure.
- When changing multiple files, explain why each file is needed.

## Expected workflow

When asked to implement something:

1. Read the relevant docs in `docs/`.
2. Follow the folder conventions in this repository.
3. Propose the file plan if the change is non-trivial.
4. Implement the smallest clean version first.
5. Add or update tests.
6. Keep the result production-oriented and easy to maintain.
