# Site Map

## Purpose

This document defines the initial public route structure for the Corehouse Pilates Studio website.

The goal is to make route planning explicit before scaffold implementation begins.

## Canonical public routes

### `/`

Home page.
Purpose:

- introduce Corehouse Pilates Studio
- communicate the core value proposition
- direct users toward the main next actions

### `/about`

About / studio page.
Purpose:

- explain the studio identity
- communicate values and atmosphere
- build trust

### `/classes`

Classes overview page.
Purpose:

- present the available Pilates class types or service categories
- help visitors understand where to start

### `/pricing`

Pricing page.
Purpose:

- present pricing structure or introductory offers clearly
- reduce uncertainty before contact or booking

### `/instructors`

Instructors page.
Purpose:

- present the teaching team
- reinforce trust and professionalism

### `/contact`

Contact page.
Purpose:

- provide the simplest path to reach the studio
- support contact, visit, and future booking redirection

### `/faq`

FAQ page.
Purpose:

- answer common beginner and practical questions
- reduce hesitation

### `/blog`

Blog index page.
Purpose:

- support future SEO and educational content
- provide a location for articles and updates

### `/blog/[slug]`

Single blog post page.
Purpose:

- render one article entry from future content

## Route priorities

### Phase 1 / Milestone 1

These routes should exist as placeholder scaffold pages:

- `/`
- `/about`
- `/classes`
- `/pricing`
- `/instructors`
- `/contact`
- `/faq`
- `/blog`
- `/blog/[slug]`

### Out of scope for Milestone 1

Do not add these yet unless explicitly approved later:

- booking flow
- authentication
- admin pages
- dashboard
- CMS interface
- checkout/payment routes
- account area

## Navigation expectation

The public navigation should initially support:

- Home
- About
- Classes
- Pricing
- Instructors
- Contact
- FAQ
- Blog

Navigation presentation should remain swappable later.

## Notes

The route structure should stay compatible with:

- modular public marketing pages
- future content expansion
- future booking integration without major route rewrites

## Definition of success

This site map is successful if:

- Milestone 1 can scaffold routes without guesswork,
- public page responsibilities are clear,
- and future expansion remains easy.
