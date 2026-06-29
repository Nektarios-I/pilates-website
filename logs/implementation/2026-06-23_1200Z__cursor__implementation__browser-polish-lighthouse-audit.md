---
date: 2026-06-23 12:00Z
actor: cursor
category: implementation
topic: browser-polish-lighthouse-audit
branch: (working tree)
related prompt: Browser-polish and Lighthouse audit for public marketing pages
status: completed
---

## Purpose

Audit Homepage, Contact, Pricing, and FAQ with DevTools + Lighthouse; apply only high-value pre-launch polish fixes (accessibility, contrast, touch targets, semantics) without redesign or architecture changes.

## Audit scope

- Public marketing pages only: `/`, `/contact`, `/pricing`, `/faq`
- Mobile-first DevTools inspection (390px) + Lighthouse (mobile then desktop)
- Excluded: auth/staff/admin routes, Motion, speculative redesign

## Lighthouse — before fixes (dev server)

| Page | Mobile perf | Mobile a11y | Desktop perf | Desktop a11y |
|------|-------------|-------------|--------------|--------------|
| Home | 39 | 96 | 63 | 96 |
| Contact | 57 | 100 | 86 | 96 |
| Pricing | 67 | 100 | 97 | 95 |
| FAQ | — | — | — | — |

## Lighthouse — after fixes (accessibility-only re-run)

| Page | Mobile a11y | Desktop a11y |
|------|-------------|--------------|
| Home | 100 | 100 |
| Contact | 100 | 100 |
| Pricing | 100 | 100 |
| FAQ | 100 | 100 |

Performance scores unchanged (dev-mode artifacts; defer until production build).

## Issues fixed

1. Active nav link `text-accent` on cream background (~2.12:1) → `text-foreground` with accent dot retained
2. Preview card meta `opacity-70` (~4.23:1) → `opacity-80`
3. Logo link `aria-label` / visible text mismatch → removed redundant labels; wordmark no longer `aria-hidden`
4. Ghost button and inline links below 44px touch target → `min-h-11` + focus rings (homepage, contact, FAQ, shared Button)
5. Contact form semantics → `aria-labelledby`, `aria-live="polite"` on status messages
6. Homepage testimonial attribution contrast on dark band → `text-primary-foreground/80`

## Deferred (not worth fixing pre-launch)

- Dev-mode performance (TTFB, unminified JS, unused JS, main-thread work)
- Source maps, bf-cache, legacy JS Lighthouse insights
- Footer hover accent on inverse background (hover-only, minor)
- Full performance Lighthouse pass on production build

## Files changed

- `src/components/layout/site-navigation.tsx`
- `src/components/layout/site-footer.tsx`
- `src/components/layout/studio-logo.tsx`
- `src/components/layout/site-header.test.tsx`
- `src/components/brand/corehouse-logo.tsx`
- `src/components/sections/preview-card.tsx`
- `src/components/sections/contact-form.tsx`
- `src/components/ui/button.tsx`
- `src/app/(marketing)/page.tsx`
- `src/app/(marketing)/contact/page.tsx`
- `src/app/(marketing)/faq/page.tsx`

## Verification

- `npm run lint` — pass
- `npx tsc --noEmit` — pass
- `site-header.test.tsx` — 3/3 pass
- Lighthouse accessibility — 100 on all four pages (mobile + desktop)
- DevTools 390px — no horizontal overflow on audited pages

## Next recommended action

- Run full Lighthouse (all categories) against a production build before owner sign-off
- Optional: footer link hover token tweak if owner wants accent on inverse
