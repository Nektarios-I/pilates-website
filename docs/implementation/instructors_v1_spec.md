# Instructors Page V1 Specification

## Purpose

This document defines the exact implementation scope and acceptance criteria for the V1 Instructors page.

This page must support trust, human presence, and basic credibility while staying aligned with homepage V1 and the approved first-release design direction.

This file must be used together with:

- `docs/design/first_release_design_direction.md`
- `docs/content/business_placeholders.md`
- `docs/implementation/sitewide_v1_spec.md`
- `docs/implementation/page_rollout_plan.md`
- `src/config/site_content.ts`
- `src/config/site_design_v1.ts`

## Instructors page objective

Implement a stable, clean, trust-building Instructors page that:

- presents the team clearly
- supports placeholder names and bios safely
- visually matches the homepage system
- remains simple and easy to extend later

## Core page principles

The Instructors page must:

- feel human and credible
- be easy to scan
- avoid visual clutter
- keep content concise
- support future replacement of placeholder text and images
- remain consistent with homepage V1

## Page structure

The V1 Instructors page should contain these sections in this order unless a very small architectural adjustment is necessary:

1. Header
2. Page hero / page intro
3. Main instructors grid or list
4. Studio/team support note
5. Booking CTA section
6. Footer

## Section 1: Header

Reuse the sitewide header established by homepage V1.

## Section 2: Page hero / page intro

### Purpose

Frame the instructors page and explain why the team matters.

### Required content

Include:

- page title
- short supporting text
- optional short trust-oriented line
- visible path to booking

### Design intent

Keep the page intro simple and aligned with homepage hierarchy.

## Section 3: Main instructors grid or list

### Purpose

Present the instructors clearly and build trust.

### Required content

The page must show 2 to 3 instructor items for V1 unless better approved content exists.

Each instructor item should support:

- image area
- name
- role
- short bio

### Placeholder policy

If names, photos, and bios are missing:

- keep placeholders obvious
- keep the layout complete
- do not invent detailed credentials or personal histories
- use centralized content/config where practical

### Design intent

The instructor presentation should feel:

- calm
- professional
- readable
- human
- consistent with homepage cards and spacing

## Section 4: Studio/team support note

### Purpose

Add a small supporting section that reinforces approach, care, or teaching philosophy.

### Suggested content

This section may include:

- short note about the studio approach
- short note about guidance or support
- short note about suitability for different levels

### Placeholder policy

If the studio’s actual team philosophy is not approved, use a short neutral placeholder-safe note.

## Section 5: Booking CTA section

### Purpose

Keep the booking journey connected to the trust built on this page.

### Required content

Include:

- short CTA heading or line
- booking action
- optional short supporting note

### Design intent

This should feel integrated, not overly sales-heavy.

## Section 6: Footer

Reuse the homepage footer structure and keep it consistent.

## Content rules

### Source of truth

Instructor content should come from centralized config/content where practical, especially `src/config/site_content.ts`.

### Placeholder rules

Missing instructor data must:

- remain clearly temporary
- remain easy to replace
- avoid invented detailed biographies
- preserve the `TODO_` convention where practical

## Reuse rules

The Instructors page should reuse homepage decisions for:

- spacing rhythm
- card treatment
- typography hierarchy
- CTA treatment
- footer structure
- image handling patterns if already established

## Accessibility baseline

At minimum:

- headings are clear
- profile cards are readable
- image alt text exists
- CTA links/buttons are accessible
- focus states are visible

## Mobile baseline

The Instructors page must remain usable and readable on mobile.

At minimum:

- profile cards stack cleanly
- image areas remain balanced
- bios remain readable
- CTA remains clear

## Non-goals for Instructors V1

Avoid:

- long profile storytelling
- deep credential systems
- complex filtering
- polished editorial portrait treatment that depends on final assets
- inventing detailed staff information to fill visual space

## Acceptance criteria

The Instructors page V1 is complete when:

- the team is represented clearly
- the page supports trust and readability
- the page matches homepage visual language
- placeholders remain obvious and controlled
- the page is stable enough for review and preview deployment

## Agent implementation note

Any LLM or coding agent implementing this page must:

- inspect homepage implementation first
- reuse shared structures where practical
- stay scoped to the Instructors page
- avoid broad design drift while implementing this page
