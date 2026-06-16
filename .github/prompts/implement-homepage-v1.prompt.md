Read these files fully before making any change:

- `docs/design/first_release_design_direction.md`
- `docs/content/business_placeholders.md`
- `docs/implementation/sitewide_v1_spec.md`
- `docs/implementation/homepage_v1_spec.md`
- `docs/implementation/page_rollout_plan.md`

You are working inside the existing pilates website repository.

Your job is to implement **homepage V1 only**.

Do not work on classes, pricing, instructors, contact, FAQ/rules, or any other page unless it is strictly necessary to support homepage routing, shared layout consistency, or existing architectural requirements.

## Goal

Implement a stable, simple, professional homepage based on the approved V1 direction.

The homepage must:

- use Pilates Republic as the only V1 inspiration source
- prioritize booking visibility
- support missing business data via clear centralized placeholders
- establish the visual system for later pages
- fit the existing repo architecture rather than inventing a parallel structure

## Required working style

Before editing:

1. Inspect the existing repo structure.
2. Find the current homepage implementation files.
3. Find the current marketing layout, shared components, config/content files, and styling entry points.
4. Prefer adapting existing structures over creating new ones.
5. If centralized content/config does not yet exist, create the smallest clean version needed for homepage V1 only.

## Scope boundaries

You are allowed to:

- implement or refactor the homepage
- update shared components only when required by the homepage
- create minimal reusable homepage-supporting structures
- create centralized placeholder content/config if needed
- improve the header and footer if needed for homepage V1 consistency

You are NOT allowed to:

- redesign the entire site
- change unrelated pages substantially
- introduce a second design inspiration source
- add large new systems that are not required for homepage V1
- add heavy animation or non-essential features
- create unnecessary abstractions
- replace the repo architecture with a new approach

## Placeholder content rules

Where business inputs are missing:

- use clearly visible placeholder values
- prefer centralized placeholder storage
- keep values easy to search and replace later
- do not invent detailed fake business facts
- keep placeholder naming compatible with `docs/content/business_placeholders.md`

## Design rules

The homepage must include these sections in this order unless a very small architectural adjustment is necessary:

1. Header
2. Hero
3. Intro / studio overview
4. Classes preview
5. Pricing preview
6. Instructors preview
7. Contact / location preview
8. FAQ / rules preview
9. Footer

The page should feel:

- calm
- clear
- professional
- simple
- booking-oriented
- easy to scan

## Technical rules

- Follow existing repo conventions.
- Use `snake_case` for variable names and similar identifiers where applicable.
- Reuse existing components where that is clean and safe.
- Do not duplicate placeholder strings across many files if centralization is practical.
- Keep the implementation maintainable and easy to extend to later pages.
- Keep mobile behavior in mind from the start.
- Preserve accessibility basics.

## Preferred output shape

If the repo already contains good shared primitives, use them.
If not, add only the smallest necessary additions to support:

- header
- footer
- homepage sections
- centralized placeholder content
- reusable button/card/section patterns where clearly needed

## Required verification before finishing

Before you stop, verify:

- homepage only was the primary focus
- booking CTA is clearly visible
- all required homepage sections exist
- placeholders are obvious and consistent
- the page is coherent enough to act as the V1 reference for later pages
- there is no unnecessary scope drift

## Response format

When finished, respond in exactly this structure:

1. SUMMARY

- what you changed
- how homepage V1 now works

2. FILES_CHANGED

- list every file changed
- mark each as created, updated, or deleted

3. ARCHITECTURE_NOTES

- explain where the homepage lives in the repo
- explain any new shared structures you added
- explain how placeholder content is organized

4. ASSUMPTIONS

- list every assumption made because client/business data is missing

5. FOLLOW_UP_RECOMMENDATION

- the single best next page to implement after homepage approval
- why

6. BLOCKERS

- list any real blockers
- if none, say `None`

Important:

- Do not continue to the next page after homepage implementation.
- Do not silently broaden scope.
- Stop after homepage V1 is complete and report back.
