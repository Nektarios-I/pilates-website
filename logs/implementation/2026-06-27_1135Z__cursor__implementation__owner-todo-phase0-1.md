---
date: 2026-06-27 11:35Z
actor: cursor
category: implementation
topic: owner-todo-phase0-1
related prompt: Owner TODO phased implementation — discovery, Phase 0 baseline, Phase 1 prices + class minutes
status: phase-1-complete
---

## Phase 0 baseline

- `npm run lint` — pass
- `npx tsc --noEmit` — pass
- `npm test -- --run` — 62/64 pass; 2 pre-existing failures (footer aria-label test, indexing sitemap count)

## Phase 1 implemented

- Updated reformer 3-month prices in `site_content.ts`: €265 / €400 / €520
- Updated homepage pricing preview plan (3 months · 2×/week): €265
- Removed visible class minutes from homepage + classes page card meta (level + capacity only)
- Preserved `duration` field in config and all booking/session-card duration logic

## Next

- Phase 2: sign-in slowness investigation
- Phase 3: account mirror table
- Phase 4: admin/owner booking history page
- Phase 5: instructor/owner/admin day-bookings page
