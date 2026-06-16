Read these files fully before making any change:

- `docs/design/first_release_design_direction.md`
- `docs/content/business_placeholders.md`
- `docs/implementation/sitewide_v1_spec.md`
- `docs/implementation/homepage_v1_spec.md`
- `docs/implementation/page_rollout_plan.md`
- `src/config/site_content.ts`
- `src/config/site_design_v1.ts`

You are working inside the existing pilates website repository.

Your job is to implement **one approved non-homepage V1 page only** after homepage approval.

## Allowed target pages

Only one of these pages may be implemented per run:

- Classes
- Pricing
- Instructors
- Contact
- FAQ

Do not work on more than one target page in the same run.

## Goal

Implement the selected page so that it:

- follows the approved V1 direction
- reuses the homepage visual language
- uses Pilates Republic as the only V1 inspiration source
- uses centralized placeholder content where real business data is missing
- fits cleanly into the existing repo architecture

## Required working style

Before editing:

1. Inspect the existing repo structure.
2. Identify the current homepage implementation and treat it as the visual baseline.
3. Inspect shared components, layout files, config/content files, and styling entry points.
4. Reuse homepage patterns whenever practical.
5. Prefer adapting existing structures over introducing new ones.

## Scope boundaries

You are allowed to:

- implement one approved target page
- update shared components only when required for consistency with the selected page
- extend `src/config/site_content.ts` only if the selected page needs more centralized content
- improve shared layout consistency if needed

You are NOT allowed to:

- redesign the homepage
- implement multiple pages in one run
- introduce a second design inspiration source
- redesign the entire site
- add large new systems not required for the selected page
- add heavy animation or unrelated features
- broadly refactor architecture without necessity

## Page selection rule

At the start of your work, determine which single target page was requested in the chat or task context.

If the requested page is unclear:

- stop
- report the ambiguity
- do not guess

## Reuse rules

The selected page should inherit from homepage decisions for:

- spacing rhythm
- section heading treatment
- CTA styling
- card styling
- footer structure
- typography hierarchy
- general content density

Do not create a visually separate page language.

## Placeholder content rules

Where business data is missing:

- use clear placeholder values
- preserve the `TODO_` convention
- centralize new placeholder data in `src/config/site_content.ts` where practical
- do not invent detailed fake business facts

## Technical rules

- Follow existing repo conventions.
- Use `snake_case` for variable names and similar identifiers where applicable.
- Keep changes maintainable and easy to extend later.
- Reuse existing components before creating new ones.
- Preserve accessibility basics.
- Preserve mobile usability.
- Keep the implementation bounded.

## Page-specific expectations

### Classes page

Must clearly present class types, short descriptions, practical details, and a clear booking path.

### Pricing page

Must be easy to scan, easy to understand, and supportive of placeholder values.

### Instructors page

Must support trust with clear profile cards, image areas, names, roles, and short bios.

### Contact page

Must clearly show contact details, location information, hours, and map area or placeholder.

### FAQ page

Must be practical, readable, and easy to scan.

## Required verification before finishing

Before you stop, verify:

- exactly one target page was the focus
- the page matches the homepage system
- placeholder content is obvious and centralized where practical
- there was no unnecessary scope drift
- the page is stable enough for review

## Response format

When finished, respond in exactly this structure:

1. SUMMARY

- what page you implemented
- what you changed
- how it fits the V1 system

2. FILES_CHANGED

- list every file changed
- mark each as created, updated, or deleted

3. REUSE_NOTES

- explain which homepage/shared patterns were reused
- explain any new shared pattern added and why it was necessary

4. PLACEHOLDER_NOTES

- list new placeholder values added or updated
- explain where they live

5. ASSUMPTIONS

- list every assumption made because business/client data is missing

6. FOLLOW_UP_RECOMMENDATION

- recommend the single best next page after this one
- explain why

7. BLOCKERS

- list any real blockers
- if none, say `None`

Important:

- Stop after the selected page is complete.
- Do not silently broaden scope.
- Do not continue to another page automatically.
