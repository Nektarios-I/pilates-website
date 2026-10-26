# Cancellation actor and calendar visibility

- date: 2026-10-26
- actor: cursor
- category: implementation
- topic: cancellation-actor
- branch: master
- commit: pending
- related plan: none
- related prompt: record the cancelling account and hide cancelled rows from the day-bookings calendar
- status: production database updated; site calendar change pending deploy

## Purpose

Store the signed-in account on every future booking cancellation, recover the account for older cancellations when it was already saved, and stop cancelled bookings from appearing on the day-bookings month calendar.

## Inputs / context used

`public.cancel_booking` in `supabase/40_recurring_materialize_failure_visibility.sql` was the live function. Recurring staff cancels already store the account on `recurring_prebook_skipped_occurrences.skipped_by`. Ordinary staff cancels did not store an account. The month calendar kept cancelled bookings visible and excluded them only from the active count. Cancelled class sessions were already excluded by the calendar query.

## Actions performed

Added `bookings.cancelled_by_user_id` and `bookings.cancellation_actor_note`. Replaced `cancel_booking` so it writes `auth.uid()` and leaves the note null. Backfilled client self-cancels from the booking owner, and recurring cancels from a unique skip account. Remaining cancelled rows received the note `Not recorded before 2026-10-26`. Applied that SQL to production project `xzlirjwzpmvugkbhtzxw`. The month calendar query and mapper now drop cancelled bookings. Not attended and no-show bookings stay visible. The day list still shows its separate cancelled roster.

## Files changed or inspected

- `supabase/46_cancellation_actor.sql`
- `src/features/bookings/month-calendar.ts`
- `src/features/bookings/month-calendar.test.ts`
- `src/app/(marketing)/staff/day-bookings/actions.ts`
- `src/app/(marketing)/staff/day-bookings/actions.test.ts`

## Commands run

- `npx vitest run src/features/bookings/month-calendar.test.ts src/app/(marketing)/staff/day-bookings/actions.test.ts`
- Supabase migration `cancellation_actor` on project `xzlirjwzpmvugkbhtzxw`
- Aggregate verification query on `public.bookings`

## Result

Production function now stores the cancelling account. Of 174 cancelled bookings: 69 backfilled from a recurring skip, 6 from a client self-cancel, 99 left without an account and marked unrecorded. `authenticated` can still execute `cancel_booking`. Cancelled class sessions in the database: 0.

## Verification

Vitest: 2 files, 32 tests passed. Production counts above match 69 + 6 + 99 = 174. The calendar change is in the app and is not on the live site until this commit is deployed.

## Blockers / risks

Docker was not running, so the SQL was applied through the Supabase migration API instead of the local recovery script. No new backup was taken immediately before the write. The change adds columns and replaces the existing cancel function; it does not delete bookings. Staff-made cancellations that were not recurring still have no stored account.

## Next recommended action

Deploy the calendar change to the production site.
