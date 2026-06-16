# Component Implementation Notes

Purpose: document component surfaces introduced or meaningfully changed during implementation milestones so later Codex and Copilot work can extend them safely.

## Homepage Shell Milestone

### `src/app/(marketing)/page.tsx`

- Purpose: homepage route composition for the current marketing shell.
- Main props or inputs: none; imports `homeContent` and composes section components.
- Server or client: server component.
- Dependencies: `PageHero`, `SectionWrapper`, `PreviewCardGrid`, `CtaBlock`, `homeContent`, and `createPageMetadata`.
- Known side effects: none.
- Extension points: reorder sections, replace content module values, or swap section components without adding heavy markup to the route file.
- Test coverage: `src/app/(marketing)/marketing-pages.test.tsx`, `src/app/(marketing)/homepage.test.tsx`, and `e2e/navigation.spec.ts`.

### `src/components/sections/page-hero.tsx`

- Purpose: reusable top-of-page hero section with eyebrow, h1, summary, primary CTA, optional secondary CTA, and a small status panel.
- Main props or inputs: `eyebrow`, `title`, `description`, `primaryCta`, `secondaryCta`.
- Server or client: server component.
- Dependencies: `Container`, `Section`, and `ButtonLink`.
- Known side effects: none.
- Extension points: replace the status panel with approved media, add composition slots, or adjust CTA presentation while preserving the h1 and action props.
- Test coverage: covered through homepage integration and E2E tests.

### `src/components/sections/section-wrapper.tsx`

- Purpose: reusable section shell for titled marketing content with consistent spacing, container use, and optional muted tone.
- Main props or inputs: `id`, `eyebrow`, `title`, `description`, `tone`, `children`.
- Server or client: server component.
- Dependencies: `Container` and `Section`.
- Known side effects: none.
- Extension points: add future tone variants, heading alignment options, or section-level slots without changing page route composition.
- Test coverage: covered through homepage heading and section rendering tests.

### `src/components/sections/preview-card.tsx`

- Purpose: reusable card and card-grid pattern for homepage benefits, class previews, instructor previews, and trust placeholders.
- Main props or inputs: `title`, `description`, `eyebrow`, `meta`, `cta`; `PreviewCardGrid` accepts `items`.
- Server or client: server component.
- Dependencies: `ButtonLink`.
- Known side effects: none.
- Extension points: add image/media support, badges, or richer card variants once approved content and design direction are available.
- Test coverage: covered through homepage heading, CTA, and E2E rendering tests.

### `src/components/sections/cta-block.tsx`

- Purpose: reusable final conversion block with heading, summary, primary CTA, and optional secondary CTA.
- Main props or inputs: `eyebrow`, `title`, `description`, `primaryCta`, `secondaryCta`.
- Server or client: server component.
- Dependencies: `Container`, `Section`, and `ButtonLink`.
- Known side effects: none.
- Extension points: add visual variants or alternate alignment while keeping CTA inputs stable.
- Test coverage: covered through homepage primary CTA and heading tests.

### `src/features/home/home-content.ts`

- Purpose: placeholder-safe homepage content and simple content types separated from route and presentation code.
- Main props or inputs: exported `homeContent` object plus `HomeCta`, `HomeCard`, and `HomeSection` types.
- Server or client: module used by server components; no React runtime behavior.
- Dependencies: none.
- Known side effects: none.
- Extension points: replace placeholder-safe copy with approved content, migrate to CMS mapping later, or add media fields when approved.
- Test coverage: exercised through homepage rendering tests.
