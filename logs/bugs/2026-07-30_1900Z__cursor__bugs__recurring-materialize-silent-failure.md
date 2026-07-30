# Recurring Materialization Failure Report — TEST TEST (Mon 06:00)

**Date:** 2026-07-30  
**Actor:** cursor  
**Category:** bugs  
**Client:** TEST TEST (`4d431242-594a-49ea-9506-cd44c9fa0b86`)  
**Rule:** “Test” — Monday 06:00 Reformer (active)

---

## 1. Executive summary

Automatic materialization **did work** for Mon 3 Aug and Mon 10 Aug. Those bookings were created by the daily cron ~14 days ahead, then **cancelled by staff** on 29 Jul. Rematerialize failed the next morning because the client had **no active reformer package**, and a **cron bug rolled back failure logs**, so the UI stayed **Planned / Slots OK** with no warning. Manual **Materialize Now** worked only after a new package was applied on 30 Jul afternoon.

This is not “cron never ran.” It is: success → staff cancel → package gap → silent rematerialize failure → UI looks healthy.

---

## 2. What you saw vs what actually happened

| Your observation | Reality |
| --- | --- |
| Forecast showed Mon 3 / Mon 10 as Planned + Slots OK | True at the time you looked (after cancel + after/near package renew) |
| No automatic bookings for those dates | True **at that moment**, but only after staff cancelled the earlier auto-bookings |
| Packages might have blocked it | **Yes for rematerialize** after 27 Jul; **not** for the original auto-creates |
| Materialize Now worked | Yes — at 18:52 UTC on 30 Jul, **after** the new 3‑month pack at 17:22 |

---

## 3. Confirmed timeline (production DB)

| When (UTC) | Event |
| --- | --- |
| **20 Jul 04:00** | Cron **auto-created** Aug 3 booking (`booking_source=recurring`, booked_at matches cron) |
| **20 Jul 08:21** | Reformer 1‑Month pack expires |
| **27 Jul 04:00** | Cron **auto-created** Aug 10 booking (Single Class pack still valid) |
| **27 Jul 12:37** | Single Class pack expires → **no active reformer package** |
| **29 Jul 04:00** | Cron OK (bookings still live) |
| **29 Jul 07:09** | **Staff cancelled both** Aug 3 and Aug 10 (`Cancelled by staff`). Cancel **deletes** materialization log rows → forecast returns to **Planned** |
| **30 Jul 04:00** | Cron rematerialize **FAILED**: `Client lacks active package credits…`. Entire cron job aborted; **failed log rows not persisted** |
| **30 Jul 17:22** | New Reformer 3‑Month pack applied (active) |
| **30 Jul 18:52** | Manual Materialize Now **succeeded** for Aug 3 + Aug 10 |

Packages for this client:

| Package | Status | Expires |
| --- | --- | --- |
| Reformer 1 Month 4×/week | expired | 20 Jul |
| Reformer Single Class | expired | 27 Jul |
| Reformer 3 Months 3×/week | **active** from 30 Jul 17:22 | 28 Oct |

Cron job `materialize-recurring-prebooks-daily` is **active** (`0 4 * * *` UTC). Horizon is **14 days**. Only the **30 Jul** run failed in this window.

---

## 4. Root causes

### A. Staff cancel removed the auto-bookings (proximate reason you saw empty)

Aug 3 and Aug 10 **were** auto-materialized. Someone cancelled them as staff on 29 Jul. Without that, TEST TEST would have had those bookings.

### B. Package gap blocked rematerialize (correct business rule)

From 27 Jul 12:37 until 30 Jul 17:22 there was no active reformer package. Rematerialize correctly refuses to book without credits.

### C. Silent failure bug (why there was no Warning / Failed status)

`private.materialize_recurring_occurrence` **RAISE**s on insufficient credits (migration 31). Daily cron `materialize_recurring_prebooks()` calls it **without** a per-occurrence exception handler. One failure aborts the whole transaction → any `failed` log update is rolled back → Attention / forecast never see a failure.

Confirmed: cron runid **95** failed with that exact error; no durable failed materialization logs remained for that attempt.

### D. Forecast “Planned / Slots OK” does not mean “already auto-booked”

- **Planned** = no live booked occurrence (includes never tried, cancelled with log deleted, or failed with no log).
- **Slots OK** = current active credits simulate OK **now** — not “cron succeeded,” not “package valid on class day,” not “last attempt failed.”

So after cancel + later package renew, the UI green-lights again even though morning cron had silently failed.

---

## 5. Answers to your questions

| Question | Answer |
| --- | --- |
| Was it because packages were expired? | **For rematerialize after cancel: yes.** For the original auto bookings: **no** — those succeeded while packages were still usable. |
| Why Planned/OK instead of Warning? | Cancel wiped success logs; cron failure didn’t persist failed logs; forecast only looks at **current** credits. |
| Why Materialize Now worked? | Ran **after** the new package was applied. |
| Is auto materialize broken entirely? | Cron runs daily and succeeded on other days. The broken part is **silent failure + cancel erasing history**. |

---

## 6. Product gap you identified (agree)

Clients and owners need visibility when recurring reservation fails or is pending. Today:

- Staff can see Planned/Slots OK that overstates health.
- Clients have **no** account view of planned recurring slots or failures.
- Owner is not notified when the daily cron job fails.

---

## 7. Recommended next actions (for approval)

### P0 — Fix silent cron failures (database)

Catch per-occurrence errors inside `materialize_recurring_prebooks()` so:

- a failed occurrence writes a durable `status=failed` log and continues
- other clients still materialize
- Attention / forecast can show **Not enough slots** / Failed

### P0 — Keep audit on cancel (database)

Stop deleting materialization logs on cancel. Mark them cancelled / clear `booking_id` so rematerialize can retry with history, and UI can show “Cancelled — awaiting retry” instead of looking never-tried.

### P1 — Owner notification

When daily cron fails (`cron.job_run_details`) or when materialize fails for insufficient credits, surface it in staff Attention (and optionally email later).

### P1 — Client account: Planned slots section/tab (product)

Add on Account, above or beside Upcoming bookings:

| When | Class | Status | Credits |
| --- | --- | --- | --- |
| Mon 3 Aug, 06:00–07:00 | Reformer | Planned / Booked / Needs attention | OK / Not enough / Package expired |

Calm copy: e.g. “Usually reserved about two weeks ahead.” Link to pricing when blocked. No raw staff error codes.

### P2 — Clearer staff forecast semantics

Don’t treat “Slots OK” as “will auto-book.” Prefer states like:

- Planned (waiting for auto-reserve)
- Booked
- Needs attention (not enough credits)
- Cancelled — will retry / skipped

Optionally simulate credits against **class date**, not only `now()`.

### P2 — Policy choice after staff cancel

Confirm whether cancelled recurring bookings should:

1. Auto-retry (current intent after log delete), or  
2. Stay cancelled until Materialize Now / explicit skip

---

## 8. Suggested implementation order (if you approve)

1. **DB fix:** cron exception handling + durable cancel history  
2. **Staff UI:** Attention shows failed rematerialize; forecast warning when no active package  
3. **Client Account:** Planned slots section (status + plain-language reason)  
4. Tests for cron continue-on-failure and cancel-log retention  

---

## 9. Open questions before coding

1. Why were Aug 3 and Aug 10 cancelled by staff on 29 Jul — intentional test, or accidental?  
2. After staff cancel of a recurring booking, should the system **auto-retry**, require **Materialize Now**, or **skip**?  
3. Approve client Account “Planned slots” as a new section now (recommended), or staff-only first?  
4. Should package expiry **before the class date** force Warning even if credits exist today?

---

## 10. Manual steps

No code was changed in this investigation. Review this report and tell me which actions (P0–P2) to implement.
