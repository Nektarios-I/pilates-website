# Pricing Page V1 Specification

## Purpose

This document defines the exact implementation scope and acceptance criteria for the V1 Pricing page.

This page must be simple, readable, and booking-oriented, while staying aligned with the homepage system and the first-release design direction.

This file must be used together with:

- `docs/design/first_release_design_direction.md`
- `docs/content/business_placeholders.md`
- `docs/implementation/sitewide_v1_spec.md`
- `docs/implementation/page_rollout_plan.md`
- `src/config/site_content.ts`
- `src/config/site_design_v1.ts`

## Pricing page objective

Implement a stable, easy-to-scan Pricing page that:

- presents offers clearly
- reduces uncertainty for new visitors
- supports placeholder values safely
- keeps booking visible
- visually matches homepage V1

## Core page principles

The Pricing page must:

- be simple
- be readable
- avoid confusing comparison logic
- avoid looking unfinished even when values are placeholders
- keep the next step obvious

## Page structure

The V1 Pricing page should contain these sections in this order unless a very small architectural adjustment is necessary:

1. Header
2. Page hero / page intro
3. Intro offer / highlighted offer
4. Main pricing options
5. Pricing notes / policy summary
6. Booking CTA section
7. Footer

## Section 1: Header

Reuse the sitewide header and keep booking visible.

## Section 2: Page hero / page intro

### Purpose

Introduce the page and set clear expectations.

### Required content

Include:

- page title
- short supporting text
- optional short clarification that final pricing details may be updated later if placeholders are still present
- visible path to booking

### Design intent

Keep the top of the page clean and consistent with homepage hierarchy.

## Section 3: Intro offer / highlighted offer

### Purpose

Give visitors one obvious starting point.

### Required content

Include:

- offer title
- price
- short description
- clear CTA

### Placeholder policy

If the actual intro offer is unknown, use the existing intro placeholder values from the centralized content config.

### Design intent

This section should draw attention, but remain simple and professional.

## Section 4: Main pricing options

### Purpose

Show the main ways a visitor can buy or join.

### Required content

Show 2 to 4 pricing items or cards.

Each pricing item should support:

- plan name
- price
- short description
- optional small note
- CTA or page-level CTA nearby

### Minimum expected plans for V1

Use the centralized V1 placeholder-compatible structure:

- Single Class
- Class Pack
- Membership

### Design intent

The page should be easy to scan in under a minute.
Avoid overly complex pricing tables for V1.

## Section 5: Pricing notes / policy summary

### Purpose

Reduce uncertainty and handle practical concerns without overloading the page.

### Suggested content

This section may include:

- short policy summary
- short note about bookings
- short note about cancellations
- short note about terms changing when final business approvals arrive

### Placeholder policy

If real policies are not approved, keep this concise and clearly temporary.

## Section 6: Booking CTA section

### Purpose

Move the visitor from pricing review to booking.

### Required content

Include:

- short CTA heading or line
- booking link or button
- optional reassurance note

### Design intent

Keep the CTA visible and straightforward.

## Section 7: Footer

Reuse the homepage footer structure.

## Content rules

### Source of truth

Pricing content should come from centralized config/content where practical, especially in `src/config/site_content.ts`.

### Placeholder rules

All missing values must:

- remain easy to identify
- remain easy to replace
- avoid fake certainty
- preserve the `TODO_` placeholder convention where practical

## Reuse rules

The Pricing page should reuse homepage decisions for:

- spacing rhythm
- card styling
- CTA styling
- footer structure
- heading treatment
- overall content density

## Accessibility baseline

At minimum:

- headings are clear
- pricing cards are readable
- CTA links/buttons are accessible
- focus states are visible
- layout remains understandable without hover

## Mobile baseline

The Pricing page must remain easy to scan on mobile.

At minimum:

- pricing cards stack cleanly
- highlighted offer remains readable
- CTA remains visible
- notes do not become dense or cramped

## Non-goals for Pricing V1

Avoid:

- complex plan-comparison matrices
- billing toggles unless already cleanly supported
- promotional overdesign
- advanced pricing logic
- trying to finalize business policy details that are still unknown

## Acceptance criteria

The Pricing page V1 is complete when:

- the offer structure is easy to understand
- the page matches homepage visual language
- placeholder prices and notes are handled clearly
- booking remains easy to find
- the page is stable enough for review and preview deployment

## Agent implementation note

Any LLM or coding agent implementing this page must:

- inspect homepage implementation first
- reuse shared primitives and patterns where practical
- stay scoped to the Pricing page
- avoid broad sitewide redesign while implementing this page
