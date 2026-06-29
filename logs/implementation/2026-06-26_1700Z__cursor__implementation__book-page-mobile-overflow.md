---
date: 2026-06-26 17:00Z
actor: cursor
category: implementation
topic: book-page-mobile-overflow
related prompt: Fix book page horizontal overflow and header/footer width on mobile zoom
status: completed
---

## Purpose

Fix mobile book page feeling "zoomed in" with horizontal scrolling, and ensure header/footer always span full screen width.

## Root cause

- Month calendar view rendered 42 day buttons in a single horizontal `flex w-max` row (~3000px+), expanding page width beyond the viewport.
- Grid children lacked `min-w-0`, so internal scroll containers could not constrain overflow.
- Wide page content caused header/footer `w-full` to match document width inconsistently when zoomed.

## Fixes

- **booking-calendar.tsx**: Week view keeps a contained horizontal day strip; month view uses a 7-column grid. Added `min-w-0` / `max-w-full` containment on calendar root and controls.
- **book/page.tsx**: `min-w-0` on grid columns.
- **globals.css**, **layout.tsx**, **page-shell.tsx**: `overflow-x: hidden` and width constraints on `html`/`body`/`main`.
- **site-header-view.tsx**, **site-footer.tsx**: `max-w-full` on shell elements.
- **layout.tsx**: Explicit `viewport` export (`device-width`, `initialScale: 1`).

## Verification

- `e2e/navigation.spec.ts` overflow test — pass on `mobile-390` (includes `/book`)
- `npm run lint` — pass
- `npx tsc --noEmit` — pass
