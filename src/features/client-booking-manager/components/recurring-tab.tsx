'use client';

import { useEffect, useState, useTransition } from 'react';

import type { SessionCard } from '@/app/(marketing)/book/schedule-actions';
import { Button } from '@/components/ui/button';
import {
  add_recurring_schedule_line,
  add_recurring_skip,
  create_recurring_rule,
  deactivate_recurring_rule,
  deactivate_recurring_schedule_line,
  delete_recurring_rule,
  list_recurring_schedule_lines,
  list_recurring_skips,
  load_recurring_forecast,
  remove_recurring_skip,
  update_recurring_rule,
} from '@/features/client-booking-manager/actions';
import { RecurringWeeklySlotPicker } from '@/features/client-booking-manager/components/recurring-weekly-slot-picker';
import { MaterializeClientDialog } from '@/features/client-booking-manager/components/materialize-client-dialog';
import {
  booking_state_badge_class,
  booking_state_label,
  format_session_datetime,
  format_session_date,
  format_time_value,
  health_status_badge_class,
  health_status_label,
  ISO_WEEKDAY_OPTIONS,
  token_health_badge_class,
  token_health_label,
} from '@/features/client-booking-manager/format';
import type {
  RecurringForecastRow,
  RecurringPrebookRule,
  RecurringScheduleLine,
  RecurringSkip,
} from '@/features/client-booking-manager/types';

type RecurringTabProps = {
  client_user_id: string;
  rules: RecurringPrebookRule[];
  session_cards: SessionCard[];
  on_refresh: (options?: { silent?: boolean }) => void;
  on_operation_feedback?: (feedback: { type: 'success' | 'error'; message: string }) => void;
};

export function RecurringTab({
  client_user_id,
  rules,
  session_cards,
  on_refresh,
  on_operation_feedback,
}: RecurringTabProps) {
  const [new_card_id, set_new_card_id] = useState('');
  const [new_label, set_new_label] = useState('');
  const [message, set_message] = useState('');
  const [error, set_error] = useState('');
  const [is_pending, start_transition] = useTransition();
  const [materialize_open, set_materialize_open] = useState(false);
  const [forecast_revision, set_forecast_revision] = useState(0);

  function handle_create() {
    if (!new_card_id) return;

    start_transition(async () => {
      set_message('');
      set_error('');
      const result = await create_recurring_rule(client_user_id, new_card_id, new_label);
      if (!result.success) {
        set_error(result.error);
        return;
      }
      set_message('Recurring rule created.');
      set_new_card_id('');
      set_new_label('');
      on_refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-border bg-background p-5">
        <h2 className="text-sm font-semibold text-foreground">Create recurring rule</h2>
        <p className="mt-1 text-sm text-foreground/70">
          Choose a class, then add weekly slots for each day using the studio&apos;s default hours.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground" htmlFor="recurring-card">
              Session card
            </label>
            <select
              className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              id="recurring-card"
              onChange={(event) => set_new_card_id(event.target.value)}
              value={new_card_id}
            >
              <option value="">Select session card</option>
              {session_cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground" htmlFor="recurring-label">
              Label (optional)
            </label>
            <input
              className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              id="recurring-label"
              onChange={(event) => set_new_label(event.target.value)}
              placeholder="e.g. Tuesday morning reformer"
              value={new_label}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button disabled={!new_card_id || is_pending} onClick={handle_create} size="sm">
            Create rule
          </Button>
        </div>
      </section>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-danger-foreground">{error}</p> : null}

      {rules.some((rule) => rule.status === 'active') ? (
        <section className="rounded-md border border-border bg-background p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Materialize recurring bookings</h2>
              <p className="mt-1 text-sm text-foreground/70">
                Turn planned recurring slots into real bookings for this client. The system uses a
                rolling 14-day window — as each day passes, the next week&apos;s classes enter the
                window automatically (daily cron at 04:00 UTC, or run manually here).
              </p>
            </div>
            <Button
              disabled={is_pending}
              onClick={() => {
                set_message('');
                set_error('');
                set_materialize_open(true);
              }}
              size="sm"
            >
              Run materialization now
            </Button>
          </div>
        </section>
      ) : null}

      <MaterializeClientDialog
        client_user_id={client_user_id}
        on_close={() => set_materialize_open(false)}
        on_complete={(summary) => {
          set_error('');
          set_message(summary);
          on_operation_feedback?.({ type: 'success', message: summary });
          set_forecast_revision((current) => current + 1);
        }}
        on_error={(message) => {
          set_message('');
          set_error(message);
          on_operation_feedback?.({ type: 'error', message });
        }}
        on_refresh={on_refresh}
        open={materialize_open}
      />

      {rules.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground/60">
          No recurring rules for this client yet.
        </p>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              forecast_revision={forecast_revision}
              on_refresh={on_refresh}
              rule={rule}
              session_cards={session_cards}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RuleCard({
  rule,
  session_cards,
  on_refresh,
  forecast_revision,
}: {
  rule: RecurringPrebookRule;
  session_cards: SessionCard[];
  on_refresh: (options?: { silent?: boolean }) => void;
  forecast_revision: number;
}) {
  const [editing, set_editing] = useState(false);
  const [card_id, set_card_id] = useState(rule.session_card_id);
  const [label, set_label] = useState(rule.label ?? '');
  const [lines, set_lines] = useState<RecurringScheduleLine[]>([]);
  const [skips, set_skips] = useState<RecurringSkip[]>([]);
  const [forecast, set_forecast] = useState<RecurringForecastRow[]>(rule.forecast ?? []);
  const [loading_details, set_loading_details] = useState(true);
  const [selected_forecast_key, set_selected_forecast_key] = useState('');
  const [skip_reason, set_skip_reason] = useState('');
  const [message, set_message] = useState('');
  const [error, set_error] = useState('');
  const [is_pending, start_transition] = useTransition();

  const session_card =
    session_cards.find((card) => card.id === rule.session_card_id) ?? null;
  const duration_minutes = session_card?.duration_minutes ?? 60;

  useEffect(() => {
    let cancelled = false;

    async function load_details() {
      set_loading_details(true);
      const [schedule_lines, skip_rows, forecast_rows] = await Promise.all([
        list_recurring_schedule_lines(rule.id),
        list_recurring_skips(rule.id),
        load_recurring_forecast(rule.id),
      ]);
      if (!cancelled) {
        set_lines(schedule_lines);
        set_skips(skip_rows);
        set_forecast(forecast_rows);
        set_loading_details(false);
      }
    }

    void load_details();
    return () => {
      cancelled = true;
    };
  }, [rule.id, rule.forecast, forecast_revision]);

  const active_lines = lines.filter((line) => line.is_active);
  const skippable_forecast = forecast.filter(
    (row) =>
      !skips.some(
        (skip) =>
          skip.occurrence_date === row.occurrence_date && skip.start_time === row.start_time,
      ),
  );

  function run_action(action: () => Promise<{ success: boolean; error?: string }>) {
    start_transition(async () => {
      set_message('');
      set_error('');
      const result = await action();
      if (!result.success) {
        set_error(result.error ?? 'Something went wrong.');
        return;
      }
      set_message('Saved.');
      on_refresh();
    });
  }

  return (
    <article className="rounded-md border border-border bg-background p-5">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {rule.label || rule.session_card_title || 'Recurring rule'}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-foreground/60">
            {rule.status} · {rule.session_card_title}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {rule.status === 'active' ? (
            <Button
              disabled={is_pending}
              onClick={() =>
                run_action(async () => {
                  const result = await deactivate_recurring_rule(rule.id);
                  return result;
                })
              }
              size="sm"
              variant="secondary"
            >
              Deactivate
            </Button>
          ) : null}
          <Button
            className="border-danger text-danger-foreground hover:bg-danger/10"
            disabled={is_pending}
            onClick={() => {
              const confirmed = window.confirm(
                'Permanently delete this recurring rule? Schedule lines, skips, and materialization history for this rule will be removed. Existing bookings stay on the calendar.',
              );
              if (!confirmed) return;

              run_action(async () => delete_recurring_rule(rule.id));
            }}
            size="sm"
            variant="secondary"
          >
            Delete rule
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            onChange={(event) => set_card_id(event.target.value)}
            value={card_id}
          >
            {session_cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.title}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            onChange={(event) => set_label(event.target.value)}
            value={label}
          />
          <div className="flex gap-2 sm:col-span-2">
            <Button
              disabled={is_pending}
              onClick={() =>
                run_action(async () => update_recurring_rule(rule.id, card_id, label))
              }
              size="sm"
            >
              Save
            </Button>
            <Button onClick={() => set_editing(false)} size="sm" variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          className="mt-3 text-sm font-medium text-foreground underline-offset-2 hover:underline"
          onClick={() => set_editing(true)}
          type="button"
        >
          Edit label / session card
        </button>
      )}

      {message ? <p className="mt-3 text-sm text-success">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-danger-foreground">{error}</p> : null}

      {loading_details ? (
        <p className="mt-4 text-sm text-foreground/60">Loading schedule details…</p>
      ) : (
        <>
          <section className="mt-5">
            <h3 className="text-sm font-semibold text-foreground">Weekly slots</h3>
            <p className="mt-1 text-xs text-foreground/60">
              Recurring bookings repeat each week at the selected studio slot. Times follow default
              studio hours (Mon–Fri 06:00–12:00 &amp; 15:00–20:00, Sat 07:00–11:00).
            </p>
            {active_lines.length === 0 ? (
              <p className="mt-2 text-sm text-foreground/60">No weekly slots added yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {active_lines.map((line) => (
                  <li
                    key={line.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 px-3 py-2 text-sm"
                  >
                    <span>
                      {ISO_WEEKDAY_OPTIONS.find((day) => day.value === line.day_of_week)?.label}{' '}
                      {format_time_value(line.start_time)} · {line.duration_minutes} min
                    </span>
                    <Button
                      disabled={is_pending}
                      onClick={() =>
                        run_action(async () => deactivate_recurring_schedule_line(line.id))
                      }
                      size="sm"
                      variant="secondary"
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <RecurringWeeklySlotPicker
              active_lines={active_lines}
              disabled={is_pending || rule.status !== 'active'}
              duration_minutes={duration_minutes}
              on_add={(day_of_week, start_time) => {
                run_action(async () =>
                  add_recurring_schedule_line(
                    rule.id,
                    day_of_week,
                    start_time,
                    duration_minutes,
                  ),
                );
              }}
            />
            {rule.status !== 'active' ? (
              <p className="mt-2 text-xs text-foreground/60">
                Reactivate is not supported — create a new rule to add weekly slots.
              </p>
            ) : null}
          </section>

          <section className="mt-5">
            <h3 className="text-sm font-semibold text-foreground">Skipped occurrences</h3>
            <p className="mt-1 text-xs text-foreground/60">
              Skip a specific upcoming occurrence from the 14-day forecast.
            </p>
            {skips.length === 0 ? (
              <p className="mt-2 text-sm text-foreground/60">No skipped dates.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {skips.map((skip) => (
                  <li
                    key={skip.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 px-3 py-2 text-sm"
                  >
                    <span>
                      {format_session_date(skip.occurrence_date)} {format_time_value(skip.start_time)}
                      {skip.reason ? ` — ${skip.reason}` : ''}
                    </span>
                    <Button
                      disabled={is_pending}
                      onClick={() => run_action(async () => remove_recurring_skip(skip.id))}
                      size="sm"
                      variant="secondary"
                    >
                      Remove skip
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div>
                <label
                  className="block text-sm font-medium text-foreground"
                  htmlFor={`skip-occurrence-${rule.id}`}
                >
                  Upcoming occurrence to skip
                </label>
                <select
                  className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  id={`skip-occurrence-${rule.id}`}
                  onChange={(event) => set_selected_forecast_key(event.target.value)}
                  value={selected_forecast_key}
                >
                  <option value="">Select an occurrence</option>
                  {skippable_forecast.map((row) => {
                    const key = `${row.occurrence_date}|${row.start_time}`;
                    return (
                      <option key={key} value={key}>
                        {format_session_datetime(row.occurrence_starts_at)}
                      </option>
                    );
                  })}
                </select>
                {skippable_forecast.length === 0 ? (
                  <p className="mt-2 text-xs text-foreground/60">
                    No skippable forecast occurrences in the next 14 days.
                  </p>
                ) : null}
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-foreground"
                  htmlFor={`skip-reason-${rule.id}`}
                >
                  Reason (optional)
                </label>
                <input
                  className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  id={`skip-reason-${rule.id}`}
                  onChange={(event) => set_skip_reason(event.target.value)}
                  placeholder="e.g. Client away"
                  value={skip_reason}
                />
              </div>
              <div className="flex items-end">
                <Button
                  disabled={!selected_forecast_key || is_pending}
                  onClick={() => {
                    const [occurrence_date, start_time] = selected_forecast_key.split('|');
                    if (!occurrence_date || !start_time) return;
                    run_action(async () =>
                      add_recurring_skip(rule.id, occurrence_date, start_time, skip_reason),
                    );
                    set_selected_forecast_key('');
                    set_skip_reason('');
                  }}
                  size="sm"
                >
                  Skip occurrence
                </Button>
              </div>
            </div>
          </section>

          <section className="mt-5">
            <h3 className="text-sm font-semibold text-foreground">14-day forecast</h3>
            <p className="mt-1 text-xs text-foreground/60">
              Class dates inside the booking window. <strong>Planned</strong> means not yet
              materialized; <strong>Booked</strong> means a real booking exists. Token status
              counts all recurring rules for this client, soonest first.
            </p>
            {forecast.length === 0 ? (
              <p className="mt-2 text-sm text-foreground/60">No forecast occurrences in window.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {forecast.map((row) => (
                  <li
                    key={`${row.schedule_line_id}-${row.occurrence_date}-${row.start_time}`}
                    className="flex flex-col gap-2 rounded-md border border-border/70 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {format_session_datetime(row.occurrence_starts_at)}
                      </p>
                      <p className="text-xs text-foreground/60">
                        Class on {format_session_date(row.occurrence_date)} at{' '}
                        {format_time_value(row.start_time)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={booking_state_badge_class(row.booking_state)}>
                        {booking_state_label(row.booking_state)}
                      </span>
                      {row.booking_state === 'planned' && row.token_health ? (
                        <span className={token_health_badge_class(row.token_health)}>
                          {token_health_label(row.token_health)}
                        </span>
                      ) : null}
                      {row.booking_state === 'failed' ? (
                        <span className={health_status_badge_class('failed')}>
                          {row.failure_code
                            ? health_status_label('failed')
                            : 'Materialization failed'}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </article>
  );
}
