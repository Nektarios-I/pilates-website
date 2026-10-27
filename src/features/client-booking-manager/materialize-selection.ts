import { materializable_occurrence_key } from '@/features/client-booking-manager/format';
import type {
  MaterializableOccurrence,
  RecurringTokenHealth,
} from '@/features/client-booking-manager/types';

/** Matches private.client_simulated_credit_pool unlimited sentinel. */
export const UNLIMITED_CREDIT_POOL = 1_000_000;

export const QUICK_SELECT_COUNTS = [8, 12, 16, 24, 36, 48] as const;

export type QuickSelectCount = (typeof QUICK_SELECT_COUNTS)[number];

export type MaterializeClassScope = 'all' | 'reformer' | 'mat';

export type MaterializeCreditPools = {
  reformer: number;
  mat: number;
};

export type SelectableMaterializeOccurrence = MaterializableOccurrence & {
  reformer_credits_required: number;
  mat_credits_required: number;
};

export type SelectionFundingStatus = {
  fundable: boolean;
  reason: RecurringTokenHealth | null;
};

export type QuickSelectSuccess = {
  ok: true;
  selection: Set<string>;
};

export type QuickSelectFailure = {
  ok: false;
  code: 'insufficient_credits' | 'insufficient_dates';
  message: string;
  available_count: number;
  requested_count: number;
  selection: Set<string>;
};

export type QuickSelectResult = QuickSelectSuccess | QuickSelectFailure;

export function occurrence_selection_key(row: Pick<
  MaterializableOccurrence,
  'rule_id' | 'occurrence_date' | 'start_time'
>): string {
  return materializable_occurrence_key(row.rule_id, row.occurrence_date, row.start_time);
}

export function is_hard_blocked_occurrence(row: SelectableMaterializeOccurrence): boolean {
  return row.token_health === 'package_expires_before';
}

export function occurrence_matches_scope(
  row: SelectableMaterializeOccurrence,
  scope: MaterializeClassScope,
): boolean {
  if (scope === 'all') return true;
  if (scope === 'reformer') return (row.reformer_credits_required ?? 0) > 0;
  return (row.mat_credits_required ?? 0) > 0;
}

export function sort_materialize_occurrences<T extends SelectableMaterializeOccurrence>(
  rows: readonly T[],
): T[] {
  return [...rows].sort((a, b) => {
    const starts = a.occurrence_starts_at.localeCompare(b.occurrence_starts_at);
    if (starts !== 0) return starts;
    return a.rule_id.localeCompare(b.rule_id);
  });
}

function can_allocate(
  pools: MaterializeCreditPools,
  reformer_required: number,
  mat_required: number,
): boolean {
  if (reformer_required > 0 && pools.reformer < reformer_required) return false;
  if (mat_required > 0 && pools.mat < mat_required) return false;
  return true;
}

function allocate(
  pools: MaterializeCreditPools,
  reformer_required: number,
  mat_required: number,
): MaterializeCreditPools {
  return {
    reformer: pools.reformer - (reformer_required > 0 ? reformer_required : 0),
    mat: pools.mat - (mat_required > 0 ? mat_required : 0),
  };
}

/**
 * Selection-aware funding: only selected rows consume credits, in chronological order.
 * Matches the intended staff Materialize Now validation (selected-only allocation).
 */
export function evaluate_selection_funding(
  occurrences: readonly SelectableMaterializeOccurrence[],
  selected_keys: ReadonlySet<string>,
  pools: MaterializeCreditPools,
): Map<string, SelectionFundingStatus> {
  const result = new Map<string, SelectionFundingStatus>();
  let remaining: MaterializeCreditPools = { ...pools };

  for (const row of sort_materialize_occurrences(occurrences)) {
    const key = occurrence_selection_key(row);

    if (is_hard_blocked_occurrence(row)) {
      result.set(key, { fundable: false, reason: 'package_expires_before' });
      continue;
    }

    if (!selected_keys.has(key)) {
      result.set(key, { fundable: false, reason: null });
      continue;
    }

    const reformer_required = row.reformer_credits_required ?? 0;
    const mat_required = row.mat_credits_required ?? 0;

    if (!can_allocate(remaining, reformer_required, mat_required)) {
      result.set(key, { fundable: false, reason: 'insufficient_tokens' });
      continue;
    }

    remaining = allocate(remaining, reformer_required, mat_required);
    result.set(key, { fundable: true, reason: 'ok' });
  }

  return result;
}

/** Greedy earliest fundable selection across the combined chronological list. */
export function build_credit_based_default_selection(
  occurrences: readonly SelectableMaterializeOccurrence[],
  pools: MaterializeCreditPools,
): Set<string> {
  const selected = new Set<string>();
  let remaining: MaterializeCreditPools = { ...pools };

  for (const row of sort_materialize_occurrences(occurrences)) {
    if (is_hard_blocked_occurrence(row)) continue;

    const reformer_required = row.reformer_credits_required ?? 0;
    const mat_required = row.mat_credits_required ?? 0;
    if (!can_allocate(remaining, reformer_required, mat_required)) continue;

    const key = occurrence_selection_key(row);
    selected.add(key);
    remaining = allocate(remaining, reformer_required, mat_required);
  }

  return selected;
}

export function selection_has_unfunded_rows(
  occurrences: readonly SelectableMaterializeOccurrence[],
  selected_keys: ReadonlySet<string>,
  pools: MaterializeCreditPools,
): boolean {
  const funding = evaluate_selection_funding(occurrences, selected_keys, pools);
  for (const key of selected_keys) {
    if (!funding.get(key)?.fundable) return true;
  }
  return false;
}

export function try_quick_select_sessions(input: {
  occurrences: readonly SelectableMaterializeOccurrence[];
  pools: MaterializeCreditPools;
  scope: MaterializeClassScope;
  requested_count: number;
  current_selection: ReadonlySet<string>;
}): QuickSelectResult {
  const { occurrences, pools, scope, requested_count, current_selection } = input;
  const prior = new Set(current_selection);
  const ordered = sort_materialize_occurrences(occurrences);

  const in_scope = ordered.filter(
    (row) => occurrence_matches_scope(row, scope) && !is_hard_blocked_occurrence(row),
  );

  if (in_scope.length < requested_count) {
    return {
      ok: false,
      code: 'insufficient_dates',
      message: `Only ${in_scope.length} eligible session${in_scope.length === 1 ? '' : 's'} are available in this period; you requested ${requested_count}.`,
      available_count: in_scope.length,
      requested_count,
      selection: prior,
    };
  }

  const outside = new Set<string>();
  for (const row of ordered) {
    const key = occurrence_selection_key(row);
    if (!occurrence_matches_scope(row, scope) && prior.has(key)) {
      outside.add(key);
    }
  }

  const proposed = new Set(outside);
  let funded_in_scope = 0;

  for (const row of in_scope) {
    if (funded_in_scope >= requested_count) break;
    const key = occurrence_selection_key(row);
    proposed.add(key);
    const funding = evaluate_selection_funding(occurrences, proposed, pools);
    if (!funding.get(key)?.fundable) {
      proposed.delete(key);
      continue;
    }
    funded_in_scope += 1;
  }

  if (funded_in_scope < requested_count) {
    return {
      ok: false,
      code: 'insufficient_credits',
      message: `Available credits cover ${funded_in_scope} session${funded_in_scope === 1 ? '' : 's'} in this scope; you requested ${requested_count}.`,
      available_count: funded_in_scope,
      requested_count,
      selection: prior,
    };
  }

  if (selection_has_unfunded_rows(occurrences, proposed, pools)) {
    return {
      ok: false,
      code: 'insufficient_credits',
      message: `Available credits cannot fund ${requested_count} sessions with the current outside-scope selections.`,
      available_count: funded_in_scope,
      requested_count,
      selection: prior,
    };
  }

  return { ok: true, selection: proposed };
}

export function zero_credits_message(
  occurrences: readonly SelectableMaterializeOccurrence[],
  pools: MaterializeCreditPools,
): string | null {
  if (occurrences.length === 0) return null;
  const defaults = build_credit_based_default_selection(occurrences, pools);
  if (defaults.size > 0) return null;

  const needs_reformer = occurrences.some((row) => (row.reformer_credits_required ?? 0) > 0);
  const needs_mat = occurrences.some((row) => (row.mat_credits_required ?? 0) > 0);

  if (needs_reformer && pools.reformer <= 0 && needs_mat && pools.mat <= 0) {
    return 'No eligible credits are available for these planned bookings.';
  }
  if (needs_reformer && pools.reformer <= 0 && !needs_mat) {
    return 'No eligible Reformer credits are available for these planned bookings.';
  }
  if (needs_mat && pools.mat <= 0 && !needs_reformer) {
    return 'No eligible Mat credits are available for these planned bookings.';
  }
  if (needs_reformer && pools.reformer <= 0) {
    return 'No eligible Reformer credits are available for the Reformer sessions in this list.';
  }
  if (needs_mat && pools.mat <= 0) {
    return 'No eligible Mat credits are available for the Mat sessions in this list.';
  }
  return 'No eligible credits are available for these planned bookings.';
}

export function sum_credit_pool(values: Array<number | null | undefined>): number {
  let total = 0;
  for (const value of values) {
    if (value === null || value === undefined) return UNLIMITED_CREDIT_POOL;
    total += value;
  }
  return total;
}
