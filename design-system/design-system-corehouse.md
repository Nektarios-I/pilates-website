# Corehouse Pilates Studio — Design System

## IMPLEMENTATION WIRING (complete this before touching any component)

### Step 1 — app/layout.tsx

Add this exact import and font configuration at the top of the file,
below any existing imports:

import { Fraunces, Sora } from 'next/font/google'

const fraunces = Fraunces({
subsets: ['latin'],
variable: '--font-serif',
display: 'swap',
axes: ['WONK', 'opsz'],
})

const sora = Sora({
subsets: ['latin'],
variable: '--font-sans',
display: 'swap',
weight: ['400', '500', '600', '700'],
})

On the html element inside the RootLayout return, add both variables
to the className:

<html lang="en" className={`${fraunces.variable} ${sora.variable}`}>

Do not change anything else in layout.tsx.

### Step 2 — app/globals.css

Add this block inside or alongside the existing @theme directive.
If @theme already exists, add these variables inside it.
If it does not exist yet, create it:

@theme {
--color-background: #F4F1E8;
--color-text: #2D3A1F;
--color-primary: #2D3A1F;
--color-accent: #B8A678;
--color-surface: #E8E2D0;
--color-border: #CDD2C9;
}

Add these base body styles below the @theme block:

body {
background-color: #F4F1E8;
color: #2D3A1F;
font-family: var(--font-sans);
}

### Step 3 — Tailwind fontFamily (only if needed)

After wiring Steps 1 and 2, open the browser and inspect any element
that uses font-serif or font-sans.
If Fraunces and Sora are not rendering, add this to the Tailwind config
under theme.extend:

fontFamily: {
serif: ['var(--font-serif)', 'Georgia', 'serif'],
sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
}

If the fonts render correctly after Steps 1 and 2, skip Step 3.

### Verification checkpoint

Before touching any component, verify in the browser:

- Any element with font-serif renders in Fraunces (variable, slightly
  organic serif).
- Any element with font-sans renders in Sora (clean geometric sans).
- Page background is #F4F1E8 (warm parchment, not white).
- Body text color is #2D3A1F (deep forest green, not black).
  Only proceed to component implementation after this passes.

---

## Font Pairing

SECTION 1 — FONT PAIRING DECISION
Recommended: CANDIDATE A — Fraunces + Sora
Why it fits Corehouse:
Fraunces is the "soul" of this brand; its variable "wonky" axis and soft, old-style serifs evoke a human, artisanal quality that perfectly captures the "Tactile" in your brief. Unlike standard luxury serifs, it feels approachable and rhythmic, mimicking the controlled, breath-led movement of Pilates. Sora provides the necessary "Calm" and structural balance; its subtle ink traps and geometric clarity ensure the UI feels modern and premium, preventing the site from feeling like a dusty editorial piece. This pairing communicates "Boutique Cyprus Studio" — a blend of Mediterranean warmth and high-end professional instruction.
Rejected Candidates:
Candidate B: Too "safe" and corporate; it risks making a premium studio feel like a generic franchise or a hotel gym.
Candidate C: The stroke contrast is too high and "fragile," making the brand feel like a high-fashion spa rather than an active movement space.

## Brand Direction

SECTION 5 — FINAL BRAND DIRECTION SUMMARY
Design Brief: Corehouse Pilates Studio
Corehouse is a premium movement sanctuary in Cyprus that balances technical precision with Mediterranean warmth. The brand identity must move away from the "SaaS dashboard" aesthetic of modern fitness apps and toward a "Tactile Calm" editorial experience.
Keywords: Rhythmic, Earthy, Intentional, Breathable, Artisanal.
Visual Language: High use of whitespace (breath), large-scale serif typography, and organic shapes. Instead of hard-bordered boxes, use depth through subtle color shifts (#E8E2D0 on #F4F1E8) and soft, natural shadows. Photography should be warm-toned, featuring movement and architectural details of the studio.
Typography Role: Fraunces (Serif) is the "Voice" — it handles all emotional and editorial storytelling. Sora (Sans) is the "Guide" — it handles all functional UI and body information.
Color Role: The Deep Forest Green (#2D3A1F) replaces black to provide a softer, premium contrast. The Muted Gold (#B8A678) acts as a "sunlight" accent, used only for the most important actions.
Anti-Patterns: No pure black (#000), no sharp 90-degree corners on large containers, no heavy drop shadows, and no "grid of boxes" layouts.
Implementation Mantra: "If it feels like a software app, add more whitespace and a larger serif; if it feels too quiet, add a Sora-labeled CTA."
Sources

## Color Palette

SECTION 2 — COLOR PALETTE DECISION
Recommended: PALETTE 1 — FieldNote
This palette is grounded in 2026's "Neutral Iced Matcha" and "Hand-crafted Calm" trends. It moves away from the cold, clinical whites of the 2010s toward a biophilic, restorative environment.[1]
Background (#F4F1E8 — Warm Parchment): The foundation.[2] It provides a soft, non-glare surface that feels like a physical space rather than a screen.[1]
Text/Primary (#2D3A1F — Deep Forest Green): Used for all headings and body text. It is softer than black but carries more authority and "natural luxury" than grey.
Accent (#B8A678 — Muted Gold): Used exclusively for high-signal elements (Primary CTAs, active nav states). It provides a "sun-drenched" Mediterranean highlight.
Surface (#E8E2D0 — Warm Cream): Used for subtle card backgrounds. Surface (#E8E2D0) is always applied as a solid background color.
Use bg-[#E8E2D0] with no opacity modifier and no blur.
The tonal difference between #F4F1E8 and #E8E2D0 is sufficient to
create depth without borders, opacity tricks, or shadows.
Border (#CDD2C9 — Sage-Grey): Used sparingly for hairline dividers. It is a botanical grey that disappears into the background, reducing visual noise.

## Typography Scale

SECTION 3 — COMPLETE TYPOGRAPHIC SCALE
Implemented for Tailwind CSS v4 using rem values.
Level Font Weight Size (px/rem) Line-Height Letter-Spacing Tailwind Class String Usage Rule
Hero Fraunces 700 80px / 5rem 1.1 -0.02em font-serif font-bold text-5xl md:text-8xl leading-[1.1] tracking-tight Homepage main headline only.
H1 Fraunces 600 48px / 3rem 1.2 -0.01em font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight Page titles (About, Schedule).
H2 Fraunces 500 36px / 2.25rem 1.3 0 font-serif font-medium text-2xl md:text-4xl leading-snug Major section headings.
H3 Fraunces 500 24px / 1.5rem 1.4 0 font-serif font-medium text-xl md:text-2xl leading-normal Card titles and sub-sections.
Body Lg Sora 400 20px / 1.25rem 1.7 0 font-sans text-lg md:text-xl leading-relaxed Intro paragraphs/lead-ins.
Body Reg Sora 400 17px / 1.06rem 1.8 0.01em font-sans text-[17px] leading-relaxed Standard paragraph text.
Body Sm Sora 400 14px / 0.875rem 1.6 0.02em font-sans text-sm leading-normal Helper text, descriptions.
Label/UI Sora 600 13px / 0.81rem 1 0.12em font-sans font-semibold text-[13px] uppercase tracking-widest Buttons, Nav, Form labels.
Tag Sora 500 12px / 0.75rem 1 0.05em font-sans font-medium text-xs tracking-wide Category pills, timestamps.
Micro Sora 400 11px / 0.68rem 1.4 0 font-sans text-[11px] opacity-70 Legal, footer fine print.

## Button and CTA System

SECTION 4 — BUTTON AND CTA TYPOGRAPHY
Primary Button:
Text: font-sans font-semibold text-[13px] uppercase tracking-widest text-[#F4F1E8]
Container: bg-[#2D3A1F] px-8 py-4 rounded-full transition-all hover:bg-[#B8A678]
Secondary Button:
Text: font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F]
Container: border border-[#CDD2C9] px-8 py-4 rounded-full hover:bg-[#E8E2D0]
Text Link (Inline):
Text: font-sans font-medium border-b border-[#B8A678] pb-0.5 hover:text-[#B8A678] transition-colors
Nav Item:
Default: font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] opacity-80 hover:opacity-100
Active: text-[#B8A678] opacity-100 (Add a small 4px dot below active item).

## Anti-patterns

No pure black. No sharp corners on large containers. No heavy shadows.
No grid of bordered boxes. No SaaS-style form layouts.

## Implementation Mantra

"If it feels like a software app, add more whitespace and a larger serif;
if it feels too quiet, add a Sora-labeled CTA."
