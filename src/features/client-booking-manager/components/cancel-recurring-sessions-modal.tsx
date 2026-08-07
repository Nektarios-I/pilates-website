'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import {
  cancel_confirmation_copy,
  cancel_selected_sessions_enabled,
  default_cancel_selection_keys,
  is_occurrence_cancellable,
  occurrence_selection_key,
  type CancelRecurringOccurrenceItem,
} from '@/features/bookings/recurring-occurrence-cancellation';
import { format_preview_occurrence_label } from '@/features/bookings/recurring-preview';

type CancelRecurringSessionsModalProps = {
  open: boolean;
  occurrences: CancelRecurringOccurrenceItem[];
  on_close: () => void;
  on_confirm: (
    selected: CancelRecurringOccurrenceItem[],
  ) => Promise<{ success: boolean; message: string }>;
};

export function CancelRecurringSessionsModal(props: CancelRecurringSessionsModalProps) {
  if (!props.open) return null;
  return <CancelRecurringSessionsModalOpen key={props.occurrences.length} {...props} />;
}

function CancelRecurringSessionsModalOpen({
  open,
  occurrences,
  on_close,
  on_confirm,
}: CancelRecurringSessionsModalProps) {
  const [selected, set_selected] = useState<Set<string>>(() => default_cancel_selection_keys());
  const [confirming, set_confirming] = useState(false);
  const [is_submitting, set_is_submitting] = useState(false);
  const [error, set_error] = useState('');

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function on_keydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !is_submitting) on_close();
    }

    document.addEventListener('keydown', on_keydown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', on_keydown);
    };
  }, [open, is_submitting, on_close]);

  const selected_items = useMemo(
    () =>
      occurrences.filter((item) =>
        selected.has(occurrence_selection_key(item.occurrence_date, item.start_time)),
      ),
    [occurrences, selected],
  );

  const copy = cancel_confirmation_copy(selected_items.length);

  if (typeof document === 'undefined') return null;

  function toggle(item: CancelRecurringOccurrenceItem) {
    if (!is_occurrence_cancellable(item)) return;
    const key = occurrence_selection_key(item.occurrence_date, item.start_time);
    set_selected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handle_primary() {
    if (!cancel_selected_sessions_enabled(selected_items.length) || is_submitting) return;
    if (!confirming) {
      set_confirming(true);
      return;
    }

    set_is_submitting(true);
    set_error('');
    try {
      const result = await on_confirm(selected_items);
      if (!result.success) {
        set_error(result.message);
        return;
      }
      on_close();
    } catch {
      set_error('Could not cancel the selected sessions. Please try again.');
    } finally {
      set_is_submitting(false);
    }
  }

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-inverse/40 p-0 sm:items-center sm:p-4"
      role="dialog"
    >
      <button
        aria-label="Close dialog backdrop"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!is_submitting) on_close();
        }}
        type="button"
      />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-lg border border-border bg-background shadow-lg sm:rounded-lg">
        <div className="border-b border-border px-4 py-4">
          <h2 className="text-base font-semibold text-foreground">Cancel recurring sessions</h2>
          <p className="mt-1 text-sm text-foreground/70">
            Select the sessions you want to cancel. Unselected sessions will remain scheduled.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <ul className="space-y-2">
            {occurrences.map((item) => {
              const key = occurrence_selection_key(item.occurrence_date, item.start_time);
              const cancellable = is_occurrence_cancellable(item);
              const label = format_preview_occurrence_label({
                occurrence_date: item.occurrence_date,
                day_of_week: 0,
                start_time: item.start_time,
                end_time: item.end_time,
                session_title: item.session_title,
              });
              const state_label =
                item.state === 'cancelled'
                  ? 'Already cancelled'
                  : item.state === 'unavailable'
                    ? 'Unavailable'
                    : item.state === 'booked'
                      ? 'Booked'
                      : item.state === 'waitlisted'
                        ? 'Waitlisted'
                        : null;

              return (
                <li key={key}>
                  <label
                    className={[
                      'flex items-start gap-3 rounded-md border border-border/70 px-3 py-2 text-sm',
                      cancellable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                    ].join(' ')}
                  >
                    <input
                      checked={selected.has(key)}
                      className="mt-1 h-4 w-4"
                      disabled={!cancellable || is_submitting}
                      onChange={() => toggle(item)}
                      type="checkbox"
                    />
                    <span>
                      <span className="block text-foreground">{label}</span>
                      {state_label ? (
                        <span className="mt-0.5 block text-xs text-foreground/55">{state_label}</span>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-3 border-t border-border px-4 py-4">
          {confirming ? (
            <div className="rounded-md border border-border bg-surface/50 px-3 py-2 text-sm">
              <p className="font-medium text-foreground">{copy.title}</p>
              <p className="mt-1 text-foreground/70">{copy.body}</p>
            </div>
          ) : null}
          {selected_items.length > 0 ? (
            <p className="text-xs text-foreground/60">{selected_items.length} selected</p>
          ) : null}
          {error ? <p className="text-sm text-danger-foreground">{error}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              disabled={is_submitting}
              onClick={() => {
                if (confirming) {
                  set_confirming(false);
                  return;
                }
                on_close();
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={!cancel_selected_sessions_enabled(selected_items.length) || is_submitting}
              onClick={() => void handle_primary()}
              size="sm"
              type="button"
            >
              {is_submitting ? 'Cancelling…' : copy.confirm_label}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
