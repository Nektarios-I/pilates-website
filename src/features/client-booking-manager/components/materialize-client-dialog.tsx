'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import {
  list_client_materializable_occurrences,
  materialize_client_recurring_prebooks,
} from '@/features/client-booking-manager/actions';
import {
  format_session_datetime,
  materializable_occurrence_key,
  token_health_badge_class,
  token_health_label,
} from '@/features/client-booking-manager/format';
import type {
  MaterializableOccurrence,
  MaterializeClientResult,
} from '@/features/client-booking-manager/types';

type MaterializeClientDialogProps = {
  client_user_id: string;
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

export function MaterializeClientDialog({
  client_user_id,
  open,
  on_close,
  on_complete,
  on_error,
  on_refresh,
}: MaterializeClientDialogProps) {
  const [occurrences, set_occurrences] = useState<MaterializableOccurrence[]>([]);
  const [included_keys, set_included_keys] = useState<Set<string>>(new Set());
  const [loading, set_loading] = useState(false);
  const [load_error, set_load_error] = useState('');
  const [is_submitting, set_is_submitting] = useState(false);
  const [action_error, set_action_error] = useState('');

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function load() {
      set_loading(true);
      set_load_error('');
      set_action_error('');
      const response = await list_client_materializable_occurrences(client_user_id);
      if (cancelled) return;

      if (!response.success) {
        set_occurrences([]);
        set_included_keys(new Set());
        set_load_error(response.error);
        set_loading(false);
        return;
      }

      set_occurrences(response.rows);
      set_included_keys(
        new Set(
          response.rows.map((row) =>
            materializable_occurrence_key(row.rule_id, row.occurrence_date, row.start_time),
          ),
        ),
      );
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

  const has_insufficient_selected = useMemo(
    () =>
      occurrences.some(
        (row) =>
          included_keys.has(
            materializable_occurrence_key(row.rule_id, row.occurrence_date, row.start_time),
          ) && row.token_health === 'insufficient_tokens',
      ),
    [included_keys, occurrences],
  );

  const token_block_message = has_insufficient_selected
    ? 'Not enough credits for all selected classes. Uncheck rows marked “Not enough slots” or add credits before materializing.'
    : '';

  if (!open || typeof document === 'undefined') return null;

  function toggle_key(key: string) {
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

  async function handle_confirm() {
    if (is_submitting || has_insufficient_selected || selected_occurrences.length === 0) return;

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
        className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-background shadow-lg"
        role="dialog"
      >
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground" id="materialize-dialog-title">
            Run materialization now
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            Book recurring classes across the same three-calendar-month planned window used in the
            recurring preview. Uncheck any occurrence to exclude it from this run. All selected
            classes must have enough credits — materialization is all-or-nothing.
          </p>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
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
            <ul className="space-y-2">
              {occurrences.map((row) => {
                const key = materializable_occurrence_key(
                  row.rule_id,
                  row.occurrence_date,
                  row.start_time,
                );
                const checked = included_keys.has(key);

                return (
                  <li
                    key={key}
                    className="flex items-start gap-3 rounded-md border border-border/70 px-3 py-2"
                  >
                    <input
                      checked={checked}
                      className="mt-1"
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
                      {row.token_health ? (
                        <span
                          className={`mt-1 inline-block ${token_health_badge_class(row.token_health)}`}
                        >
                          {token_health_label(row.token_health)}
                        </span>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
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
              has_insufficient_selected
            }
            onClick={() => void handle_confirm()}
            size="sm"
          >
            {is_submitting
              ? 'Materializing…'
              : `Materialize ${selected_occurrences.length} occurrence(s)`}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
