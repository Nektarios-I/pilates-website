'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { list_active_recurring_rules_overview } from '@/features/client-booking-manager/actions';
import {
  format_client_label,
  format_session_date,
  format_time_value,
  ISO_WEEKDAY_OPTIONS,
} from '@/features/client-booking-manager/format';
import { filter_recurring_overview_clients } from '@/features/client-booking-manager/recurring-rules-overview';
import type { ActiveRecurringClientOverview } from '@/features/client-booking-manager/types';

type RecurringRulesOverviewDialogProps = {
  open: boolean;
  on_close: () => void;
  on_open_client: (client_user_id: string) => void;
};

function weekday_label(day_of_week: number): string {
  return ISO_WEEKDAY_OPTIONS.find((day) => day.value === day_of_week)?.label ?? `Day ${day_of_week}`;
}

function end_time_label(start_time: string, duration_minutes: number): string {
  const [hours, minutes] = start_time.slice(0, 5).split(':').map(Number);
  const total = (hours ?? 0) * 60 + (minutes ?? 0) + duration_minutes;
  const end_h = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const end_m = String(total % 60).padStart(2, '0');
  return `${end_h}:${end_m}`;
}

export function RecurringRulesOverviewDialog({
  open,
  on_close,
  on_open_client,
}: RecurringRulesOverviewDialogProps) {
  const [clients, set_clients] = useState<ActiveRecurringClientOverview[]>([]);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState('');
  const [query, set_query] = useState('');
  const [expanded_client_id, set_expanded_client_id] = useState('');

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function load() {
      set_loading(true);
      set_error('');
      const response = await list_active_recurring_rules_overview();
      if (cancelled) return;

      if (!response.success) {
        set_clients([]);
        set_error(response.error);
        set_loading(false);
        return;
      }

      set_clients(response.clients);
      set_loading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previous_overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handle_keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') on_close();
    }

    document.addEventListener('keydown', handle_keydown);
    return () => {
      document.body.style.overflow = previous_overflow;
      document.removeEventListener('keydown', handle_keydown);
    };
  }, [open, on_close]);

  const filtered = useMemo(
    () => filter_recurring_overview_clients(clients, query),
    [clients, query],
  );

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) on_close();
      }}
      role="presentation"
    >
      <div
        aria-labelledby="recurring-rules-overview-title"
        aria-modal="true"
        className="flex h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-lg border border-border bg-background shadow-lg sm:h-auto sm:max-h-[85vh] sm:rounded-lg"
        role="dialog"
      >
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                className="text-base font-semibold text-foreground"
                id="recurring-rules-overview-title"
              >
                Recurring rules
              </h2>
              <p className="mt-1 text-sm text-foreground/70">
                Active recurring prebooks by client. Expand a client to scan weekly slots.
              </p>
            </div>
            <Button onClick={on_close} size="sm" type="button" variant="secondary">
              Close
            </Button>
          </div>
          <label className="mt-4 block text-sm font-medium text-foreground" htmlFor="overview-search">
            Search clients
          </label>
          <input
            className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            id="overview-search"
            onChange={(event) => set_query(event.target.value)}
            placeholder="Name, email, or phone"
            type="search"
            value={query}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-foreground/60">Loading active recurring rules…</p>
          ) : error ? (
            <div className="space-y-3">
              <p className="text-sm text-danger-foreground">{error}</p>
              <Button
                onClick={() => {
                  set_loading(true);
                  set_error('');
                  void list_active_recurring_rules_overview().then((response) => {
                    if (!response.success) {
                      set_error(response.error);
                      set_clients([]);
                    } else {
                      set_clients(response.clients);
                    }
                    set_loading(false);
                  });
                }}
                size="sm"
                type="button"
                variant="secondary"
              >
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-foreground/60">
              {query.trim()
                ? 'No clients match your search.'
                : 'No clients currently have active recurring rules.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((client) => {
                const expanded = expanded_client_id === client.client_user_id;
                const label = format_client_label(client.full_name, client.email, client.phone);

                return (
                  <li
                    key={client.client_user_id}
                    className="rounded-md border border-border bg-background"
                  >
                    <button
                      aria-expanded={expanded}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      onClick={() =>
                        set_expanded_client_id((current) =>
                          current === client.client_user_id ? '' : client.client_user_id,
                        )
                      }
                      type="button"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-foreground">{label}</span>
                        <span className="mt-0.5 block text-xs text-foreground/60">
                          {client.active_rule_count} active rule
                          {client.active_rule_count === 1 ? '' : 's'}
                        </span>
                      </span>
                      <span className="text-xs font-medium text-foreground/60">
                        {expanded ? 'Collapse' : 'Expand'}
                      </span>
                    </button>

                    {expanded ? (
                      <div className="space-y-3 border-t border-border px-4 py-3">
                        {client.rules.map((rule) => (
                          <article
                            key={rule.id}
                            className="rounded-md border border-border/70 bg-muted/30 px-3 py-3"
                          >
                            <p className="text-sm font-semibold text-foreground">
                              {rule.label || rule.session_card_title}
                            </p>
                            <p className="mt-0.5 text-xs uppercase tracking-wide text-foreground/60">
                              {rule.session_card_title} · {rule.session_type}
                            </p>
                            {rule.lines.length === 0 ? (
                              <p className="mt-2 text-sm text-foreground/60">
                                No active weekly slots
                              </p>
                            ) : (
                              <ul className="mt-2 space-y-2">
                                {rule.lines.map((line) => (
                                  <li key={line.id} className="text-sm text-foreground/80">
                                    <span className="font-semibold text-foreground">
                                      {weekday_label(line.day_of_week)}
                                    </span>{' '}
                                    {format_time_value(line.start_time)}–
                                    {end_time_label(line.start_time, line.duration_minutes)}
                                    <span className="mt-0.5 block text-xs font-medium text-foreground">
                                      First session {format_session_date(line.first_occurrence_date)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </article>
                        ))}
                        <Button
                          onClick={() => on_open_client(client.client_user_id)}
                          size="sm"
                          type="button"
                        >
                          Open client
                        </Button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
