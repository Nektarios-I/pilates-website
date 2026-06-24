# Corehouse Pilates Studio — Implementation Plan

# Version: 1.0 | Created: June 2026

# Status: ACTIVE — follow phases in strict order

---

## GUIDING PRINCIPLES

## (Applied from design system theory, Tailwind v4 best practices,

## and UI/UX implementation standards)

1. **Foundation before components, components before pages.**
   Never restyle a page if the primitives it depends on are not
   correct. A broken token or primitive will propagate errors
   upward into every component that uses it.

2. **Fully complete each phase before starting the next.**
   A component is COMPLETE only when ALL of these are true:
   - No forbidden patterns remain in the file
   - All required class strings match the design spec exactly
   - TypeScript compiles with no errors
   - ESLint passes with no new warnings
   - Visual check on desktop and mobile passes

3. **The forbidden pattern list is a hard contract.**
   These patterns must be completely eliminated from every
   marketing file before the project is considered done.
   They are not optional. They are not "close enough."
   After every component change, the agent MUST grep for
   forbidden patterns in the changed file before marking
   it complete.

4. **UI UX Pro Max is a quality layer, not a replacement.**
   The locked design system (docs/design-system-corehouse.md,
   docs/design_components-corehouse.md) is the source of truth.
   UI UX Pro Max adds micro-interaction quality, spacing rhythm
   refinement, and anti-SaaS pattern detection ON TOP of the
   locked spec. It never overrides the locked spec.

5. **Do less, do it completely.**
   It is better to finish 3 components perfectly than to
   touch 10 components and leave all of them partial.

6. **Verify, then move on.**
   After each component: grep for forbidden patterns, check
   lint, check tsc, visually verify. Only then mark complete.

---

## THE FORBIDDEN PATTERN CONTRACT

## These must be eliminated from ALL marketing files.

## The agent must grep for these after every change.

FORBIDDEN — remove every instance found:

Text/foreground colors:
text-black
text-stone-950, text-stone-900, text-stone-800
text-neutral-950, text-neutral-900, text-neutral-800
text-gray-950, text-gray-900, text-gray-800
color: #000, color: #000000

Background colors (on cards, sections, page wrappers):
bg-white
bg-stone-50, bg-stone-100
bg-gray-50, bg-gray-100
bg-neutral-50, bg-neutral-100
background: #fff, background: #ffffff

Borders on cards and section containers:
border border-gray-_
border border-stone-_
border border-neutral-\*
border border-border ← on card/section elements
(EXCEPTION: border-t and border-b in FAQ dividers
and footer hairline are intentional — do NOT remove)
(EXCEPTION: focus:ring on form inputs is intentional)

Gray image placeholders:
bg-gray-200, bg-gray-300
bg-stone-200, bg-stone-300
bg-neutral-200, bg-neutral-300

Background opacity hacks:
bg-[#E8E2D0]/50, bg-[#F4F1E8]/50
any bg-[*]/\* pattern on container backgrounds

Old stone palette remnants:
bg-stone-, text-stone- (any shade)
bg-neutral-, text-neutral- (any shade on marketing pages)

Shadows on cards:
shadow-md, shadow-lg on card wrappers
(shadow-sm is allowed; shadow-md only on active
date pills in booking calendar)

Sharp corners on large containers:
rounded-none, rounded-sm on section wrappers or cards
(use rounded-2xl minimum on cards, rounded-3xl on
CTA blocks and pricing cards)

text

---

## CURRENT STATE SUMMARY

## (From audit report — do not re-audit, treat as ground truth)

Foundation:
✅ Fonts wired (Fraunces --font-serif, Sora --font-sans)
✅ Color tokens wired in @theme
✅ Body base styles correct
✅ UI UX Pro Max installed at .cursor/skills/ui-ux-pro-max/

Components:
✅ C17 Section Wrapper — COMPLETE
✅ C18 Image Placeholder — COMPLETE
✅ C2 Homepage Hero — COMPLETE
✅ C8 Class Card — COMPLETE
✅ C9 Instructor Card — COMPLETE
✅ C16 Footer — COMPLETE (verify gold headings)

⚠️ C1 Navigation Header — PARTIAL
⚠️ C3 Benefits Section — PARTIAL
⚠️ C4 Classes Preview — PARTIAL
⚠️ C5 Instructors Preview — PARTIAL
⚠️ C6 Testimonials — PARTIAL
⚠️ C7 Final CTA — PARTIAL
⚠️ C10 Pricing Tier Card — PARTIAL
⚠️ C11 Pricing Page — PARTIAL
⚠️ C12 FAQ Accordion — PARTIAL
⚠️ C13 Contact Form — PARTIAL
⚠️ C14 About Section — PARTIAL
⚠️ C15 Booking Calendar — NOT STARTED
⚠️ ButtonLink — verify after audit
⚠️ Button primitive — likely still uses stone/black

❌ C15 Booking Calendar UI — NOT STARTED

Pages out of scope (auth/staff — defer):
/login, /account, /book (auth layer),
staff tools, admin routes

---

## PHASE STRUCTURE

## Each phase must be 100% complete before Phase N+1 begins.

## "Complete" = all items in the phase pass the Definition of Done.

---

## DEFINITION OF DONE (per component)

Before marking any component COMPLETE, the agent must confirm:

[ ] All required Tailwind class strings match the spec in
docs/design_components-corehouse.md exactly
[ ] Zero forbidden patterns remain in the changed file
(run grep check — see grep commands below)
[ ] No pure black (#000) anywhere in the file
[ ] No bg-white anywhere in the file
[ ] No bordered card or section containers in the file
[ ] No gray image placeholders in the file
[ ] TypeScript: npx tsc --noEmit passes
[ ] ESLint: npm run lint passes (no new errors)
[ ] Visual check note: describe what desktop and mobile
look like after the change

---

## GREP COMMANDS FOR FORBIDDEN PATTERN CHECK

## Run after every component change before marking DONE.

```powershell
# Run all forbidden pattern checks on a specific file:
Select-String -Path "src\path\to\file.tsx" `
  -Pattern "text-black|bg-white|text-stone-9|bg-stone-[0-9]|border border-gray|border border-stone|bg-gray-[1]|bg-neutral-[1]|shadow-md|shadow-lg|#000000|#000[^a-f0-9]"

# Run across all marketing files at once:
Get-ChildItem -Path "src\app\(marketing)" -Recurse -Include "*.tsx" |
  Select-String -Pattern "text-black|bg-white|text-stone-9|bg-stone-[0-9]|border border-gray|border border-stone|bg-gray-|bg-neutral-|shadow-md|shadow-lg"

# Run across all component files:
Get-ChildItem -Path "src\components" -Recurse -Include "*.tsx" |
  Select-String -Pattern "text-black|bg-white|text-stone-9|bg-stone-[0-9]|border border-gray|border border-stone|bg-gray-|bg-neutral-|shadow-md|shadow-lg"
```

---

## PHASE 0 — PRE-FLIGHT VERIFICATION

## Duration: start of every session

## Purpose: confirm foundation before touching anything

TASK 0.1 — Verify font resolution
Check that font-serif resolves to Fraunces and font-sans
to Sora in the browser. If any element with font-serif
is not rendering Fraunces, stop and fix layout.tsx first.

TASK 0.2 — Verify color token resolution
Confirm bg-background = #F4F1E8
Confirm text-primary = #2D3A1F
Confirm bg-surface = #E8E2D0
Confirm text-accent = #B8A678
If any token is wrong, fix globals.css @theme block first.

TASK 0.3 — Verify UI UX Pro Max is accessible
Confirm .cursor/skills/ui-ux-pro-max/SKILL.md exists.
Confirm scripts/search.py exists.
Before Phase 1 begins, run this search to load wellness
context into the session:

python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "boutique wellness pilates studio premium" --stack nextjs

python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "premium card layout no borders" --stack html-tailwind

python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "wellness navigation header sticky" --stack nextjs

Store these results as context for all subsequent tasks.

TASK 0.4 — Run baseline checks
npx tsc --noEmit → must pass before starting
npm run lint → must pass before starting
If either fails, fix the pre-existing error first and
document what was fixed.

Phase 0 gate: all 4 tasks pass → proceed to Phase 1.

---

## PHASE 1 — PRIMITIVE FIXES

## Duration: one focused session

## Purpose: fix the building blocks everything else depends on

## Rule: do not touch any page files in this phase

TASK 1.1 — Fix Button primitive (button.tsx)
File: src/components/ui/button.tsx (or equivalent)

Current problem: uses stone/black variants internally.

Required fix — apply these exact variants:

primary:
bg-[#2D3A1F] text-[#F4F1E8] px-8 py-4 rounded-full
font-sans font-semibold text-[13px] uppercase tracking-widest
transition-all hover:bg-[#B8A678]
focus-visible:outline focus-visible:outline-2
focus-visible:outline-offset-2
focus-visible:outline-[#B8A678]

secondary:
border border-[#CDD2C9] text-[#2D3A1F] px-8 py-4 rounded-full
font-sans font-semibold text-[13px] uppercase tracking-widest
bg-transparent hover:bg-[#E8E2D0] transition-all
focus-visible:outline focus-visible:outline-2
focus-visible:outline-offset-2
focus-visible:outline-[#B8A678]

ghost / tertiary (if variant exists):
font-sans font-medium text-[#2D3A1F] border-b
border-[#B8A678] pb-0.5 hover:text-[#B8A678]
transition-colors bg-transparent px-0 py-0 rounded-none

Definition of Done:
[ ] Zero stone/black/gray in variant class strings
[ ] All 3 variants present
[ ] Focus ring uses #B8A678
[ ] grep check passes on this file
[ ] tsc passes, lint passes

TASK 1.2 — Verify ButtonLink (button-link.tsx)
File: src/components/ui/button-link.tsx

Re-verify that the previous session's changes are intact
and complete. Do not re-implement unless a gap is found.

Required primary variant:
bg-[#2D3A1F] text-[#F4F1E8] px-8 py-4 rounded-full
font-sans font-semibold text-[13px] uppercase tracking-widest
transition-all hover:bg-[#B8A678]

Required secondary variant:
border border-[#CDD2C9] text-[#2D3A1F] px-8 py-4 rounded-full
font-sans font-semibold text-[13px] uppercase tracking-widest
bg-transparent hover:bg-[#E8E2D0] transition-all

Definition of Done:
[ ] Both variants match exactly
[ ] Focus ring uses #B8A678
[ ] grep check passes

TASK 1.3 — Verify Section Wrapper (section-wrapper.tsx)
Confirm: max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24
If correct, mark DONE and move on.
If incorrect, fix to match.

TASK 1.4 — Verify Image Placeholder (image-placeholder.tsx)
Confirm: bg-[#E8E2D0] rounded-2xl, accepts className prop
Never bg-gray-_, never bg-stone-_, never bg-neutral-\*
If correct, mark DONE and move on.

Phase 1 gate: all 4 tasks DONE → run grep across all
component UI files → zero forbidden patterns → proceed
to Phase 2.

---

## PHASE 2 — NAVIGATION HEADER (COMPLETE RESOLUTION)

## Duration: one focused session

## Purpose: fix the most globally visible component

## Rule: the header appears on every page — it must be

## pixel-perfect before any page work begins

TASK 2.1 — Locate all header-related files
Find: site-header.tsx, site-header-view.tsx,
site-navigation.tsx, studio-logo.tsx
List them all before starting any changes.

TASK 2.2 — Run UI UX Pro Max search for this component
python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "wellness studio navigation header minimal" --stack nextjs

TASK 2.3 — Apply Component 1 spec exactly

Outer header wrapper:
sticky top-0 z-50 w-full bg-[#F4F1E8]
flex items-center justify-between
px-4 md:px-8 py-6 transition-colors
NO border-b
NO shadow, drop-shadow, or box-shadow of any kind

Logo (studio name text):
font-serif font-medium text-xl md:text-2xl
leading-normal text-[#2D3A1F]

Desktop nav link wrapper:
hidden md:flex items-center gap-8

Nav link (default state):
font-sans font-semibold text-[13px] uppercase
tracking-widest text-[#2D3A1F] opacity-80
hover:opacity-100 transition-opacity

Nav link (active state — current page):
font-sans font-semibold text-[13px] uppercase
tracking-widest text-[#B8A678] opacity-100
relative
after:content-[''] after:absolute after:-bottom-2
after:left-1/2 after:-translate-x-1/2
after:w-1 after:h-1 after:bg-[#B8A678]
after:rounded-full

Mobile menu trigger button:
text- Mobile menu trigger button:
text-[#2D3A1F] bg-transparent border-0
hover:opacity-80 transition-opacity
md:hidden

Mobile menu panel (when open):
w-full bg-[#F4F1E8] flex flex-col gap-6
px-4 py-8 border-t border-[#CDD2C9]

Mobile menu link:
font-sans font-semibold text-[13px] uppercase
tracking-widest text-[#2D3A1F] opacity-80
hover:opacity-100 transition-opacity

Primary CTA button in header (Book Now):
Use ButtonLink primary variant — do not inline classes

TASK 2.4 — Forbidden pattern check on all header files
Run grep on every header-related file found in 2.1.
Zero tolerance. Fix every hit before marking DONE.

TASK 2.5 — Definition of Done for Phase 2
[ ] No border-b on the header outer wrapper
[ ] No shadow of any kind on the header
[ ] No bg-white, bg-stone-_, bg-gray-_ on header
[ ] No text-black, text-stone-\* on any header text
[ ] Logo renders in Fraunces (font-serif)
[ ] Nav links render in Sora uppercase (font-sans)
[ ] Active nav link is text-[#B8A678] with dot below
[ ] Mobile menu opens and closes correctly
[ ] Mobile menu background is bg-[#F4F1E8] not white
[ ] grep check passes on all header files
[ ] tsc passes, lint passes

Phase 2 gate: all tasks DONE + Definition of Done
checklist complete → proceed to Phase 3.

---

## PHASE 3 — HOMEPAGE (SECTION BY SECTION)

## Duration: one or two focused sessions

## Purpose: make the homepage the reference implementation

## that all inner pages inherit patterns from

## Rule: complete each section fully before moving to the next

## Rule: do not touch inner pages until homepage is 100% done

TASK 3.1 — Pre-search for homepage patterns
Run before starting any section:

python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "wellness hero section editorial typography" --stack nextjs

python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "premium benefits section no borders" --stack html-tailwind

python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "testimonials dark background wellness quote" --stack react

TASK 3.2 — Verify Hero Section (C2)
File: src/components/sections/page-hero.tsx

The previous session implemented this. Verify it is
complete and no regressions have occurred.

Required state:
Two-column grid desktop / single column mobile
Headline: font-serif font-bold text-5xl md:text-8xl
leading-[1.1] tracking-tight text-[#2D3A1F]
Subtitle: font-sans text-lg md:text-xl leading-relaxed
text-[#2D3A1F]
Image slot: w-full aspect-[4/5] bg-[#E8E2D0] rounded-2xl
Primary CTA: ButtonLink primary variant
Secondary CTA: ButtonLink secondary variant
No pure black anywhere
No bordered box around any content
No bg-white anywhere

If any item is wrong, fix it now before 3.3.

TASK 3.3 — Benefits / Studio Points Section (C3)
File: src/app/(marketing)/page.tsx (inline section)
or dedicated component if it exists

Required state:
Section outer wrapper: w-full bg-[#E8E2D0] py-24
Section title: font-serif font-medium text-2xl md:text-4xl
leading-snug text-[#2D3A1F] mb-16
Grid: max-w-7xl mx-auto px-4 md:px-8
grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8
Each benefit item: NO card wrapper, NO border, NO background
Let items breathe directly on #E8E2D0
Benefit title: font-serif font-medium text-xl md:text-2xl
leading-normal text-[#2D3A1F]
Benefit description: font-sans text-[17px] leading-relaxed
text-[#2D3A1F]
Optional icon: w-8 h-8 text-[#B8A678] mb-4

UI UX Pro Max quality check:
Spacing between icon, title, and description should feel
generous — use flex flex-col gap-4 inside each item.
The section needs visual breathing room — py-24 minimum.

Definition of Done:
[ ] bg-[#E8E2D0] wrapper (not bg-white, not bg-stone-\*)
[ ] No individual item borders
[ ] No individual item card backgrounds
[ ] Serif headings, sans body text
[ ] grep check passes

TASK 3.4 — Classes Preview Section (C4) + Class Card (C8)
Files: src/app/(marketing)/page.tsx
src/components/sections/preview-card.tsx
(or wherever class cards are implemented)

Section required state:
Background: bg-[#F4F1E8] py-24
Header row: flex flex-col md:flex-row md:items-end
justify-between mb-12
Section title: font-serif font-medium text-2xl md:text-4xl
leading-snug text-[#2D3A1F]
"View All" link: font-sans font-medium border-b
border-[#B8A678] pb-0.5
hover:text-[#B8A678] transition-colors
text-[#2D3A1F]
Card grid: grid grid-cols-1 md:grid-cols-2 gap-8

Class Card (C8) required state:
Wrapper: flex flex-col bg-[#E8E2D0] rounded-2xl
overflow-hidden group cursor-pointer
NO border, NO shadow-md, NO shadow-lg
Image slot: w-full aspect-[16/9] bg-[#CDD2C9] rounded-t-2xl
overflow-hidden
(if real image: object-cover w-full h-full
group-hover:scale-105 transition-transform
duration-500)
Content wrapper: p-6 md:p-8 flex flex-col gap-3
Card title: font-serif font-medium text-xl md:text-2xl
leading-normal text-[#2D3A1F]
group-hover:text-[#B8A678] transition-colors
Meta tag (duration, level): font-sans font-medium text-xs
tracking-wide text-[#2D3A1F]
opacity-70
Description: font-sans text-sm leading-normal text-[#2D3A1F]

Definition of Done:
[ ] No border on any class card
[ ] No shadow-md or shadow-lg on cards
[ ] No bg-white on cards
[ ] Image slot has aspect-[16/9]
[ ] Hover interaction works (scale image, color title)
[ ] grep check passes on both files

TASK 3.5 — Instructors Preview Section (C5) + Instructor Card (C9)
Files: src/app/(marketing)/page.tsx
(instructor card component — find path)

Section required state:
Background: bg-[#F4F1E8] py-24
Section title: font-serif font-medium text-2xl md:text-4xl
leading-snug text-[#2D3A1F] mb-12
Grid: grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8

Instructor Card (C9) required state:
Wrapper: flex flex-col group cursor-pointer
NO card background, NO border
Image wrapper: w-full aspect-[3/4] rounded-2xl
overflow-hidden bg-[#E8E2D0] mb-4
Image hover: group-hover:scale-105 transition-transform
duration-500
Name: font-serif font-medium text-xl md:text-2xl
leading-normal text-[#2D3A1F]
Role: font-sans text-sm leading-normal text-[#2D3A1F]
opacity-70
Text ALWAYS below image — never overlaid on top

Definition of Done:
[ ] No border on instructor cards
[ ] No card background color (transparent)
[ ] aspect-[3/4] on all image wrappers
[ ] Text below image, never on top
[ ] Hover scale works
[ ] grep check passes

TASK 3.6 — Testimonials / Trust Section (C6)
File: src/app/(marketing)/page.tsx (inline or component)

This is a DARK section — the only full-bleed dark block
on the homepage besides the footer.

Required state:
Outer wrapper: w-full bg-[#2D3A1F] py-32
flex flex-col items-center justify-center
text-center px-4
Quote text: max-w-4xl font-serif font-medium
text-2xl md:text-4xl leading-snug
text-[#F4F1E8] mb-8
Opening quotation mark (if used):
font-serif font-bold text-6xl text-[#B8A678]
leading-none mb-4
Author name: font-sans font-medium text-xs tracking-wide
text-[#B8A678] uppercase
Author role/studio: font-sans text-[11px] opacity-70
text-[#F4F1E8]
Separator between multiple quotes (if stacking two):
w-px h-16 bg-[#F4F1E8]/20 mx-auto my-16

Critical rules for this section:
NO carousel — never
NO arrows or navigation controls
NO bordered quote cards
Show maximum two quotes stacked with separator
The section background MUST be bg-[#2D3A1F] — not
bg-stone-900, not bg-black, not bg-neutral-900

Definition of Done:
[ ] bg-[#2D3A1F] background confirmed
[ ] text-[#F4F1E8] for quote text
[ ] text-[#B8A678] for author attribution
[ ] No carousel, no bordered boxes
[ ] No pure white (#fff) text — must be text-[#F4F1E8]
[ ] grep check passes

TASK 3.7 — Final CTA Section (C7)
File: src/app/(marketing)/page.tsx (inline or component)

Required state:
This section must be an INSET CARD — not full-bleed.
The rounded-3xl creates the tactile card feel.

    Outer spacing wrapper: w-full px-4 md:px-8 my-24
    Inner card: max-w-6xl mx-auto bg-[#E8E2D0] rounded-3xl
                py-24 px-8 md:px-16
                flex flex-col items-center text-center
    Headline: font-serif font-semibold text-3xl md:text-5xl
              leading-tight tracking-tight text-[#2D3A1F] mb-6
    Body text: font-sans text-lg md:text-xl leading-relaxed
               text-[#2D3A1F] mb-10 max-w-2xl
    Button: ButtonLink primary variant
    Secondary link (optional): text link variant

Critical rule:
This section MUST NOT be full-bleed.
The mx-auto max-w-6xl rounded-3xl is the design.
Do not wrap it in a w-full bg section.

Definition of Done:
[ ] Inset card, not full-bleed
[ ] rounded-3xl on the card
[ ] bg-[#E8E2D0] on the card
[ ] No bg-white, no border on the card
[ ] Serif headline, sans body
[ ] Primary ButtonLink for CTA
[ ] grep check passes

TASK 3.8 — Homepage global grep pass
After all 7 sections are done, run the full forbidden
pattern grep across the homepage page file AND all
component files it imports.
Fix every hit found. Re-run grep. Confirm zero hits.

TASK 3.9 — Homepage Definition of Done
[ ] All 7 sections match their component specs exactly
[ ] Zero forbidden patterns in any homepage-related file
[ ] tsc passes, lint passes
[ ] Visual check: describe desktop appearance (rhythm,
spacing, typography contrast, dark testimonials block)
[ ] Visual check: describe mobile appearance (stacking,
touch targets, font sizes)
[ ] Scroll from top to bottom feels like a premium
wellness site, not a SaaS app or generic template

Phase 3 gate: Task 3.9 fully checked → proceed to Phase 4.

---

## PHASE 4 — INNER MARKETING PAGES

## Duration: one to two focused sessions

## Purpose: apply the established homepage system to all

## remaining public marketing pages

## Rule: homepage must be Phase 3 DONE before starting this

## Rule: complete each page fully before moving to the next

Page order (do in this sequence):
4a. /pricing
4b. /faq
4c. /contact
4d. /about
4e. /classes
4f. /instructors

---

TASK 4a — Pricing Page (/pricing)
Files: src/app/(marketing)/pricing/page.tsx
src/components/sections/pricing-tier-card.tsx

Pre-search:
python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "pricing cards premium wellness no borders" \
 --stack nextjs

Page layout required state:
Page wrapper: max-w-7xl mx-auto px-4 md:px-8 py-24
Page title H1: font-serif font-semibold text-3xl md:text-5xl
leading-tight tracking-tight text-[#2D3A1F]
mb-4
Page subtitle: font-sans text-lg md:text-xl leading-relaxed
text-[#2D3A1F] mb-16 max-w-2xl
Category sections: flex flex-col gap-16
Category title H2: font-serif font-medium text-2xl md:text-4xl
leading-snug text-[#2D3A1F] mb-8
Category grid: grid grid-cols-1 md:grid-cols-3 gap-8

Pricing Tier Card (C10) required state:
Standard tier wrapper:
bg-[#E8E2D0] rounded-3xl p-8 md:p-10
flex flex-col h-full
NO border, NO shadow-md, NO shadow-lg
Featured/recommended tier wrapper:
bg-[#2D3A1F] rounded-3xl p-8 md:p-10
flex flex-col h-full
(invert all text colors inside to text-[#F4F1E8])
Package name H3: font-serif font-medium text-xl md:text-2xl
leading-normal text-[#2D3A1F]
(featured: text-[#F4F1E8])
Duration/cadence meta: font-sans font-medium text-xs
tracking-wide text-
2D3A1F] opacity-70 mb-2
(featured: text-[#F4F1E8] opacity-70)
Price (visual anchor — must be the largest text):
font-serif font-semibold text-3xl md:text-5xl
leading-tight tracking-tight text-[#2D3A1F] my-4
(featured: text-[#F4F1E8])
Price sub-label (e.g. "per month", "one-time"):
font-sans text-sm leading-normal text-[#2D3A1F]
opacity-60
(featured: text-[#F4F1E8] opacity-60)
Divider between price and features:
w-full border-t border-[#CDD2C9] my-6
(featured: border-[#F4F1E8]/20)
Feature list wrapper:
flex flex-col gap-3 mb-8 flex-grow
Feature list item:
font-sans text-[17px] leading-relaxed text-[#2D3A1F]
flex items-start gap-3
(featured: text-[#F4F1E8])
Feature checkmark/dot:
w-1.5 h-1.5 rounded-full bg-[#B8A678] mt-2.5 shrink-0
(featured: bg-[#F4F1E8])
CTA button (standard tier): ButtonLink primary
CTA button (featured tier):
bg-[#B8A678] text-[#2D3A1F] px-8 py-4 rounded-full
font-sans font-semibold text-[13px] uppercase
tracking-widest transition-all hover:bg-[#F4F1E8]

Definition of Done for 4a:
[ ] Price is the largest text on every card
[ ] No border on any card
[ ] No bg-white or bg-stone-\* on any card
[ ] No shadow-md or shadow-lg on cards
[ ] Featured tier uses bg-[#2D3A1F] with inverted colors
[ ] gap-16 between pricing categories
[ ] All text uses #2D3A1F or #F4F1E8 — zero stone/neutral
[ ] grep check passes on both files
[ ] tsc passes, lint passes

---

TASK 4b — FAQ Page (/faq)
Files: src/app/(marketing)/faq/page.tsx
src/components/sections/faq-accordion.tsx

Pre-search:
python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "faq accordion minimal dividers wellness" \
 --stack react

CRITICAL: faq-accordion.tsx MUST have 'use client' at top.
This is the only marketing component that requires it.
If it is missing, add it before anything else.

Page layout required state:
Page wrapper: max-w-7xl mx-auto px-4 md:px-8 py-24
Page title H1: font-serif font-semibold text-3xl md:text-5xl
leading-tight tracking-tight text-[#2D3A1F]
mb-4
Intro text: font-sans text-lg md:text-xl leading-relaxed
text-[#2D3A1F] mb-16 max-w-2xl
Accordion wrapper: w-full max-w-3xl mx-auto

FAQ Accordion (C12) required state:
List wrapper:
w-full flex flex-col border-t border-[#CDD2C9]
Item wrapper (closed):
border-b border-[#CDD2C9] py-6 cursor-pointer group
Item wrapper (open):
border-b border-[#CDD2C9] py-6 cursor-pointer group
(background stays transparent — never add bg on open)
Question row:
flex justify-between items-center
Question text:
font-serif font-medium text-xl md:text-2xl
leading-normal text-[#2D3A1F]
group-hover:text-[#B8A678] transition-colors
Icon (plus/chevron):
w-5 h-5 text-[#2D3A1F] shrink-0
transition-transform duration-300
(rotate-45 or rotate-180 when open)
Answer text (visible when open):
font-sans text-[17px] leading-relaxed
tracking-[0.01em] text-[#2D3A1F] opacity-80
pt-4 pb-2
Open/close state: managed via useState in client component

Critical rules for FAQ:
The ONLY borders in this component are the horizontal
hairline dividers between items (border-[#CDD2C9]).
NO card wrapper around each item.
NO background color on individual items.
NO shadow on any item.
NO rounded corners on items.
The items live directly on the page background.

Definition of Done for 4b:
[ ] 'use client' at top of accordion component
[ ] Horizontal hairline dividers only — no card wrappers
[ ] No bg on individual items (open or closed)
[ ] Question text shifts to text-[#B8A678] on hover
[ ] Icon animates on open/close
[ ] Answer slides open smoothly (height transition or
conditional render with opacity fade)
[ ] grep check passes on both files
[ ] tsc passes, lint passes

---

TASK 4c — Contact Page (/contact)
Files: src/app/(marketing)/contact/page.tsx
src/components/sections/contact-form.tsx

Pre-search:
python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "contact form premium wellness minimal inputs" \
 --stack nextjs

Page layout required state:
Page wrapper: max-w-7xl mx-auto px-4 md:px-8 py-24
Two-column grid: grid grid-cols-1 md:grid-cols-2
gap-16 items-start
Mobile: single column, info on top

Left column — contact info:
Heading H1: font-serif font-semibold text-3xl md:text-5xl
leading-tight tracking-tight text-[#2D3A1F] mb-6
Intro: font-sans text-lg md:text-xl leading-relaxed
text-[#2D3A1F] mb-10
Detail label: font-sans font-semibold text-[13px] uppercase
tracking-widest text-[#2D3A1F] mb-1
Detail value: font-sans text-[17px] leading-relaxed
text-[#2D3A1F]
Spacing between detail groups: mb-6

Right column — contact form:
Form wrapper: flex flex-col
NO border, NO card background, NO shadow
Form label:
block font-sans font-semibold text-[13px] uppercase
tracking-widest leading-none text-[#2D3A1F] mb-2
Input / textarea:
w-full bg-[#E8E2D0] rounded-xl p-4
font-sans text-[17px] text-[#2D3A1F]
placeholder:text-[#2D3A1F]/40
focus:outline-none focus:ring-2 focus:ring-[#B8A678]
transition-all mb-6
NO border, NO border-gray-\*, NO bg-white
Textarea specific: resize-none min-h-[160px]
Submit button: ButtonLink primary variant (or button
primary variant if form submit needed)
Error state (if validation exists):
font-sans text-sm text-red-700 mt-1
(red-700 is acceptable for errors — not a forbidden
pattern since it is semantic, not decorative)

Note on form submission:
The form is currently presentational (no backend).
Do NOT add a submission handler in this phase.
Style only. Mark the TODO in a code comment:
// TODO: wire form submission to backend/email handler

Definition of Done for 4c:
[ ] Two-column layout on desktop
[ ] Single column on mobile with info on top
[ ] Cream inputs (bg-[#E8E2D0]) — never white, never gray
[ ] Gold focus ring on all inputs
[ ] No border on inputs (the bg-[#E8E2D0] IS the container)
[ ] No card wrapper around the form
[ ] Labels are uppercase Sora tracking-widest
[ ] grep check passes on both files
[ ] tsc passes, lint passes

---

TASK 4d — About Page (/about)
File: src/app/(marketing)/about/page.tsx

Pre-search:
python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "about story editorial asymmetric layout wellness" \
 --stack nextjs

Required state (Component 14 — asymmetric editorial layout):

Page wrapper: max-w-7xl mx-auto px-4 md:px-8 py-24

Main story section:
Grid: grid grid-cols-1 md:grid-cols-12
gap-12 md:gap-16 items-center
Text column: md:col-span-5
Image column: md:col-span-7

Text column content:
Eyebrow label (optional):
font-sans font-semibold text-[13px] uppercase
tracking-widest text-[#B8A678] mb-4
H2: font-serif font-medium text-2xl md:text-4xl
leading-snug text-[#2D3A1F] mb-6
Body paragraphs: font-sans text-[17px] leading-relaxed
text-[#2D3A1F] mb-4
text-align: LEFT — never centered
Secondary paragraph:
font-sans text-[17px] leading-relaxed
text-[#2D3A1F] opacity-80

Image column content:
Image wrapper: w-full aspect-[4/5] md:aspect-auto
md:h-full min-h-[400px]
rounded-2xl overflow-hidden bg-[#E8E2D0]
Real image (when available):
object-cover w-full h-full

Values / philosophy section (if present):
Background: bg-[#E8E2D0] (full-width bleed)
Inner: max-w-7xl mx-auto px-4 md:px-8 py-24
Grid: grid grid-cols-1 md:grid-cols-3 gap-8
NO card wrappers on individual value items
(same pattern as Benefits section — C3)

Critical rules:
Long body text MUST be left-aligned — never center-align
paragraphs of more than 2 lines.
Centered text is only for short headlines or pull quotes.

Definition of Done for 4d:
[ ] Asymmetric 12-column grid layout
[ ] Body text left-aligned
[ ] Image slot has correct aspect ratio and placeholder
[ ] No borders, no bg-white, no stone colors
[ ] grep check passes
[ ] tsc passes, lint passes

---

TASK 4e — Classes Page (/classes)
File: src/app/(marketing)/classes/page.tsx
(class card component already fixed in Phase 3)

Pre-search:
python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "class schedule listing premium wellness grid" \
 --stack nextjs

Page layout required state:
Page wrapper: max-w-7xl mx-auto px-4 md:px-8 py-24
Page title H1: font-serif font-semibold text-3xl md:text-5xl
leading-tight tracking-tight text-[#2D3A1F]
mb-4
Intro: font-sans text-lg md:text-xl leading-relaxed
text-[#2D3A1F] mb-16 max-w-2xl
Class grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
gap-8
Each card: use Class Card (C8) — already fixed in Phase 3

Class detail sections (if any class has expanded info):
Section background alternation:
First detail: bg-[#F4F1E8]
Second detail: bg-[#E8E2D0]
Never two consecutive bg-[#E8E2D0] sections
Never bg-white

Inset CTA at bottom of page:
Same pattern as C7 Final CTA:
max-w-6xl mx-auto bg-[#E8E2D0] rounded-3xl
py-16 px-8 flex flex-col items-center text-center
my-16

Definition of Done for 4e:
[ ] C8 Class Card used consistently throughout
[ ] No bg-white, no stone colors, no bordered cards
[ ] Inset rounded CTA at bottom
[ ] grep check passes
[ ] tsc passes, lint passes

---

TASK 4f — Instructors Page (/instructors)
File: src/app/(marketing)/instructors/page.tsx
(instructor card component already fixed in Phase 3)

Page layout required state:
Page wrapper: max-w-7xl mx-auto px-4 md:px-8 py-24
Page title H1: font-serif font-semibold text-3xl md:text-5xl
leading-tight tracking-tight text-[#2D3A1F]
mb-4
Intro: font-sans text-lg md:text-xl leading-relaxed
text-[#2D3A1F] mb-16 max-w-2xl
Instructor grid: grid grid-cols-2 md:grid-cols-3
lg:grid-cols-4 gap-6 md:gap-8
Each card: use Instructor Card (C9) — already fixed

Individual instructor detail section (if expanded bios exist):
Two-column layout (same as About — Component 14 pattern)
Large portrait image: aspect-[3/4] rounded-2xl
Bio text: left-aligned, font-sans text-[17px]

Definition of Done for 4f:
[ ] C9 Instructor Card used consistently throughout
[ ] No text on top of images anywhere
[ ] No bordered cards
[ ] grep check passes
[ ] tsc passes, lint passes

Phase 4 gate: all 6 pages (4a–4f) fully DONE →
run grep across entire src/app/(marketing)/ directory →
zero forbidden patterns → proceed to Phase 5.

---

## PHASE 5 — BOOKING CALENDAR UI (COMPONENT 15)

## Duration: one dedicated session

## Purpose: implement the most complex interactive component

## Rule: this phase runs AFTER all marketing pages are done

## Rule: this is the highest-risk component for "SaaS/clinical

## feel" regression — extra care required

TASK 5.1 — Pre-search for booking patterns
python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "booking calendar wellness premium pill date selector" \
 --stack react

python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "time slot selector mobile horizontal scroll" \
 --stack nextjs

TASK 5.2 — Locate existing booking files
Find all files related to /book route.
List them before touching anything.
Identify: page file, any calendar component, any time
slot component, any state management files.
Report the exact paths of everything found.

TASK 5.3 — Implement Booking Calendar UI (C15)

This component MUST have 'use client' at the top.

Overall container:
w-full bg-[#F4F1E8] px-4 md:px-8 py-16

Section title:
font-serif font-medium text-2xl md:text-4xl
leading-snug text-[#2D3A1F] mb-12

— DATE ROW —

Date row outer wrapper:
w-full overflow-x-auto scroll-smooth
scrollbar-hide pb-4
(add snap scrolling for mobile:)
snap-x snap-mandatory

Date row inner wrapper:
flex gap-3 w-max md:w-full md:justify-start

Date pill (inactive / default):
flex flex-col items-center justify-center
min-w-[72px] md:min-w-[80px] py-4 px-3
rounded-2xl bg-[#E8E2D0] text-[#2D3A1F]
cursor-pointer transition-colors duration-200
hover:bg-[#CDD2C9]
snap-start shrink-0
NO border

Date pill (active / selected):
flex flex-col items-center justify-center
min-w-[72px] md:min-w-[80px] py-4 px-3
rounded-2xl bg-[#2D3A1F] text-[#F4F1E8]
cursor-pointer shadow-md
snap-start shrink-0
NO border

Date pill (unavailable / past date):
same as inactive but:
opacity-40 cursor-not-allowed
pointer-events-none

Day label inside pill (e.g. "MON"):
font-sans font-semibold text-[13px] uppercase
tracking-widest leading-none mb-1

Date number inside pill (e.g. "24"):
font-serif font-medium text-xl leading-none

— TIME SLOT GRID —

Time grid label:
font-sans font-semibold text-[13px] uppercase
tracking-widest text-[#2D3A1F] mt-10 mb-4

Time grid wrapper:
grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4
gap-3

Time pill (inactive / available):
w-full py-3 rounded-xl bg-[#E8E2D0]
text-center font-sans text-[17px] text-[#2D3A1F]
cursor-pointer transition-colors duration-200
hover:bg-[#CDD2C9]
NO border of any kind

Time pill (active / selected):
w-full py-3 rounded-xl bg-[#2D3A1F]
text-center font-sans text-[17px] text-[#F4F1E8]
cursor-pointer

Time pill (unavailable / fully booked):
w-full py-3 rounded-xl bg-[#E8E2D0]
text-center font-sans text-[17px] text-[#2D3A1F]
opacity-40 cursor-not-allowed pointer-events-none

— CONFIRMATION AREA —

Appears below time grid after a time is selected.

Confirmation wrapper:
mt-10 p-8 bg-[#E8E2D0] rounded-3xl
flex flex-col md:flex-row md:items-center
md:justify-between gap-6

Selected class name:
font-serif font-medium text-xl md:text-2xl
leading-normal text-[#2D3A1F]

Selected date + time:
font-sans text-[17px] leading-relaxed
text-[#2D3A1F] opacity-80

Confirm booking button:
ButtonLink primary variant
(or button primary if form action needed)

— STATE MANAGEMENT —

Required state:
selectedDate: string | null
selectedTime: string | null
Both managed via useState inside the client component

When selectedDate changes:
Reset selectedTime to null
(cannot keep a time selection from a different day)

CRITICAL rules for this component:
NEVER use <input type="date"> or <input type="time">
NEVER use a grid of calendar cells with column headers
(Mon Tue Wed Thu Fri Sat Sun) — this is the "medical
portal" pattern that must be avoided
NEVER add borders to pills
NEVER use gray backgrounds for pills — always #E8E2D0
The horizontal date scroll MUST work on mobile touch
Unavailable states use opacity-40 NOT strikethrough
or heavy visual treatment

TASK 5.4 — Mobile verification for booking calendar
This component has the most complex mobile behavior.
After implementing, verify:

[ ] Date row scrolls horizontally on narrow screens
[ ] Snap scrolling works (dates snap into place)
[ ] Time grid collapses from 4 columns to 2 columns
[ ] Touch targets are at least 44px tall (py-4 = ~48px
— this is correct, do not reduce)
[ ] Confirmation area stacks vertically on mobile
[ ] No horizontal overflow on the page body
(the date row scroll must be contained)

TASK 5.5 — Definition of Done for Phase 5
[ ] 'use client' at top of calendar component
[ ] Horizontal scrollable date pill row
[ ] Date pills use bg-[#E8E2D0] inactive / bg-[#2D3A1F]
active — NO borders
[ ] Time pills use same color system — NO borders
[ ] Unavailable states use opacity-40 only
[ ] NO <input type="date"> anywhere in booking files
[ ] NO grid with day-of-week headers
[ ] State resets correctly when date changes
[ ] Confirmation area appears after time selection
[ ] Mobile scroll and snap work correctly
[ ] grep check passes on all booking files
[ ] tsc passes, lint passes

Phase 5 gate: Task 5.5 fully checked → proceed to Phase 6.

---

## PHASE 6 — FULL SITE VERIFICATION PASS

## Duration: one dedicated session

## Purpose: find and eliminate any remaining forbidden

## patterns across the entire marketing codebase

## Rule: no new features, no new components — verification only

TASK 6.1 — Run master forbidden pattern grep

Execute these commands and capture ALL output.
Every hit must be investigated and resolved.

# Full marketing pages scan:

Get-ChildItem -Path "src\app\(marketing)" `    -Recurse -Include "*.tsx","*.ts" |
    Select-String -Pattern`
"text-black|bg-white|text-stone-9|text-stone-8|bg-stone-[0-9]|border border-gray|border border-stone|border border-neutral|bg-gray-[12]|bg-neutral-[12]|shadow-md|shadow-lg|#000000|bg-stone-50|bg-stone-100"

# Full components scan:

Get-ChildItem -Path "src\components" `    -Recurse -Include "*.tsx","*.ts" |
    Select-String -Pattern`
"text-black|bg-white|text-stone-9|text-stone-8|bg-stone-[0-9]|border border-gray|border border-stone|border border-neutral|bg-gray-[12]|bg-neutral-[12]|shadow-md|shadow-lg|#000000|bg-stone-50|bg-stone-100"

For every hit found: 1. Open the file 2. Determine if it is a marketing file or a
deferred (auth/staff) file 3. If marketing: fix it immediately 4. If auth/staff: add a TODO comment and document
it in the deferred work list (Section 8 of this plan) 5. Re-run grep on the fixed file to confirm zero hits

TASK 6.2 — Typography consistency check

Scan for these typography anti-patterns:

Get-ChildItem -Path "src\app\(marketing)","src\components\sections" `    -Recurse -Include "*.tsx" |
    Select-String -Pattern`
"text-3xl font-bold|text-2xl font-bold|font-bold text-3xl|text-4xl font-bold"

Any heading that uses font-bold without font-serif is
wrong — headings must use font-serif.
Fix every instance found in marketing files.

TASK 6.3 — Image placeholder consistency check

Find every image slot that does NOT use bg-[#E8E2D0]:

Get-ChildItem -Path "src\app\(marketing)","src\components" `    -Recurse -Include "*.tsx" |
    Select-String -Pattern`
"bg-gray-2|bg-stone-2|bg-neutral-2|bg-slate-2"

Replace every hit with bg-[#E8E2D0] rounded-2xl.
Confirm aspect ratio class is present on every
image wrapper (aspect-[4/5], aspect-[16/9], aspect-[3/4]).

TASK 6.4 — Button system consistency check

Find every button or link that uses inline color classes
instead of the ButtonLink/Button component:

Get-ChildItem -Path "src\app\(marketing)" `    -Recurse -Include "*.tsx" |
    Select-String -Pattern`
"bg-stone-900|bg-neutral-900|bg-black|rounded-md px-"

For every hit: replace with the correct ButtonLink variant.
Do not allow inline button styling in page files.

TASK 6.5 — Section spacing audit

Every major section wrapper must have at minimum py-16.
Find sections that may have insufficient vertical spacing:

Get-ChildItem -Path "src\app\(marketing)" `
-Recurse -Include "\*.tsx" |
Select-String -Pattern "py-4 |py-6 |py-8 |py-10 |py-12 "

Investigate each hit. If it is a section wrapper with
not enough breathing room, upgrade to py-16 md:py-24.
If it is internal component padding (card padding,
button padding) leave it unchanged.

TASK 6.6 — Run full test suite

npm run lint → must pass with zero errors
npx tsc --noEmit → must pass with zero errors
npm run test → all marketing page tests must pass

If any test fails due to a class string change,
update the test selector — do not revert the design change.
Tests should use semantic selectors (role, label, text)
not class-based selectors.

TASK 6.7 — Definition of Done for Phase 6
[ ] Master grep returns zero hits on marketing files
[ ] Typography grep returns zero wrong-font headings
[ ] Image placeholder grep returns zero gray placeholders
[ ] Button grep returns zero inline button styles
[ ] All sections have sufficient vertical padding
[ ] lint passes, tsc passes, all tests pass

Phase 6 gate: Task 6.7 fully checked → proceed to Phase 7.

---

## PHASE 7 — VISUAL REVIEW AND POLISH

## Duration: one session

## Purpose: review the site on real browser, real device,

## identify visual rhythm and quality issues,

## apply final micro-interaction polish

## Rule: this is the last phase before Vercel production deploy

TASK 7.1 — Deploy to Vercel preview
Push current branch to GitHub.
Confirm Vercel preview URL is generated.
Open the preview URL in a real browser.
This is the first time we see the full system together
in a real rendering environment.

TASK 7.2 — Desktop visual review checklist
Walk through every page on desktop (1280px+).
For each page answer:

Homepage:
[ ] Does the hero feel premium and editorial?
[ ] Is the typography scale dramatic enough?
(Hero headline should feel large and commanding)
[ ] Does the Benefits section feel airy on bg-[#E8E2D0]?
[ ] Do class cards feel warm and inviting, not SaaS-like?
[ ] Does the dark Testimonials section feel grounding?
[ ] Does the Final CTA feel like a tactile card invitation?
[ ] Does the footer feel like a confident visual terminus?

Inner pages:
[ ] Does the pricing page make the price the visual hero?
[ ] Does the FAQ feel clean and literary, not like a
support knowledge base?
[ ] Does the contact form feel premium, not like a
SaaS login screen?
[ ] Does the about page feel editorial and warm?

Global:
[ ] Is the muted gold (#B8A678) used sparingly?
It should appear only on: active nav dot, CTA hover,
author attribution, featured tier CTA, form focus rings.
If it appears everywhere, it loses its signal value.
[ ] Is the forest green (#2D3A1F) the dominant dark tone?
There should be zero pure black visible anywhere.
[ ] Is the warm parchment (#F4F1E8) the resting background?
The eye should rest on this color between sections.

TASK 7.3 — Mobile visual review checklist
Open the preview on a real mobile device or Chrome DevTools
mobile emulation at 390px (iPhone 14 width).

[ ] Hero headline wraps gracefully at text-5xl
[ ] Navigation collapses to hamburger menu
[ ] Mobile menu opens with bg-[#F4F1E8] background
[ ] Booking calendar date row scrolls horizontally
[ ] Time pill grid shows 2 columns on mobile
[ ] Pricing cards stack to single column
[ ] FAQ accordion touch targets are large enough (min 44px)
[ ] Contact form inputs are large enough to tap comfortably
[ ] Footer stacks to single column cleanly
[ ] No horizontal overflow on any page

TASK 7.4 — Micro-interaction polish pass
After visual review, apply these final polish details
if any are missing:

Card hover lift (subtle):
On Class Card and Pricing Card wrappers, add:
transition-transform duration-300
hover:-translate-y-1
(1px lift on hover — subtle premium feel)

Image zoom on card hover:
Confirm group-hover:scale-105 duration-500 is on
all card images with overflow-hidden on wrapper.

Button transition smoothness:
All buttons must have: transition-all duration-200
Not just transition (which uses default 150ms).
200ms feels more intentional and premium.

Nav link opacity transition:
transition-opacity duration-200 on all nav links.

FAQ icon rotation:
transition-transform duration-300 on the icon.
45deg for plus icon or 180deg for chevron.

Form input focus:
transition-all duration-200 on all inputs.
The gold ring should appear smoothly, not instantly.

Section entrance (optional, deferred if complex):
If scroll-triggered reveals are desired, defer to
a separate motion phase after Phase 7 is complete.
Do not introduce Framer Motion in this phase.

TASK 7.5 — Final UI UX Pro Max quality audit
Run one final search targeting the complete site:

python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "wellness boutique marketing site quality checklist" \
 --stack nextjs

python .cursor/skills/ui-ux-pro-max/scripts/search.py \
 "premium UI micro interactions hover transitions" \
 --stack react

Apply any high-confidence recommendations that do not
conflict with the locked design system.
Document what was applied and why.

TASK 7.6 — Definition of Done for Phase 7
TASK 7.6 — Definition of Done for Phase 7
[ ] Vercel preview URL confirmed working
[ ] Desktop visual review checklist fully checked
[ ] Mobile visual review checklist fully checked
[ ] Micro-interaction polish applied to all cards,
buttons, nav links, FAQ icon, and form inputs
[ ] UI UX Pro Max final audit run and documented
[ ] Zero visible pure black anywhere on the site
[ ] Zero visible white backgrounds on any card or section
[ ] Zero bordered card containers visible anywhere
[ ] The site feels like a premium boutique wellness brand
not a SaaS app or generic template
[ ] lint passes, tsc passes, all tests pass

Phase 7 gate: Task 7.6 fully checked → site is ready
for Phase 8 (production deployment and content).

---

## PHASE 8 — PRODUCTION DEPLOYMENT AND CONTENT READINESS

## Duration: ongoing, not a single session

## Purpose: prepare the site for real launch

## Rule: design system work is complete after Phase 7

## Phase 8 is content and infrastructure, not design

TASK 8.1 — Vercel production deployment
Connect the main branch to Vercel production.
Configure custom domain when available.
Confirm SSL certificate is active.
Confirm all environment variables are set correctly
in Vercel dashboard (not in .env committed to repo).

TASK 8.2 — Real content replacement
These placeholder values must be replaced before launch.
Track each one here:

[ ] Studio name confirmed: Corehouse Pilates Studio
[ ] Studio address (Cyprus location — TBD)
[ ] Studio phone number (TBD)
[ ] Studio email address (TBD)
[ ] Opening hours (TBD)
[ ] Hero headline — final approved copy
[ ] Hero subtitle — final approved copy
[ ] Benefits section — 3 final studio pillars with copy
[ ] Class descriptions — Reformer, Mat, and any others
[ ] Class schedule — real times and days
[ ] Instructor names, roles, and bios
[ ] Pricing tiers — final package names and prices
[ ] FAQ — real questions and answers from studio owner
[ ] About / story — real studio origin story
[ ] Contact page — real address, map embed if desired
[ ] Footer legal links — privacy policy, terms (TBD)
[ ] Footer social links — Instagram, etc. (TBD)

TASK 8.3 — Real photography replacement
Every bg-[#E8E2D0] image placeholder must be replaced
with real photography before launch.
Track each slot:

[ ] Hero image — portrait orientation, 4:5
(movement shot or studio architectural detail)
[ ] Class card images — 16:9 each
(one per class type: Reformer, Mat, etc.)
[ ] Instructor portrait images — 3:4 each
(one per instructor, warm-toned, consistent style)
[ ] About page image — 4:5 or tall portrait
(studio space or founder portrait)
[ ] Any additional section imagery

Photography brief for photographer / studio owner:
Tone: warm, natural light, Mediterranean warmth
Style: editorial, movement-focused, not stock-photo-like
Colors: warm tones that complement #F4F1E8 parchment
background — avoid cool/clinical lighting
Avoid: pure white backgrounds, harsh flash,
overly posed static shots

TASK 8.4 — Contact form backend
The contact form is currently presentational only.
Before launch, wire it to one of:
Option A: Resend / Postmark API (recommended — simple)
Option B: Supabase edge function (already in stack)
Option C: Formspree (simplest, no backend required)
Add proper form validation (required fields, email format).
Add success and error states to the form UI:
Success: font-sans text-[17px] text-[#2D3A1F]
with a small bg-[#E8E2D0] rounded-xl p-4 block
Error: font-sans text-sm text-red-700

TASK 8.5 — SEO and metadata
Confirm these are in place before launch:
[ ] Unique <title> and <meta description> per page
(createPageMetadata helper already exists — use it)
[ ] Open Graph image (og:image) for homepage
[ ] robots.txt configured correctly
[ ] sitemap.xml generated and verified
[ ] JSON-LD structured data for local business
(Studio name, address, phone, opening hours)
[ ] Canonical URLs set correctly

TASK 8.6 — Performance verification
Run Lighthouse on production URL after real photos are added:
[ ] Performance score ≥ 90
[ ] Accessibility score ≥ 95
[ ] Best Practices score ≥ 95
[ ] SEO score = 100
Key performance checks:
[ ] All images use next/image with correct width/height
[ ] Fonts load with display: swap (already configured)
[ ] No layout shift (CLS) from image placeholders
(aspect-ratio classes prevent this — verify)
[ ] Largest Contentful Paint (LCP) ≤ 2.5s

TASK 8.7 — Accessibility verification
Run Playwright accessibility checks on all public pages:
[ ] All images have meaningful alt text
[ ] All interactive elements are keyboard navigable
[ ] Focus states are visible (gold ring — already designed)
[ ] Color contrast ratios pass WCAG AA:
#2D3A1F on #F4F1E8 — check (should pass easily)
#F4F1E8 on #2D3A1F — check (should pass easily)
#B8A678 on #F4F1E8 — CHECK CAREFULLY
(muted gold on parchment may be marginal for
small text — use only for decorative elements
and large text if contrast is insufficient)
#B8A678 on #2D3A1F — check for footer/dark sections
[ ] Form inputs have associated labels
[ ] FAQ accordion announces open/close state to
screen readers (aria-expanded on trigger)
[ ] Booking calendar date/time pills have aria-selected
and aria-label attributes

---

## PHASE 9 — DEFERRED WORK (AUTH AND STAFF PAGES)

## Duration: separate project track after launch

## Purpose: document what is explicitly deferred and why

## Rule: do NOT start this phase before the site launches

The following pages and features are intentionally deferred.
They use the old stone/bordered SaaS styling but they are
not public marketing pages. They will be redesigned as a
separate track after the studio launches.

Deferred pages:
/login — auth page, stone styling
/account — user account dashboard
/book (auth) — booking flow with authentication
Staff tools — calendar management, instructor views
Admin routes — studio management interface

Deferred features:
Dark mode — requires token system extension
Blog / CMS — requires CMS integration decision
Booking backend — real availability API
Payment flow — Stripe or similar integration
User accounts — instructor vs. regular user roles
Analytics — GA4 or PostHog wiring
JSON-LD / OG images — automated generation

When the auth/staff redesign begins, the same three
design files (design-system-corehouse.md,
design_components-corehouse.md,
design-diagnosis-corehouse.md) remain the source of truth.
The forbidden pattern contract applies to those pages too.

---

## AGENT BEHAVIOR RULES

## These apply to every session that uses this plan

RULE 1 — One phase at a time
Never start Phase N+1 until Phase N is fully gated.
If asked to skip a phase, refuse and explain why
the gate must be passed first.

RULE 2 — One component at a time
Within a phase, complete one component fully before
starting the next. Never leave a component PARTIAL.

RULE 3 — Grep before marking DONE
After every component change, run the grep commands
from the GREP COMMANDS section above on the changed
file. Zero hits required. No exceptions.

RULE 4 — Never break logic
Only JSX structure and Tailwind class strings change.
TypeScript types, props, interfaces, data fetching,
server actions, routing, and business logic are
never touched in design implementation sessions.

RULE 5 — UI UX Pro Max is a quality layer
Run the relevant search.py query before each major
component. Apply recommendations that improve quality
within the locked design system constraints.
Never let the skill override the locked spec.

RULE 6 — Report what you did
After each component, state:

- Which file(s) changed
- Which class strings were replaced (old → new)
- Which forbidden patterns were removed
- Grep result (confirmed zero hits / or hits found
  and fixed)
- Whether tsc and lint still pass

RULE 7 — The forbidden pattern contract is non-negotiable
If a file contains a forbidden pattern after a change,
the component is NOT done. Fix it before moving on.
There is no "close enough" or "mostly done."

RULE 8 — When in doubt, add whitespace and serif
The implementation mantra from the design brief:
"If it feels like a software app, add more whitespace
and a larger serif. If it feels too quiet, add a
Sora-labeled CTA."
Apply this judgment call whenever a section looks
flat or generic after implementation.

---

## QUICK REFERENCE — KEY VALUES

Fonts:
Headings (H1–H3, Hero, pull quotes): font-serif (Fraunces)
Everything else (body, labels, buttons, nav, UI): font-sans (Sora)

Colors:
Page background: #F4F1E8 bg-[#F4F1E8]
All text: #2D3A1F text-[#2D3A1F]
Card surfaces: #E8E2D0 bg-[#E8E2D0]
Borders/dividers: #CDD2C9 border-[#CDD2C9]
Accent/gold: #B8A678 text-[#B8A678] bg-[#B8A678]
Dark sections: #2D3A1F bg-[#2D3A1F]
Dark text on dark:#F4F1E8 text-[#F4F1E8]

Typography scale (key levels):
Hero: font-serif font-bold text-5xl md:text-8xl
leading-[1.1] tracking-tight
H1: font-serif font-semibold text-3xl md:text-5xl
leading-tight tracking-tight
H2: font-serif font-medium text-2xl md:text-4xl
leading-snug
H3: font-serif font-medium text-xl md:text-2xl
leading-normal
Body Lg: font-sans text-lg md:text-xl leading-relaxed
Body Reg: font-sans text-[17px] leading-relaxed
Label/UI: font-sans font-semibold text-[13px] uppercase
tracking-widest

Buttons:
Primary: bg-[#2D3A1F] text-[#F4F1E8] px-8 py-4
rounded-full hover:bg-[#B8A678] transition-all
Secondary: border border-[#CDD2C9] text-[#2D3A1F] px-8 py-4
rounded-full hover:bg-[#E8E2D0] transition-all

Spacing:
Section small: py-12
Section medium: py-16 md:py-24
Section large: py-24 md:py-32
Card padding: p-6 md:p-8 (minimum p-6, prefer p-8)
Container: max-w-7xl mx-auto px-4 md:px-8

---

## PHASE COMPLETION TRACKER

## Update this table at the end of each session

| Phase | Description              | Status      | Date completed |
| ----- | ------------------------ | ----------- | -------------- |
| 0     | Pre-flight verification  | NOT STARTED |                |
| 1     | Primitive fixes          | NOT STARTED |                |
| 2     | Navigation header        | NOT STARTED |                |
| 3     | Homepage                 | NOT STARTED |                |
| 4a    | Pricing page             | NOT STARTED |                |
| 4b    | FAQ page                 | NOT STARTED |                |
| 4c    | Contact page             | NOT STARTED |                |
| 4d    | About page               | NOT STARTED |                |
| 4e    | Classes page             | NOT STARTED |                |
| 4f    | Instructors page         | NOT STARTED |                |
| 5     | Booking calendar         | NOT STARTED |                |
| 6     | Full site grep pass      | NOT STARTED |                |
| 7     | Visual review and polish | NOT STARTED |                |
| 8     | Production deployment    | NOT STARTED |                |
| 9     | Auth/staff (deferred)    | DEFERRED    |                |

---

## END OF IMPLEMENTATION PLAN

## docs/IMPLEMENTATION_PLAN.md

## Corehouse Pilates Studio — Version 1.0
