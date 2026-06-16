# Classes Page V1 Specification

## Purpose

This document defines the exact implementation scope and acceptance criteria for the V1 Classes page.

This page must extend the homepage visual language and stay within the approved first-release direction.

This file must be used together with:

- `docs/design/first_release_design_direction.md`
- `docs/content/business_placeholders.md`
- `docs/implementation/sitewide_v1_spec.md`
- `docs/implementation/page_rollout_plan.md`
- `src/config/site_content.ts`
- `src/config/site_design_v1.ts`

## Classes page objective

Implement a stable, simple, readable Classes page that:

- clearly presents the main class offerings
- helps visitors understand what each class is for
- keeps booking easy to access
- works cleanly with placeholder values
- visually matches homepage V1

## Core page principles

The Classes page must:

- be easy to scan
- avoid clutter
- present practical information simply
- support decision-making
- keep the booking path visible
- avoid overexplaining unknown details

## Page structure

The V1 Classes page should contain these sections in this order unless a very small architectural adjustment is necessary:

1. Header
2. Page hero / page intro
3. Main classes grid or list
4. Practical details / class notes
5. Booking CTA section
6. Footer

This order is intentional for V1.

## Section 1: Header

Use the sitewide header behavior already established by the homepage.

Requirements:

- main navigation remains clear
- booking CTA remains visible
- current page state may be indicated if the existing navigation pattern supports it cleanly

## Section 2: Page hero / page intro

### Purpose

Introduce the page and frame the class offering simply.

### Required content

Include:

- page title
- short supporting text
- optional short note about levels, format, or booking approach
- clear CTA path to booking

### Design intent

Keep the top of the page simple and consistent with homepage hierarchy.
Do not create a dramatically different page-hero style.

### Placeholder policy

Use centralized placeholder-compatible content when real studio messaging is not yet approved.

## Section 3: Main classes grid or list

### Purpose

Present the main class offerings clearly.

### Required content

The page must show the main available class types in a structured format.

Each class item should support:

- class name
- short description
- duration
- level
- optional capacity
- optional short suitability note
- booking-related CTA or page-level CTA nearby

### Minimum content expectation

Use the existing four V1 placeholder class types unless better approved data exists:

- Reformer
- Mat Pilates
- Private Session
- Intro Class

### Design intent

The class presentation should feel:

- simple
- clean
- readable
- practical
- consistent with homepage cards and spacing

Do not create a dense comparison table unless the current repo already has a very clean pattern for it.

## Section 4: Practical details / class notes

### Purpose

Reduce confusion for first-time visitors and answer basic practical questions.

### Suggested content

This section may include:

- who the classes are suitable for
- what to expect
- what to bring
- arrival timing
- booking note
- cancellation note

### Placeholder policy

If practical details are not approved, use short placeholder-safe notes and avoid inventing studio-specific policies.

## Section 5: Booking CTA section

### Purpose

Convert browsing into action.

### Required content

Include:

- short CTA heading or line
- booking action
- optional short reassurance note

### Design intent

This section should be visible and clear, but not louder than the homepage hero CTA.

## Section 6: Footer

Reuse the homepage footer structure and keep it consistent with sitewide rules.

## Content rules

### Source of truth

Classes page content should come from centralized config/content where practical.
Do not hardcode scattered class data across many files if it can live in `src/config/site_content.ts`.

### Placeholder rules

All missing data must:

- remain obviously temporary
- preserve the `TODO_` convention where practical
- be easy to replace later

## Reuse rules

The Classes page should reuse homepage decisions for:

- section spacing
- headings
- button treatments
- cards or content blocks
- footer structure
- CTA treatment

Do not create a separate page-specific design language.

## Accessibility baseline

At minimum:

- clear heading structure
- readable card/list structure
- accessible CTA links/buttons
- visible focus states
- mobile-readable layouts

## Mobile baseline

The Classes page must remain easy to scan on mobile.

At minimum:

- class cards or rows stack cleanly
- important details remain readable
- booking actions remain clear
- no cramped multi-column layout on small screens

## Non-goals for Classes V1

Avoid:

- deep class-filter systems
- schedule complexity if not already available
- advanced interactivity
- over-detailed policy writing
- redesigning booking flow logic in this phase

## Acceptance criteria

The Classes page V1 is complete when:

- the page structure is clear
- the main class offerings are presented cleanly
- the page visually matches the homepage system
- placeholders are supported well
- the booking path is clear
- the page is stable enough for review and preview deployment

## Agent implementation note

Any LLM or coding agent implementing this page must:

- inspect the homepage implementation first
- reuse existing shared structures where possible
- stay scoped to the Classes page
- avoid broad refactors unless strictly necessary
