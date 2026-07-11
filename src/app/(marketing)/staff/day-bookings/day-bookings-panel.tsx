'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  DAY_BOOKING_HOUR_OPTIONS,
  DEFAULT_DAY_BOOKINGS_FILTERS,
  format_booking_status,
  format_day_heading,
  format_session_time_range,
  format_session_type,
  type DayBookingAttendee,
  type DayBookingsFilters,
  type DayBookingsSession,
  type DayBookingsSummary,
} from '@/features/bookings/day-bookings';

import { list_day_bookings } from './actions';

type DayBookingsPanelProps = {
  initial_sessions: DayBookingsSession[];
  initial_summary: DayBookingsSummary;
  initial_filters: DayBookingsFilters;
  initial_error?: string | null;
};

function AttendeeRow({
  booking,
  variant,
}: {
  booking: DayBookingAttendee;
  variant: 'active' | 'cancelled';
}) {
  return (
    <li
      className={[
        'flex flex-col gap-1 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        variant === 'active'
          ? 'border-border bg-background'
          : 'border-border/70 bg-surface/60 opacity-80',
      ].join(' ')}
    >
      <div>
        <p className="text-sm font-medium text-foreground">
          {booking.client_name ?? 'Unnamed client'}
        </p>
        <p className="mt-0.5 text-sm text-foreground/70">
          {booking.client_email ? (
            <a className="hover:text-foreground" href={`mailto:${booking.client_email}`}>
              {booking.client_email}
            </a>
          ) : (
            booking.client_phone ?? 'Contact details not provided'
          )}
        </p>
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
        {format_booking_status(booking.status)}
      </p>
    </li>
  );
}

function SessionCard({ session }: { session: DayBookingsSession }) {
  const total = session.active_bookings.length + session.cancelled_bookings.length;

  return (
    <article className="rounded-md border border-border bg-background p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
            {format_session_time_range(session.starts_at, session.ends_at)}
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">{session.title}</h2>
          <p className="mt-1 text-sm text-foreground/70">
            {format_session_type(session.session_type)} · {session.location ?? 'Studio'}
            {session.instructor_name ? ` · ${session.instructor_name}` : ''}
          </p>
        </div>
        <p className="text-sm text-foreground/70">
          {total} booking{total === 1 ? '' : 's'}
        </p>
      </div>

      <div className="mt-4 space-y-5">
        <section>
          <h3 className="text-sm font-semibold text-foreground">Active bookings</h3>
          {session.active_bookings.length === 0 ? (
            <p className="mt-2 text-sm text-foreground/60">No active bookings.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {session.active_bookings.map((booking) => (
                <AttendeeRow booking={booking} key={booking.id} variant="active" />
              ))}
            </ul>
          )}
        </section>

        {session.cancelled_bookings.length > 0 ? (
          <section>
            <h3 className="text-sm font-semibold text-foreground/80">Cancelled / no-show</h3>
            <ul className="mt-3 space-y-2">
              {session.cancelled_bookings.map((booking) => (
                <AttendeeRow booking={booking} key={booking.id} variant="cancelled" />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}

export function DayBookingsPanel({
  initial_sessions,
  initial_summary,
  initial_filters,
  initial_error = null,
}: DayBookingsPanelProps) {
  const [sessions, set_sessions] = useState(initial_sessions);
  const [summary, set_summary] = useState(initial_summary);
  const [filters, set_filters] = useState<DayBookingsFilters>(initial_filters);
  const [draft_filters, set_draft_filters] = useState<DayBookingsFilters>(initial_filters);
  const [error, set_error] = useState<string | null>(initial_error);
  const [is_pending, start_transition] = useTransition();

  function apply_filters() {
    start_transition(async () => {
      set_error(null);
      const result = await list_day_bookings(draft_filters);
      set_sessions(result.sessions);
      set_summary(result.summary);
      set_error(result.error);
      set_filters(draft_filters);
    });
  }

  function reset_filters() {
    start_transition(async () => {
      set_error(null);
      const result = await list_day_bookings(DEFAULT_DAY_BOOKINGS_FILTERS);
      set_sessions(result.sessions);
      set_summary(result.summary);
      set_error(result.error);
      set_filters(DEFAULT_DAY_BOOKINGS_FILTERS);
      set_draft_filters(DEFAULT_DAY_BOOKINGS_FILTERS);
    });
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-4 rounded-md border border-border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          apply_filters();
        }}
      >
        <label className="block text-sm">
          <span className="font-medium text-foreground">Day</span>
          <input
            className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
            type="date"
            value={draft_filters.date_key}
            onChange={(event) =>
              set_draft_filters((prev) => ({ ...prev, date_key: event.target.value }))
            }
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-foreground">From</span>
          <select
            className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
            value={draft_filters.hour_start}
            onChange={(event) =>
              set_draft_filters((prev) => ({ ...prev, hour_start: event.target.value }))
            }
          >
            {DAY_BOOKING_HOUR_OPTIONS.map((hour) => (
              <option key={`start-${hour}`} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-foreground">Until</span>
          <select
            className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
            value={draft_filters.hour_end}
            onChange={(event) =>
              set_draft_filters((prev) => ({ ...prev, hour_end: event.target.value }))
            }
          >
            {DAY_BOOKING_HOUR_OPTIONS.map((hour) => (
              <option key={`end-${hour}`} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-end gap-2">
          <Button disabled={is_pending} size="sm" type="submit">
            {is_pending ? 'Loading…' : 'Apply'}
          </Button>
          <Button disabled={is_pending} size="sm" type="button" variant="secondary" onClick={reset_filters}>
            Today
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-foreground/70">
        <p className="font-medium text-foreground">{format_day_heading(filters.date_key)}</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/80">
            {summary.sessions} session{summary.sessions === 1 ? '' : 's'}
          </span>
          <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border">
            {summary.active} active
          </span>
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground/70 ring-1 ring-border/70">
            {summary.cancelled} cancelled
          </span>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {sessions.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground/60">
          No bookings match this day and time range.
        </p>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
