# Page Rollout Plan

## Purpose

This file defines the implementation order for the first release of the pilates studio website.

The goal is to reduce scope drift, stabilize the visual system early, and avoid redesigning every page separately.

This file must be used together with:

- `docs/design/first_release_design_direction.md`
- `docs/content/business_placeholders.md`
- `docs/implementation/sitewide_v1_spec.md`
- `docs/implementation/homepage_v1_spec.md`

## Rollout strategy

The correct V1 rollout strategy is:

1. Build homepage first.
2. Use homepage to establish the reusable visual system.
3. Build one page at a time after homepage approval.
4. Reuse patterns and content structures rather than rethinking each page from scratch.
5. Keep placeholder content centralized and easy to replace.

## Order of implementation

The approved V1 page order is:

1. Homepage
2. Classes
3. Pricing
4. Instructors
5. Contact / Location
6. FAQ / Rules

This order should be preserved unless a concrete repo dependency forces a small change.

## Phase 1: Homepage

### Goal

Create the visual and structural standard for the rest of the site.

### Why first

The homepage defines:

- spacing rhythm
- CTA treatment
- card treatment
- header behavior
- footer structure
- content density
- mobile behavior expectations

### Required inputs

Homepage can proceed with placeholders.

### Dependencies

- Batch 1 documents
- homepage V1 spec
- placeholder content strategy
- existing repo marketing architecture

### Done criteria

Homepage is done when:

- all homepage sections are implemented
- the design feels coherent
- the page is usable with placeholder data
- booking is prominently visible
- the page is stable enough for preview deployment

## Phase 2: Classes

### Goal

Create a simple and clear classes page that extends the homepage visual language.

### Why second

The classes page is one of the highest-value follow-up pages after the homepage because it supports the main user decision path.

### Required content

Can proceed with placeholder class names, descriptions, durations, levels, and capacities.

### Dependencies

- homepage approved
- reusable cards and page sections available or easily derived from homepage work

### Done criteria

Classes page is done when:

- class offerings are easy to scan
- CTA to booking is clear
- layout matches homepage system
- placeholders are clean and centralized

## Phase 3: Pricing

### Goal

Create a simple, readable pricing page that reduces uncertainty and supports booking.

### Why third

Pricing is a common next-stop page for visitors and should be available early in V1.

### Required content

Can proceed with pricing placeholders as defined in the business placeholder file.

### Dependencies

- homepage approved
- classes page patterns may be reused for section rhythm and cards

### Done criteria

Pricing page is done when:

- offers are easy to scan
- booking or next action is obvious
- the layout is simple and not confusing
- placeholder pricing values remain clearly temporary

## Phase 4: Instructors

### Goal

Create a trust-building instructors page with simple profile cards.

### Why fourth

Once homepage, classes, and pricing exist, the next trust-building page should be the instructors page.

### Required content

Can proceed with placeholder names, roles, bios, and image areas.

### Dependencies

- homepage approved
- card system already established
- typography and spacing system already stable enough

### Done criteria

Instructors page is done when:

- instructor cards read clearly
- trust is improved
- the layout fits the homepage system
- placeholders remain easy to replace later

## Phase 5: Contact / Location

### Goal

Create a practical contact and location page that makes the studio easy to find and reach.

### Why fifth

This page depends on stable footer and content patterns, but can still proceed with placeholders.

### Required content

Can proceed with contact and location placeholders, including a map placeholder if needed.

### Dependencies

- homepage approved
- contact blocks and footer patterns established

### Done criteria

Contact / Location page is done when:

- address, email, phone, hours, and map area are all represented
- the structure remains useful even with placeholder values
- the page feels practical and complete enough for V1

## Phase 6: FAQ / Rules

### Goal

Create a practical page that answers common questions and reduces friction.

### Why sixth

This page is important but lower priority than homepage, classes, pricing, instructors, and contact for the first visible rollout.

### Required content

Can proceed with placeholder FAQ entries and temporary rules text.

### Dependencies

- homepage approved
- typography and spacing rules already established

### Done criteria

FAQ / Rules page is done when:

- the content is easy to scan
- practical questions are represented
- the page integrates cleanly into the global navigation and footer

## Execution rules

For every phase:

- work on one page only
- read the approved docs first
- inspect the existing repo before editing
- reuse existing patterns where possible
- avoid broad refactors during page implementation
- stop and report assumptions if architecture conflicts appear

## Review gates

A page should be reviewed before the next page starts.

For each page review, check:

- visual coherence with homepage system
- placeholder clarity
- CTA clarity
- mobile behavior
- obvious structural issues
- unnecessary new complexity

## Scope control

Do not:

- redesign all pages in parallel
- introduce a second design direction during V1
- create a large component taxonomy too early
- drift into unrelated features while implementing one page

## Transition to later phases

After all six pages are in place and stable, later iterations may:

- improve polish
- add selected patterns from other reference sites
- replace placeholders with approved content
- refine booking flow
- improve assets and imagery
- enhance motion and brand specificity

Those are post-V1 refinements and are not part of this rollout plan.
