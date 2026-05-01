# UI Architecture

## Purpose

This document defines how the website UI should be structured so that design changes can be made quickly and safely during the early project stages.

## Core objective

The website must be easy to redesign, rearrange, and restyle without requiring large rewrites.

This means:

- layouts should be composable,
- sections should be modular,
- components should be reusable,
- styles should be token-driven,
- content should not be tightly coupled to layout logic.

## Core principles

### 1. Separate layout from content

Page structure should not hardcode business copy, image choices, or visual styling decisions in a way that is difficult to replace.

Prefer:

- reusable section wrappers,
- configurable section props,
- isolated content objects or placeholder data,
- layout containers that can be rearranged.

### 2. Keep page files thin

Route files should mostly compose page sections.
They should not contain large amounts of presentational markup or mixed styling logic.

### 3. Use shared layout primitives

Create a small set of reusable layout primitives early, such as:

- `Container`
- `Section`
- `PageIntro`
- `Stack`
- `Grid`
- `Surface`
- `Button`

These should support reuse across pages without forcing one rigid design.

### 4. Header and navigation must be swappable

The navigation system should be structured so the header can later become:

- a top navbar,
- a side navigation,
- a simplified mobile sheet,
- or another layout pattern

without rewriting page content sections.

Navigation structure and navigation presentation should be separated as much as possible.

### 5. Design tokens over hardcoded styling

Colors, spacing, typography, border radius, shadows, and surface treatments should come from centralized tokens rather than being repeatedly hardcoded in page components.

Keep design values easy to update globally.

### 6. Media must be replaceable

Images, icons, and decorative assets should be easy to change later.
Avoid burying media decisions inside complex component logic.

### 7. Prefer presentational + composition boundaries

Use a healthy separation between:

- low-level UI primitives,
- page sections,
- domain/feature modules,
- route composition

This makes it easier to replace section designs without rewriting unrelated logic.

## Folder expectations

### `src/components/ui`

Low-level reusable primitives.
Examples:

- Button
- Container
- Section
- Heading
- Text
- Card
- Badge

### `src/components/layout`

Global layout structures.
Examples:

- Header
- Footer
- Navigation
- MobileMenu
- PageShell

### `src/components/sections`

Reusable marketing sections that can appear on more than one page.
Examples:

- HeroSection
- CTASection
- TestimonialSection

### `src/features`

Domain-oriented page support modules.
Examples:

- classes
- instructors
- pricing
- contact

## Rules for flexibility

- Do not hardwire major layout assumptions into deeply nested components.
- Do not mix content, layout orchestration, and design token decisions carelessly.
- Prefer props and composition over duplicated one-off section markup.
- Keep global style decisions centralized.
- Keep content placeholders explicit and easy to replace.

## Design system expectation

The implementation should move toward a small internal design system.
That system does not need to be visually final now, but it must make future redesign easier.

## Definition of success

The UI architecture is successful if:

- a section can be redesigned without rewriting unrelated pages,
- the nav layout can change without large structural rewrites,
- colors and typography can be updated centrally,
- and the code remains readable and modular.
