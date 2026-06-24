# Corehouse — Design Diagnosis and Problem Checklist

## Problems to fix (check off as implemented)

- [ ] Wall of bordered cards — replace with color shifts and whitespace
- [ ] Timid typographic scale — apply locked scale strictly
- [ ] Stark pure black sections — replace with #2D3A1F
- [ ] Clinical booking UI — use pill-based calendar
- [ ] No image placeholders — allocate aspect-ratio slots everywhere
- [ ] Weak pricing hierarchy — make price the visual anchor
- [ ] Undifferentiated CTAs — apply primary/secondary/tertiary system
- [ ] Cramped padding — minimum p-6, prefer p-8
- [ ] Unanchored footer — use #2D3A1F background as visual terminus
- [ ] Broken placeholder states — style all WIP states intentionally

## What must NOT change

- Warm off-white/parchment background as page base
- Core grid structures (3-col, 4-col grids are sound)
- Top navigation structure
- Minimalist intent — refinement not decoration
- Native HTML elements styled with Tailwind

## Priority fix order

1. Typography tokens + color tokens wired into codebase
2. Section Wrapper + Image Placeholder Block
3. Navigation Header
4. Homepage Hero
5. Homepage sections in sequence
6. Footer
7. Inner pages
8. Booking Calendar UI (most complex, do last)
