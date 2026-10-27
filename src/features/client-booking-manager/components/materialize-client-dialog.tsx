'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import {
  list_client_materializable_occurrences,
  materialize_client_recurring_prebooks,
} from '@/features/client-booking-manager/actions';
import {
  format_session_date,
  format_session_datetime,
  materializable_occurrence_key,
  token_health_badge_class,
  token_health_label,
} from '@/features/client-booking-manager/format';
import {
  build_credit_based_default_selection,
  evaluate_selection_funding,
  occurrence_matches_scope,
  QUICK_SELECT_COUNTS,
  selection_has_unfunded_rows,
  try_quick_select_sessions,
  zero_credits_message,
  type MaterializeClassScope,
  type MaterializeCreditPools,
  type SelectableMaterializeOccurrence,
} from '@/features/client-booking-manager/materialize-selection';
import type { MaterializeClientResult } from '@/features/client-booking-manager/types';

type MaterializeClientDialogProps = {
  client_user_id: string;
  client_name?: string | null;
  open: boolean;
  on_close: () => void;
  on_complete: (message: string) => void;
  on_error: (message: string) => void;
  on_refresh: (options?: { silent?: boolean }) => void;
};

function build_materialize_summary(result: MaterializeClientResult): string {
  const count = result.booking_ids.length;
  return `Materialization complete (${result.window_start} to ${result.window_end}): ${count} booking${count === 1 ? '' : 's'} created. Credits have been deducted from the client balance.`;
}

function to_selectable(rows: SelectableMaterializeOccurrence[]): SelectableMaterializeOccurrence[] {
  return rows.map((row) => ({
    ...row,
    reformer_credits_required: row.reformer_credits_required ?? 0,
    mat_credits_required: row.mat_credits_required ?? 0,
  }));
}

export function MaterializeClientDialog({
  client_user_id,
  client_name,
  open,
  on_close,
  on_complete,
  on_error,
  on_refresh,
}: MaterializeClientDialogProps) {
  const [occurrences, set_occurrences] = useState<SelectableMaterializeOccurrence[]>([]);
  const [pools, set_pools] = useState<MaterializeCreditPools>({ reformer: 0, mat: 0 });
  const [included_keys, set_included_keys] = useState<Set<string>>(new Set());
  const [loading, set_loading] = useState(false);
  const [load_error, set_load_error] = useState('');
  const [is_submitting, set_is_submitting] = useState(false);
  const [action_error, set_action_error] = useState('');
  const [quick_select_error, set_quick_select_error] = useState('');
  const [scope, set_scope] = useState<MaterializeClassScope>('all');
  const request_id_ref = useRef(0);

  useEffect(() => {
    if (!open) return;

    const request_id = ++request_id_ref.current;
    let cancelled = false;

    async function load() {
      set_loading(true);
      set_load_error('');
      set_action_error('');
      set_quick_select_error('');
      set_scope('all');

      const response = await list_client_materializable_occurrences(client_user_id);
      if (cancelled || request_id !== request_id_ref.current) return;

      if (!response.success) {
        set_occurrences([]);
        set_pools({ reformer: 0, mat: 0 });
        set_included_keys(new Set());
        set_load_error(response.error);
        set_loading(false);
        return;
      }

      const rows = to_selectable(response.rows as SelectableMaterializeOccurrence[]);
      const next_pools = response.pools;
      set_occurrences(rows);
      set_pools(next_pools);
      set_included_keys(build_credit_based_default_selection(rows, next_pools));
      set_loading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [client_user_id, open]);

  useEffect(() => {
    if (!open) return;

    const previous_overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handle_keydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !is_submitting) {
        on_close();
      }
    }

    document.addEventListener('keydown', handle_keydown);

    return () => {
      document.body.style.overflow = previous_overflow;
      document.removeEventListener('keydown', handle_keydown);
    };
  }, [open, is_submitting, on_close]);

  const funding = useMemo(
    () => evaluate_selection_funding(occurrences, included_keys, pools),
    [included_keys, occurrences, pools],
  );

  const selected_occurrences = useMemo(
    () =>
      occurrences
        .filter((row) =>
          included_keys.has(
            materializable_occurrence_key(row.rule_id, row.occurrence_date, row.start_time),
          ),
        )
        .map((row) => ({
          rule_id: row.rule_id,
          schedule_line_id: row.schedule_line_id,
          occurrence_date: row.occurrence_date,
          start_time: row.start_time,
        })),
    [included_keys, occurrences],
  );

  const has_unfunded_selected = selection_has_unfunded_rows(occurrences, included_keys, pools);

  const date_range_label =
    occurrences.length > 0
      ? `${occurrences[0]?.occurrence_date} – ${occurrences[occurrences.length - 1]?.occurrence_date}`
      : null;

  const earliest_selected = useMemo(() => {
    const selected_rows = occurrences.filter((row) =>
      included_keys.has(
        materializable_occurrence_key(row.rule_id, row.occurrence_date, row.start_time),
      ),
    );
    return selected_rows[0] ?? null;
  }, [included_keys, occurrences]);

  const available_scopes = useMemo(() => {
    const scopes: MaterializeClassScope[] = ['all'];
    if (occurrences.some((row) => occurrence_matches_scope(row, 'reformer'))) {
      scopes.push('reformer');
    }
    if (occurrences.some((row) => occurrence_matches_scope(row, 'mat'))) {
      scopes.push('mat');
    }
    return scopes;
  }, [occurrences]);

  const empty_credits_message = zero_credits_message(occurrences, pools);

  const token_block_message = has_unfunded_selected
    ? 'Not enough credits for all selected classes. Uncheck rows marked “Not enough credits” or add credits before materializing.'
    : '';

  if (!open || typeof document === 'undefined') return null;

  function toggle_key(key: string) {
    set_quick_select_error('');
    set_included_keys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function reset_to_credit_defaults() {
    set_quick_select_error('');
    set_action_error('');
    set_included_keys(build_credit_based_default_selection(occurrences, pools));
  }

  function handle_quick_select(count: number) {
    const result = try_quick_select_sessions({
      occurrences,
      pools,
      scope,
      requested_count: count,
      current_selection: included_keys,
    });

    if (!result.ok) {
      set_quick_select_error(result.message);
      return;
    }

    set_quick_select_error('');
    set_included_keys(result.selection);
  }

  async function handle_confirm() {
    if (is_submitting || has_unfunded_selected || selected_occurrences.length === 0) return;

    set_is_submitting(true);
    set_action_error('');

    try {
      const response = await materialize_client_recurring_prebooks(
        client_user_id,
        selected_occurrences,
      );

      if (!response.success) {
        set_action_error(response.error);
        on_error(response.error);
        on_refresh({ silent: true });
        return;
      }

      on_close();
      on_complete(build_materialize_summary(response.result));
      on_refresh({ silent: true });
    } catch {
      const message = 'Materialization failed unexpectedly. Please try again.';
      set_action_error(message);
      on_error(message);
      on_refresh({ silent: true });
    } finally {
      set_is_submitting(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !is_submitting) {
          on_close();
        }
      }}
      role="presentation"
    >
      <div
        aria-labelledby="materialize-dialog-title"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg sm:max-h-[85vh]"
        role="dialog"
      >
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground" id="materialize-dialog-title">
            Book now
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            Choose the exact prebook sessions to create the actual bookings now
            {client_name ? ` for ${client_name}` : ''}. Credits are checked per class category.
          </p>
          <dl className="mt-3 grid gap-2 text-xs text-foreground/70 sm:grid-cols-2">
            <div>
              <dt className="font-medium uppercase tracking-wide text-foreground/50">Client</dt>
              <dd className="mt-0.5 text-sm text-foreground">{client_name || 'Selected client'}</dd>
            </div>
            <div>
              <dt className="font-medium uppercase tracking-wide text-foreground/50">Date range</dt>
              <dd className="mt-0.5 text-sm text-foreground">{date_range_label ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-medium uppercase tracking-wide text-foreground/50">
                Earliest selected
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground">
                {earliest_selected
                  ? format_session_date(earliest_selected.occurrence_date)
                  : 'None selected'}
              </dd>
            </div>
            <div>
              <dt className="font-medium uppercase tracking-wide text-foreground/50">Selected</dt>
              <dd className="mt-0.5 text-sm text-foreground">
                {selected_occurrences.length} session
                {selected_occurrences.length === 1 ? '' : 's'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-foreground/60">Loading upcoming occurrences…</p>
          ) : load_error ? (
            <p className="text-sm text-danger-foreground">{load_error}</p>
          ) : occurrences.length === 0 ? (
            <p className="text-sm text-foreground/60">
              Nothing to materialize in the three-month planned window. All occurrences are already
              booked or permanently skipped.
            </p>
          ) : (
            <>
              <div className="mb-4 space-y-3 rounded-md border border-border/80 bg-muted/40 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                    Quick select sessions
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {available_scopes.map((value) => (
                      <button
                        key={value}
                        className={[
                          'rounded-full px-3 py-1 text-xs font-medium',
                          scope === value
                            ? 'bg-foreground text-background'
                            : 'border border-border bg-background text-foreground/70',
                        ].join(' ')}
                        onClick={() => set_scope(value)}
                        type="button"
                      >
                        {value === 'all' ? 'All classes' : value === 'reformer' ? 'Reformer' : 'Mat'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SELECT_COUNTS.map((count) => (
                    <Button
                      key={count}
                      onClick={() => handle_quick_select(count)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      {count}
                    </Button>
                  ))}
                  <Button
                    onClick={reset_to_credit_defaults}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Reset to credit-based selection
                  </Button>
                </div>
                {empty_credits_message ? (
                  <p className="text-sm text-foreground/70">{empty_credits_message}</p>
                ) : null}
              </div>

              <ul className="space-y-2">
                {occurrences.map((row) => {
                  const key = materializable_occurrence_key(
                    row.rule_id,
                    row.occurrence_date,
                    row.start_time,
                  );
                  const checked = included_keys.has(key);
                  const row_funding = funding.get(key);
                  const hard_blocked = row.token_health === 'package_expires_before';
                  const badge_health =
                    hard_blocked
                      ? ('package_expires_before' as const)
                      : checked && row_funding && !row_funding.fundable
                        ? ('insufficient_tokens' as const)
                        : !checked &&
                            empty_credits_message === null &&
                            (row.reformer_credits_required ?? 0) + (row.mat_credits_required ?? 0) > 0
                          ? ('insufficient_tokens' as const)
                          : null;

                  return (
                    <li
                      key={key}
                      className="flex items-start gap-3 rounded-md border border-border/70 px-3 py-2"
                    >
                      <input
                        checked={checked}
                        className="mt-1"
                        disabled={hard_blocked}
                        id={`materialize-${key}`}
                        onChange={() => toggle_key(key)}
                        type="checkbox"
                      />
                      <label className="flex-1 cursor-pointer text-sm" htmlFor={`materialize-${key}`}>
                        <span className="font-medium text-foreground">
                          {format_session_datetime(row.occurrence_starts_at)}
                        </span>
                        <span className="mt-0.5 block text-xs text-foreground/60">
                          {row.rule_label} · {row.session_card_title}
                          {row.booking_state === 'failed' && row.failure_message
                            ? ` · Previous failure: ${row.failure_message}`
                            : ''}
                        </span>
                        {badge_health ? (
                          <span
                            className={`mt-1 inline-block ${token_health_badge_class(badge_health)}`}
                          >
                            {token_health_label(badge_health) || 'Not enough credits'}
                          </span>
                        ) : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {quick_select_error ? (
            <p className="mt-3 text-sm text-danger-foreground" role="alert">
              {quick_select_error}
            </p>
          ) : null}
          {token_block_message ? (
            <p className="mt-3 text-sm text-danger-foreground" role="alert">
              {token_block_message}
            </p>
          ) : null}
          {action_error ? (
            <p className="mt-3 text-sm text-danger-foreground" role="alert">
              {action_error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">
          <Button disabled={is_submitting} onClick={on_close} size="sm" variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={
              is_submitting ||
              loading ||
              Boolean(load_error) ||
              selected_occurrences.length === 0 ||
              has_unfunded_selected
            }
            onClick={() => void handle_confirm()}
            size="sm"
          >
            {is_submitting
              ? 'Booking…'
              : `Book ${selected_occurrences.length} occurrence(s)`}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
