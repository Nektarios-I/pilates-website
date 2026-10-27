# Recurring Prebooks UI + Materialize Defaults — Planning

- date: 2026-10-27
- actor: cursor
- category: planning
- topic: recurring-prebooks-ui-materialize-defaults
- related prompt: Client Booking Manager recurring rules overview + Recurring Prebooks visual separation + Materialize Now credit-aware defaults and quick-select counts
- status: discovery complete; awaiting answers before implementation

## Summary

Staff Client Booking Manager (`/staff/client-bookings`) currently requires a client before any recurring work. Recurring Prebooks sections (create / materialize / existing rules) share the same visual treatment. Materialize Now selects every occurrence in the three-month window by default, including rows already marked `insufficient_tokens`, then blocks confirm.

Backend already walks occurrences earliest→latest and depletes reformer/mat credit pools (`list_client_materializable_occurrences` in migration 42). Default selection can largely be driven from existing `token_health` without a new SQL migration, unless product rules need category-filtered quick-select or explicit remaining-credit totals in the UI.

Cross-client “active recurring rules by client” overview needs a new staff-facing data path; current RPCs are per-client only.

## Next recommended action

Answer clarifying questions in the planning chat, then implement in this order: (1) RecurringTab visual separation + day emphasis, (2) Materialize dialog selection defaults + quick-select, (3) cross-client recurring rules accordion.
