# Login / slots copy rename + cron migration 35

**Date:** 2026-07-11  
**Actor:** cursor  
**Category:** implementation  

## What changed

- User-facing **Sign in → Login** across marketing, auth, staff invite, middleware, tests, e2e.
- User-facing **tokens → slots** in recurring staff UI (`format.ts`, materialize dialog, recurring tab, RPC error copy).
- Added **`supabase/35_cron_materialize_live_booking_check.sql`** — cron uses `recurring_log_has_active_booking` skip guard.
- Updated **`supabase/README.md`** with migrations 30–35.

## Verification

- lint: pass  
- test: 205 passed  
- build: pass  

## Next action

Apply migration 35 in Supabase; see `logs/review/2026-07-11_1318Z__cursor__review__production-readiness-audit.md`.
