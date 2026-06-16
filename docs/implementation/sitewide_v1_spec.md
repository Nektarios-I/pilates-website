# Sitewide V1 Specification

## Purpose

This document defines the cross-page implementation rules for the first release of the pilates studio website.

This file must be used together with:

- `docs/design/first_release_design_direction.md`
- `docs/content/business_placeholders.md`

If another document conflicts with this file during V1, follow this file unless a newer V1 decision document explicitly overrides it.

## V1 implementation goal

Implement a stable, simple, professional first release of the website using a single consistent design language inspired by Pilates Republic.

The implementation must favor:

- speed
- clarity
- stability
- reuse
- easy future editing
- easy replacement of temporary content

## General rules

- Keep V1 simple.
- Prefer readable implementation over clever abstraction.
- Reuse existing repo patterns where possible.
- Do not redesign the architecture during this phase.
- Do not introduce a second visual inspiration source in V1.
- Keep missing business data centralized and visibly temporary.
- Build for easy later refinement, not for maximum polish on day one.

## Design reference rule

Pilates Republic is the only inspiration source for V1 page design decisions.

For V1, this includes:

- layout rhythm
- section ordering style
- spacing feel
- CTA prominence
- page simplicity
- pricing clarity
- header clarity

Do not introduce styling patterns from other references into V1 unless a later design decision explicitly permits it.

## Primary CTA rule

The primary CTA across the site is always booking-oriented.

Approved V1 primary CTA labels:

- `Book`
- `Book Now`
- `Book a Class`

Prefer one label consistently across the main user journey.
Do not create multiple competing primary CTA patterns.

## Navigation rule

The site header must clearly expose the main user-facing pages.

The expected V1 primary navigation is:

- Home
- Classes
- Pricing
- Instructors
- Contact
- FAQ or Rules
- Book

Optional:

- Login or Account

The booking CTA should be visually distinct from standard nav links.

## Header behavior

The header should:

- feel simple and professional
- work well on desktop and mobile
- keep the main pages easy to discover
- keep booking easy to access
- not require login to browse the site

For V1, avoid overcomplicated header interactions.

## Footer rule

The footer must be more complete and professional than a minimal placeholder footer.

The footer should include:

- studio name
- short brand line or short descriptive sentence
- main navigation links
- contact details
- social link area
- booking CTA or booking link
- legal or policy links if available

If some information is unknown, show placeholders clearly rather than omitting structure entirely.

## Placeholder content rule

Unknown business content must not block implementation.

All missing business values should:

- come from `docs/content/business_placeholders.md`
- remain obvious in code and UI
- be easy to search and replace
- avoid fake detailed business claims

When implementation begins, placeholder values should be centralized in code wherever practical.

## Homepage rule

The homepage is the highest priority page and defines the visual language for the rest of the site.

All later pages should inherit homepage decisions for:

- typography hierarchy
- button styling
- card styling
- spacing rhythm
- section background treatment
- content density
- CTA treatment

Do not start broad inner-page redesign before the homepage feels coherent and complete enough to act as the V1 standard.

## Classes page rule

The classes page should be simple, readable, and booking-oriented.

It should present:

- the class types
- short descriptions
- useful practical details where available
- clear next actions

Avoid overexplaining or making the page visually heavy.

## Pricing page rule

The pricing page should be easy to scan and easy to understand.

It should:

- present offers clearly
- avoid confusing comparison structures
- keep the booking next step visible
- support placeholder values cleanly until real pricing is approved

## Instructors page rule

The instructors page should support trust and credibility.

It should include:

- instructor cards or profiles
- photo area
- name
- role
- short bio

Placeholder bios and names are acceptable in V1 if clearly marked.

## Contact / location page rule

The contact page should clearly show:

- address
- map or map placeholder
- phone
- email
- hours if available
- booking link
- contact form only if one already fits the architecture cleanly

If the map or hours are unknown, use structured placeholders rather than skipping the section.

## FAQ / rules page rule

A simple FAQ or rules page is part of V1.

This page should:

- answer common practical questions
- reduce booking friction
- help first-time visitors feel informed
- use short, clear formatting

## Visual style rule

The visual style for V1 should be:

- simple
- calm
- clean
- professional
- modern
- easy to scan

Avoid:

- excessive decoration
- heavy animation
- overly experimental layouts
- visual clutter
- overly dense content blocks
- flashy effects that are not essential

## Motion rule

Use motion lightly.

Allowed in V1:

- subtle hover transitions
- small button interactions
- small card interactions
- minimal section reveal only if easy and stable

Avoid:

- animation-led design
- large motion systems
- distracting scroll theatrics
- motion that delays usability

## Mobile rule

Mobile is a first-class target in V1.

Every page should:

- keep main actions visible
- remain easy to scan
- avoid cramped layouts
- preserve clear CTA hierarchy
- keep important contact and booking actions accessible

## Accessibility rule

V1 must remain accessible enough to review and extend safely.

Minimum expectations:

- semantic heading structure
- visible focus states
- accessible buttons and links
- usable contrast
- alt text for images
- keyboard-usable main navigation
- meaningful labels for forms

## Component reuse rule

Prefer reuse over duplication.

When implementing V1:

- reuse section patterns where appropriate
- centralize content when practical
- create reusable button and card patterns
- avoid premature abstraction into too many tiny components
- only extract abstractions that clearly reduce repetition

## Naming and code style rule

Follow the repo's established naming and implementation conventions.

Use `snake_case` for variable names and similar code-level identifiers where that convention is applicable.

Do not introduce inconsistent naming styles inside newly added configuration and content structures.

## V1 done criteria

A page or feature is V1-ready when:

- it matches the approved V1 direction
- it uses the sitewide rules in this document
- it works with placeholder content
- it is stable enough for preview deployment
- it can be refined later without structural churn

## Next documents

After this file, the next documents to create are:

- `docs/implementation/homepage_v1_spec.md`
- `docs/implementation/page_rollout_plan.md`
- `.github/prompts/implement-homepage-v1.prompt.md`
