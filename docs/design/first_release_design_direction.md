# First Release Design Direction

## Status

Approved working direction for V1.

This file defines the design and delivery direction for the first stable public version of the pilates studio website.

This version is intentionally limited in scope and is designed to:

- ship fast
- look clean and professional
- provide the main required user-facing functionality
- avoid blocking on unclear or missing client specifications
- remain easy to refine and extend later without large rewrites

## Core V1 decision

For V1, use **Pilates Republic only** as the visual and layout inspiration source.

Do not mix inspiration sources in the first release.
Do not introduce design ideas from Scout Studios, Mindbody, or any other reference yet.
Do not spend time exploring multiple visual directions for V1.

The purpose of this decision is speed, consistency, and reduced design churn.

## V1 product goal

Deliver a first stable and functional website version that:

- clearly presents the studio
- shows the main pages users expect
- makes booking easy to find
- uses simple, professional design
- works correctly with placeholder business content where real content is missing
- can be deployed and reviewed by the client
- can later be improved incrementally

## Design principle for V1

The V1 website should feel:

- simple
- clear
- modern
- calm
- functional
- easy to navigate
- not overdesigned
- not experimental
- not animation-heavy

The site should prioritize usability and clarity over originality in this phase.

## Visual direction for V1

Use Pilates Republic as the reference for:

- page layout simplicity
- homepage section rhythm
- spacing and vertical flow
- obvious booking CTA placement
- clear navigation
- simple pricing presentation
- straightforward page structure
- easy-to-scan content sections

Use a design that is visually clean and credible, but not overly minimal to the point of feeling unfinished.

## UX rules for V1

The following UX rules are mandatory in V1:

- the primary CTA across the site is "Book"
- booking must be easy to find from the header and from major sections
- the header must clearly show the main pages
- the homepage must be usable without login
- login/account access can exist, but must not block browsing
- content should be easy to scan
- page structure should be predictable and simple
- mobile usability must be treated as essential, not optional

## Content strategy for V1

Missing business inputs must not block implementation.

Where real business information is not yet available:

- use obvious placeholder values
- use consistent placeholder naming
- keep placeholder content centralized where possible
- make placeholders easy to search for and replace later
- avoid hiding missing data behind vague generic text

Placeholder values should be visibly temporary and should signal clearly in code and content that they must later be replaced.

## Engineering strategy for V1

V1 should be implemented with:

- the existing repo architecture
- the existing Next.js and Tailwind setup
- reusable sections and simple page composition
- centralized placeholder content/config where practical
- minimal new abstractions unless they clearly support reuse
- stable, readable implementation over cleverness

Do not redesign architecture during this phase.
Do not move into a website builder workflow.
Do not start a parallel design system project outside the repo.

## Initial page scope for V1

The initial V1 page scope is:

1. Homepage
2. Classes
3. Pricing
4. Instructors
5. Contact / Location
6. Rules or FAQ

Additional pages can be added later, but the pages above define the first release baseline.

## Out of scope for V1

The following are out of scope unless they directly unblock launch:

- mixed-reference design exploration
- advanced motion system
- complex animations
- custom illustration work
- CMS integration
- dark mode
- deep personalization
- complex account flows
- major booking-platform integration redesign
- polishing every edge case before the first public review

## Success criteria for V1

V1 is successful when:

- the site looks coherent and professional
- the homepage is strong and usable
- the main pages exist and work
- the primary CTA is consistently visible
- the design direction is consistent across pages
- placeholders are obvious and easy to replace
- the site is stable enough to deploy and review
- future refinement can happen without structural rework

## Source-of-truth rule

For this V1 phase:

- this file defines the design direction
- `docs/content/business_placeholders.md` defines temporary business content
- `docs/implementation/sitewide_v1_spec.md` defines cross-page implementation rules
- later implementation specs must follow this file unless explicitly updated

## Change control

Do not change this document casually during V1 implementation.

If a major design-direction change is needed, update this file first and then update downstream implementation documents.
