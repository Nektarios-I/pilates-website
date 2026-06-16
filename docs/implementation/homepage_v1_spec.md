# Homepage V1 Specification

## Purpose

This document defines the exact implementation scope and acceptance criteria for the V1 homepage.

This homepage is the first and highest-priority page of the first public release.
It must establish the visual and structural standard for the rest of the site.

This file must be used together with:

- `docs/design/first_release_design_direction.md`
- `docs/content/business_placeholders.md`
- `docs/implementation/sitewide_v1_spec.md`

## Homepage V1 objective

Implement a stable, professional, simple homepage that:

- clearly presents the studio
- makes booking easy to find
- uses a clean layout inspired by Pilates Republic
- works even with placeholder business content
- is reusable as the visual basis for later pages
- is strong enough to deploy for first client review

## Core homepage principles

The homepage must:

- feel calm and clear
- be easy to scan
- establish trust quickly
- prioritize booking visibility
- avoid overdesign
- use strong section rhythm and spacing
- remain easy to extend later

## Homepage section order

The V1 homepage should contain these sections in this order unless the actual repo structure requires a very small adaptation:

1. Header
2. Hero
3. Intro / studio overview
4. Classes preview
5. Pricing preview
6. Instructors preview
7. Contact / location preview
8. FAQ / rules preview
9. Footer

This order is intentional and should not be casually changed during V1.

## Section 1: Header

### Purpose

Expose the main pages clearly and keep booking immediately visible.

### Required content

The header should include:

- studio logo or text logo
- main navigation links
- booking CTA
- optional account/login link if the architecture already supports it cleanly

### Required nav items

Expected V1 nav items:

- Home
- Classes
- Pricing
- Instructors
- Contact
- FAQ or Rules
- Book

Optional:

- Login
- Account

### Behavior

- Booking CTA must stand out from standard nav links.
- Desktop navigation should be obvious and easy to scan.
- Mobile navigation must remain usable and straightforward.
- Browsing the homepage must not require login.

### Placeholder policy

If logo assets are not available, use a simple temporary text logo using `TODO_BUSINESS_STUDIO_NAME`.

## Section 2: Hero

### Purpose

Create a clear first impression and immediately direct the user toward booking or viewing classes.

### Required content

The hero must include:

- main headline
- supporting copy
- primary booking CTA
- optional secondary CTA
- visual area for image or media
- short trust-oriented framing that does not require full business detail

### Content source

Use placeholder content from `docs/content/business_placeholders.md` until real content is approved.

### Design intent

The hero should be simple, clean, and conversion-oriented.
Avoid clutter.
Do not add excessive decorative elements.

### CTA rules

Primary CTA:

- `Book`
- or `Book Now`
- or `Book a Class`

Secondary CTA:

- `View Classes`
- or similar class-discovery action

Use only one dominant primary CTA style.

## Section 3: Intro / studio overview

### Purpose

Briefly explain what the studio offers and establish credibility.

### Required content

This section should include:

- short studio summary
- 2 to 4 short supporting content points or highlights
- optional small trust cue

### Notes

Do not overload this section with long paragraphs.
Keep it brief and readable.

### Placeholder policy

Use `TODO_BUSINESS_SHORT_DESCRIPTION`, `TODO_BUSINESS_LONG_DESCRIPTION`, or similarly mapped placeholder values.

## Section 4: Classes preview

### Purpose

Quickly show the main class types and guide the user toward the full classes page or booking flow.

### Required content

Include:

- section heading
- short intro text
- 3 to 4 class preview cards
- CTA to classes or booking

### Card content

Each class preview card should support:

- class name
- short description
- duration
- level
- optional capacity

### Placeholder policy

Use the temporary class placeholders from the business placeholder file.

### Design intent

Cards must be easy to scan and consistent with the homepage visual system.
Avoid complex comparison layouts in V1.

## Section 5: Pricing preview

### Purpose

Show that pricing exists, reduce uncertainty, and drive the user toward booking or the full pricing page.

### Required content

Include:

- section heading
- short pricing intro
- intro offer or highlighted offer
- 2 to 3 additional pricing items or preview cards
- CTA to full pricing or booking

### Placeholder policy

Use the pricing placeholder values from the business placeholder file.

### Design intent

Keep this section very easy to understand.
The user should be able to scan the structure even if real values are not yet available.

## Section 6: Instructors preview

### Purpose

Create trust and human presence.

### Required content

Include:

- section heading
- short section intro
- 2 to 3 instructor preview cards
- CTA to the full instructors page

### Card content

Each instructor card should support:

- image area
- name
- role
- short bio

### Placeholder policy

Use clearly marked instructor placeholders when real names, bios, and photos are not yet available.

## Section 7: Contact / location preview

### Purpose

Show the studio is real, reachable, and easy to find.

### Required content

Include:

- address
- phone
- email
- hours or hours placeholder
- map area or map placeholder
- CTA to contact page or booking

### Placeholder policy

All missing contact and location information should remain visibly temporary.

### Design intent

This section should feel practical and trustworthy, not decorative.

## Section 8: FAQ / rules preview

### Purpose

Reduce friction for first-time visitors and give a path to practical answers.

### Required content

Include:

- section heading
- 2 to 3 short FAQ items or rule highlights
- CTA to full FAQ or rules page

### Placeholder policy

Use the FAQ and rules placeholders from the business placeholder file.

### Design intent

Keep this section compact and easy to scan.

## Section 9: Footer

### Purpose

Provide a more complete and professional closing structure than a minimal placeholder footer.

### Required content

The footer should include:

- studio name
- short line of brand/supporting text
- navigation links
- contact details
- booking link
- social link area
- legal/policy area if available

### Placeholder policy

If real legal links or policies are not ready, preserve the structure and use placeholder-safe entries.

## Homepage implementation rules

### Source of content

Homepage content should come from centralized data/config where practical.
Do not scatter dummy text across many components if the repo structure allows centralization.

### Component reuse

The homepage should establish reusable patterns for:

- buttons
- section headings
- cards
- content containers
- CTA rows
- footer structure

### Visual consistency

The homepage must set the standard for:

- spacing rhythm
- card styling
- CTA treatment
- section density
- hierarchy
- image treatment
- footer structure

### Placeholder visibility

Temporary values must remain obvious.
Do not hide missing business information with generic polished marketing copy.

## Accessibility baseline

At minimum, the homepage implementation should include:

- semantic heading order
- accessible links and buttons
- visible focus states
- alt text for images
- sufficient contrast
- keyboard-usable navigation

## Mobile baseline

The homepage must remain usable and clear on mobile.

At minimum:

- hero content remains readable
- booking CTA remains clear
- cards stack cleanly
- footer remains navigable
- navigation remains usable

## Non-goals for homepage V1

Do not treat homepage V1 as a final brand masterpiece.

For this phase, avoid:

- over-engineering
- heavy animation
- unnecessary abstraction
- adding unrelated new features
- trying to solve every future page problem upfront

## Acceptance criteria

The homepage V1 is complete when:

- all required sections exist
- the page follows the approved section order
- the page clearly reflects the V1 direction
- booking is visually prominent
- placeholders are supported cleanly
- the page is stable enough for local review and preview deployment
- the design language is coherent enough to guide the remaining pages

## Implementation note for later prompt files

Any LLM or coding agent implementing the homepage must:

- read the referenced docs first
- inspect the existing repo before changing files
- prefer adapting existing architecture over inventing new structures
- keep scope limited to homepage V1 unless explicitly instructed otherwise
