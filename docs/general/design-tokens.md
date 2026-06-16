# Design Tokens — Corehouse Pilates Studio

This document defines a theme-ready token architecture for the website. It is a planning artifact, not a locked implementation. The current Warm Elegance palette is a provisional candidate, not a final brand commitment.

**Principle**: core tokens should stay stable while semantic and component layers can adapt to a chosen theme. Light-first implementation is fine, but the architecture should already support a future dark theme.

**Naming convention**: `{category}-{subcategory}-{variant}` for core tokens, with semantic aliases used by components.

---

## 1) Foundation / Core Tokens

Core tokens are the raw design values. They should be theme-agnostic and reusable across future theme variants.

### Color foundations

The current candidate palette uses warm neutrals and restrained accents.

```
color-neutral-0    = #ffffff
color-neutral-50   = #fffaf5
color-neutral-100  = #fef9f3
color-neutral-200  = #f8f4f0
color-neutral-300  = #e8e2da
color-neutral-400  = #d4cfc6
color-neutral-500  = #a89080
color-neutral-600  = #8b7d76
color-neutral-700  = #6b6360
color-neutral-800  = #3d3a35
color-neutral-900  = #2a2420

color-accent-50    = #fef4ed
color-accent-100   = #fadec8
color-accent-200   = #f4c9a8
color-accent-300   = #daa968
color-accent-400   = #c9a878
color-accent-500   = #b8945a
color-accent-600   = #a39079
```

If the direction changes later, adjust hue and saturation here without changing the token shape.

### Typography foundations

```
font-family-heading = 'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
font-family-body    = 'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
font-family-mono    = 'Menlo', 'Monaco', 'Courier New', monospace

text-h1 = 52px / 600 / 1.1 / -0.01em
text-h2 = 44px / 600 / 1.15 / -0.01em
text-h3 = 32px / 600 / 1.2 / 0em
text-h4 = 24px / 600 / 1.25 / 0em
text-h5 = 20px / 600 / 1.3 / 0em
text-h6 = 18px / 600 / 1.35 / 0em
text-body-lg = 18px / 400 / 1.6 / 0em
text-body-md = 16px / 400 / 1.6 / 0em
text-body-sm = 14px / 400 / 1.5 / 0.01em
text-button = 16px / 500 / 1.5 / 0.01em
text-label = 12px / 600 / 1.4 / 0.05em / uppercase
text-caption = 12px / 400 / 1.4 / 0em
```

### Space, radius, shadow, motion, and layout foundations

```
spacing-xs = 4px
spacing-sm = 8px
spacing-md = 16px
spacing-lg = 24px
spacing-xl = 32px
spacing-2xl = 48px
spacing-3xl = 64px
spacing-4xl = 80px
spacing-5xl = 96px
spacing-6xl = 128px

radius-sm = 4px
radius-md = 8px
radius-lg = 12px
radius-xl = 16px
radius-2xl = 24px
radius-full = 9999px

shadow-sm = subtle elevation
shadow-md = standard card elevation
shadow-lg = stronger card/overlay elevation
shadow-xl = modal/overlay elevation

transition-fast = 150ms ease-in-out
transition-base = 200ms ease-in-out
transition-standard = 300ms ease-in-out
transition-slow = 400ms ease-in-out

container-xl = 1200px
breakpoint-sm = 640px
breakpoint-md = 768px
breakpoint-lg = 1024px
breakpoint-xl = 1280px
breakpoint-2xl = 1536px
```

---

## 2) Semantic / Theme Tokens

Semantic tokens translate core values into theme-aware roles. Components should consume these tokens instead of raw values.

### Light theme semantic aliases

```
color-text-primary      = color-neutral-900
color-text-secondary    = color-neutral-600
color-text-disabled     = color-neutral-400
color-text-inverse      = color-neutral-50

color-bg-primary        = color-neutral-50
color-bg-secondary      = color-neutral-100
color-bg-tertiary       = color-neutral-200
color-bg-accent         = color-accent-50

color-border-primary    = color-neutral-300
color-border-secondary  = color-neutral-200
color-border-accent     = color-accent-300

color-action-primary    = color-accent-400
color-action-primary-hover = color-accent-500
color-action-secondary  = color-accent-300
color-action-secondary-hover = color-accent-400
```

### Theme readiness

- Keep the semantic names stable even if the chosen palette changes.
- Add a `theme-dark` mapping later that mirrors the same semantic roles.
- The dark theme should reuse the same component tokens whenever possible, changing only semantic mappings and a few surface values.
- Light-first implementation is acceptable, but the layer structure must already be ready for a dark variant.

### Semantic state tokens

```
color-success-light = #e8f5e9
color-success-main  = #66bb6a
color-success-dark  = #43a047

color-warning-light = #fff3e0
color-warning-main  = #ffa726
color-warning-dark  = #f57c00

color-error-light   = #ffebee
color-error-main    = #ef5350
color-error-dark    = #c62828

color-info-light    = #e3f2fd
color-info-main     = #42a5f5
color-info-dark     = #1565c0
```

---

## 3) Component Tokens

Component tokens describe intent-level patterns. They should stay relatively small until the component inventory is approved.

### Button tokens

- `button-primary`: filled CTA with strong text contrast
- `button-secondary`: outlined or softer CTA
- `button-ghost`: minimal emphasis, link-like action
- Each button token should define background, text, border, radius, spacing, and transition behavior

### Card tokens

- `card-default`: standard surface card
- `card-elevated`: stronger elevation for featured content
- `card-accent`: highlighted surface using accent or theme surface tokens

### Input tokens

- `input-default`: standard field surface
- `input-focus`: focus ring and border state
- `input-disabled`: muted, non-interactive state
- Validation states can be added later when form patterns are finalized

### Badge tokens

- `badge-default`: neutral or accent pill
- Optional semantic variants can mirror success, warning, error, and info roles

### Section and layout tokens

- `section-default`: standard vertical rhythm and container padding
- `section-accent`: tonal section treatment for highlighted content
- `container-default`: page-width wrapper token

### Component token guidance

- Do not encode every possible component state yet.
- Add detail only when the component inventory confirms that a state is needed.
- Keep the token surface small and predictable so the system can evolve cleanly.

---

## Architecture notes

- Core tokens should remain stable across themes.
- Semantic/theme tokens should absorb most visual changes.
- Component tokens should reference semantic tokens rather than raw hex values.
- Light and dark should share naming and structure even if the first build only ships light.

---

## Validation checklist

- Core values are defined for color, type, spacing, radius, shadow, motion, and layout.
- Semantic aliases exist for light theme usage.
- A dark theme mapping path is reserved.
- Component tokens are intent-level rather than fully over-specified.
- No component should depend on hard-coded brand assumptions that have not been approved.

---

## Next steps

1. Confirm the brand direction that should own the final palette.
2. Expand the component inventory before adding more component-specific tokens.
3. Use the approved token model to build the design test page specification and implementation.
