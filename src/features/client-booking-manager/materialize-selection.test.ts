import { describe, expect, it } from 'vitest';

import { materializable_occurrence_key } from '@/features/client-booking-manager/format';
import {
  build_credit_based_default_selection,
  evaluate_selection_funding,
  occurrence_matches_scope,
  QUICK_SELECT_COUNTS,
  try_quick_select_sessions,
  type MaterializeCreditPools,
  type SelectableMaterializeOccurrence,
} from '@/features/client-booking-manager/materialize-selection';

function occ(
  partial: Partial<SelectableMaterializeOccurrence> & {
    rule_id: string;
    occurrence_date: string;
    start_time: string;
    occurrence_starts_at: string;
  },
): SelectableMaterializeOccurrence {
  const start_time = partial.start_time;
  return {
    rule_id: partial.rule_id,
    rule_label: partial.rule_label ?? 'Rule',
    session_card_title: partial.session_card_title ?? 'Class',
    schedule_line_id: partial.schedule_line_id ?? `line-${partial.rule_id}`,
    occurrence_date: partial.occurrence_date,
    start_time,
    occurrence_starts_at: partial.occurrence_starts_at,
    booking_state: partial.booking_state ?? 'planned',
    token_health: partial.token_health ?? null,
    failure_message: partial.failure_message ?? null,
    reformer_credits_required: partial.reformer_credits_required ?? 1,
    mat_credits_required: partial.mat_credits_required ?? 0,
  };
}

function key_of(row: SelectableMaterializeOccurrence): string {
  return materializable_occurrence_key(row.rule_id, row.occurrence_date, row.start_time);
}

const pools_9_reformer: MaterializeCreditPools = { reformer: 9, mat: 0 };
const pools_mixed: MaterializeCreditPools = { reformer: 2, mat: 1 };

describe('materialize-selection helpers', () => {
  it('exposes the approved quick-select session counts', () => {
    expect(QUICK_SELECT_COUNTS).toEqual([8, 12, 16, 24, 36, 48]);
  });

  it('selects the first 9 one-credit reformer sessions when pools total 9', () => {
    const rows = Array.from({ length: 12 }, (_, index) => {
      const day = String(index + 1).padStart(2, '0');
      return occ({
        rule_id: 'rule-r',
        occurrence_date: `2026-08-${day}`,
        start_time: '09:00:00',
        occurrence_starts_at: `2026-08-${day}T06:00:00.000Z`,
        reformer_credits_required: 1,
        mat_credits_required: 0,
      });
    });

    const selected = build_credit_based_default_selection(rows, pools_9_reformer);
    expect(selected.size).toBe(9);
    expect([...selected]).toEqual(rows.slice(0, 9).map(key_of));
  });

  it('does not treat reformer and mat credits as interchangeable', () => {
    const rows = [
      occ({
        rule_id: 'rule-r',
        occurrence_date: '2026-08-03',
        start_time: '09:00:00',
        occurrence_starts_at: '2026-08-03T06:00:00.000Z',
        reformer_credits_required: 1,
        mat_credits_required: 0,
      }),
      occ({
        rule_id: 'rule-m',
        occurrence_date: '2026-08-04',
        start_time: '10:00:00',
        occurrence_starts_at: '2026-08-04T07:00:00.000Z',
        reformer_credits_required: 0,
        mat_credits_required: 1,
      }),
    ];

    const selected = build_credit_based_default_selection(rows, { reformer: 5, mat: 0 });
    expect(selected).toEqual(new Set([key_of(rows[0]!)]));
  });

  it('honours multi-credit session requirements', () => {
    const rows = [
      occ({
        rule_id: 'rule-r',
        occurrence_date: '2026-08-03',
        start_time: '09:00:00',
        occurrence_starts_at: '2026-08-03T06:00:00.000Z',
        reformer_credits_required: 2,
        mat_credits_required: 0,
      }),
      occ({
        rule_id: 'rule-r',
        occurrence_date: '2026-08-10',
        start_time: '09:00:00',
        occurrence_starts_at: '2026-08-10T06:00:00.000Z',
        reformer_credits_required: 2,
        mat_credits_required: 0,
      }),
    ];

    const selected = build_credit_based_default_selection(rows, { reformer: 3, mat: 0 });
    expect(selected).toEqual(new Set([key_of(rows[0]!)]));
  });

  it('starts with nothing selected when no eligible credits exist', () => {
    const rows = [
      occ({
        rule_id: 'rule-r',
        occurrence_date: '2026-08-03',
        start_time: '09:00:00',
        occurrence_starts_at: '2026-08-03T06:00:00.000Z',
      }),
    ];

    const selected = build_credit_based_default_selection(rows, { reformer: 0, mat: 0 });
    expect(selected.size).toBe(0);
  });

  it('keeps package-expiry blocked rows unchecked even when credits remain', () => {
    const rows = [
      occ({
        rule_id: 'rule-r',
        occurrence_date: '2026-08-03',
        start_time: '09:00:00',
        occurrence_starts_at: '2026-08-03T06:00:00.000Z',
        token_health: 'package_expires_before',
      }),
      occ({
        rule_id: 'rule-r',
        occurrence_date: '2026-08-10',
        start_time: '09:00:00',
        occurrence_starts_at: '2026-08-10T06:00:00.000Z',
      }),
    ];

    const selected = build_credit_based_default_selection(rows, { reformer: 5, mat: 0 });
    expect(selected).toEqual(new Set([key_of(rows[1]!)]));
  });

  it('recalculates funding when earlier selected rows are deselected', () => {
    const rows = Array.from({ length: 4 }, (_, index) => {
      const day = String(index + 3).padStart(2, '0');
      return occ({
        rule_id: 'rule-r',
        occurrence_date: `2026-08-${day}`,
        start_time: '09:00:00',
        occurrence_starts_at: `2026-08-${day}T06:00:00.000Z`,
      });
    });

    const early_only = new Set(rows.slice(0, 2).map(key_of));
    const early_funding = evaluate_selection_funding(rows, early_only, { reformer: 2, mat: 0 });
    expect(early_funding.get(key_of(rows[2]!))?.fundable).toBe(false);

    const later_only = new Set(rows.slice(2, 4).map(key_of));
    const later_funding = evaluate_selection_funding(rows, later_only, { reformer: 2, mat: 0 });
    expect(later_funding.get(key_of(rows[2]!))?.fundable).toBe(true);
    expect(later_funding.get(key_of(rows[3]!))?.fundable).toBe(true);
  });

  it('matches class scopes without inventing new categories', () => {
    const reformer = occ({
      rule_id: 'r',
      occurrence_date: '2026-08-03',
      start_time: '09:00:00',
      occurrence_starts_at: '2026-08-03T06:00:00.000Z',
      reformer_credits_required: 1,
      mat_credits_required: 0,
    });
    const mat = occ({
      rule_id: 'm',
      occurrence_date: '2026-08-04',
      start_time: '09:00:00',
      occurrence_starts_at: '2026-08-04T06:00:00.000Z',
      reformer_credits_required: 0,
      mat_credits_required: 1,
    });
    const mixed = occ({
      rule_id: 'x',
      occurrence_date: '2026-08-05',
      start_time: '09:00:00',
      occurrence_starts_at: '2026-08-05T06:00:00.000Z',
      reformer_credits_required: 1,
      mat_credits_required: 1,
    });

    expect(occurrence_matches_scope(reformer, 'all')).toBe(true);
    expect(occurrence_matches_scope(reformer, 'reformer')).toBe(true);
    expect(occurrence_matches_scope(reformer, 'mat')).toBe(false);
    expect(occurrence_matches_scope(mat, 'mat')).toBe(true);
    expect(occurrence_matches_scope(mixed, 'reformer')).toBe(true);
    expect(occurrence_matches_scope(mixed, 'mat')).toBe(true);
  });

  it('applies successful quick-select for exactly N earliest fundable sessions', () => {
    const rows = Array.from({ length: 20 }, (_, index) => {
      const day = String(index + 1).padStart(2, '0');
      return occ({
        rule_id: 'rule-r',
        occurrence_date: `2026-08-${day}`,
        start_time: '09:00:00',
        occurrence_starts_at: `2026-08-${day}T06:00:00.000Z`,
      });
    });

    const prior = build_credit_based_default_selection(rows, { reformer: 10, mat: 0 });
    const result = try_quick_select_sessions({
      occurrences: rows,
      pools: { reformer: 10, mat: 0 },
      scope: 'all',
      requested_count: 8,
      current_selection: prior,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.selection.size).toBe(8);
    expect([...result.selection]).toEqual(rows.slice(0, 8).map(key_of));
  });

  it('aborts quick-select and preserves prior selection when credits cannot fund N', () => {
    const rows = Array.from({ length: 20 }, (_, index) => {
      const day = String(index + 1).padStart(2, '0');
      return occ({
        rule_id: 'rule-r',
        occurrence_date: `2026-08-${day}`,
        start_time: '09:00:00',
        occurrence_starts_at: `2026-08-${day}T06:00:00.000Z`,
      });
    });

    const prior = build_credit_based_default_selection(rows, { reformer: 5, mat: 0 });
    const result = try_quick_select_sessions({
      occurrences: rows,
      pools: { reformer: 5, mat: 0 },
      scope: 'all',
      requested_count: 8,
      current_selection: prior,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('insufficient_credits');
    expect(result.available_count).toBe(5);
    expect(result.requested_count).toBe(8);
    expect(result.selection).toEqual(prior);
  });

  it('aborts quick-select when too few eligible sessions exist in the period', () => {
    const rows = Array.from({ length: 3 }, (_, index) => {
      const day = String(index + 1).padStart(2, '0');
      return occ({
        rule_id: 'rule-r',
        occurrence_date: `2026-08-${day}`,
        start_time: '09:00:00',
        occurrence_starts_at: `2026-08-${day}T06:00:00.000Z`,
      });
    });

    const prior = new Set([key_of(rows[0]!)]);
    const result = try_quick_select_sessions({
      occurrences: rows,
      pools: { reformer: 100, mat: 0 },
      scope: 'all',
      requested_count: 8,
      current_selection: prior,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('insufficient_dates');
    expect(result.available_count).toBe(3);
    expect(result.selection).toEqual(prior);
  });

  it('preserves outside-scope selections during category quick-select', () => {
    const reformer_rows = Array.from({ length: 10 }, (_, index) => {
      const day = String(index + 1).padStart(2, '0');
      return occ({
        rule_id: 'rule-r',
        occurrence_date: `2026-08-${day}`,
        start_time: '09:00:00',
        occurrence_starts_at: `2026-08-${day}T06:00:00.000Z`,
        reformer_credits_required: 1,
        mat_credits_required: 0,
      });
    });
    const mat_row = occ({
      rule_id: 'rule-m',
      occurrence_date: '2026-08-15',
      start_time: '10:00:00',
      occurrence_starts_at: '2026-08-15T07:00:00.000Z',
      reformer_credits_required: 0,
      mat_credits_required: 1,
    });
    const rows = [...reformer_rows, mat_row];
    const prior = new Set([key_of(mat_row), ...reformer_rows.slice(0, 2).map(key_of)]);

    const result = try_quick_select_sessions({
      occurrences: rows,
      pools: pools_mixed,
      scope: 'reformer',
      requested_count: 2,
      current_selection: prior,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.selection.has(key_of(mat_row))).toBe(true);
    expect(result.selection.size).toBe(3);
  });

  it('uses stable chronological ordering with rule_id tie-break', () => {
    const a = occ({
      rule_id: 'rule-a',
      occurrence_date: '2026-08-03',
      start_time: '09:00:00',
      occurrence_starts_at: '2026-08-03T06:00:00.000Z',
    });
    const b = occ({
      rule_id: 'rule-b',
      occurrence_date: '2026-08-03',
      start_time: '09:00:00',
      occurrence_starts_at: '2026-08-03T06:00:00.000Z',
    });

    const selected = build_credit_based_default_selection([b, a], { reformer: 1, mat: 0 });
    expect([...selected]).toEqual([key_of(a)]);
  });
});
