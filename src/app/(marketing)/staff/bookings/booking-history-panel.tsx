'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  credit_summary_for_staff_booking,
  DEFAULT_STAFF_BOOKING_FILTERS,
  format_booking_date,
  format_booking_status,
  format_booking_time,
  format_session_type,
  format_staff_booking_history_status,
  STAFF_BOOKING_HISTORY_STATUSES,
  STAFF_BOOKINGS_LIMIT,
  type StaffBookingFilters,
  type StaffBookingRecord,
} from '@/features/bookings/staff-bookings';

import { list_staff_bookings } from './actions';

type BookingHistoryPanelProps = {
  initial_bookings: StaffBookingRecord[];
  initial_error?: string | null;
  initial_filters: StaffBookingFilters;
};

function BookingRow({ booking }: { booking: StaffBookingRecord }) {
  return (
    <article className="rounded-md border border-border bg-background p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/80">
              {format_booking_status(booking.status)}
            </span>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
              {format_booking_date(booking.session_starts_at)} ·{' '}
              {format_booking_time(booking.session_starts_at)} –{' '}
              {format_booking_time(booking.session_ends_at)}
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground">{booking.session_title}</h2>
            <p className="mt-1 text-sm text-foreground/70">
              {format_session_type(booking.session_type)} ·{' '}
              {booking.session_location ?? 'Studio'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">
              {booking.client_name ?? 'Unnamed client'}
            </p>
            <p className="mt-1 text-sm text-foreground/70">
              {booking.client_email ? (
                <a className="hover:text-foreground" href={`mailto:${booking.client_email}`}>
                  {booking.client_email}
                </a>
              ) : (
                booking.client_phone ?? 'Contact details not provided'
              )}
            </p>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-foreground/60">Credits</dt>
              <dd className="mt-1 font-medium text-foreground">
                {credit_summary_for_staff_booking(booking)}
              </dd>
            </div>
            <div>
              <dt className="text-foreground/60">Booked on</dt>
              <dd className="mt-1 font-medium text-foreground">
                {format_booking_date(booking.booked_at)}
              </dd>
            </div>
          </dl>

          {booking.cancelled_at ? (
            <p className="rounded-md bg-surface p-3 text-sm text-foreground/70">
              Cancelled {format_booking_date(booking.cancelled_at)}
              {booking.cancellation_reason ? ` · ${booking.cancellation_reason}` : ''}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function BookingHistoryPanel({
  initial_bookings,
  initial_error = null,
  initial_filters,
}: BookingHistoryPanelProps) {
  const [bookings, set_bookings] = useState(initial_bookings);
  const [filters, set_filters] = useState<StaffBookingFilters>(initial_filters);
  const [draft_filters, set_draft_filters] = useState<StaffBookingFilters>(initial_filters);
  const [error, set_error] = useState<string | null>(initial_error);
  const [is_pending, start_transition] = useTransition();

  function apply_filters() {
    start_transition(async () => {
      set_error(null);
      const result = await list_staff_bookings(draft_filters);
      set_bookings(result.bookings);
      set_error(result.error);
      set_filters(draft_filters);
    });
  }

  function reset_filters() {
    start_transition(async () => {
      set_error(null);
      const result = await list_staff_bookings(DEFAULT_STAFF_BOOKING_FILTERS);
      set_bookings(result.bookings);
      set_error(result.error);
      set_filters(DEFAULT_STAFF_BOOKING_FILTERS);
      set_draft_filters(DEFAULT_STAFF_BOOKING_FILTERS);
    });
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-4 rounded-md border border-border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          apply_filters();
        }}
      >
        <label className="block text-sm">
          <span className="font-medium text-foreground">Status</span>
          <select
            className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
            value={draft_filters.status}
            onChange={(event) =>
              set_draft_filters((prev) => ({
                ...prev,
                status: event.target.value as StaffBookingFilters['status'],
              }))
            }
          >
            {STAFF_BOOKING_HISTORY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {format_staff_booking_history_status(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-foreground">Session from</span>
          <input
            className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
            type="date"
            value={draft_filters.session_start_date}
            onChange={(event) =>
              set_draft_filters((prev) => ({
                ...prev,
                session_start_date: event.target.value,
              }))
            }
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-foreground">Session until</span>
          <input
            className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
            type="date"
            value={draft_filters.session_end_date}
            onChange={(event) =>
              set_draft_filters((prev) => ({
                ...prev,
                session_end_date: event.target.value,
              }))
            }
          />
        </label>

        <label className="block text-sm sm:col-span-2 lg:col-span-2">
          <span className="font-medium text-foreground">Client search</span>
          <input
            className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="Name, email, or phone"
            type="search"
            value={draft_filters.search}
            onChange={(event) =>
              set_draft_filters((prev) => ({ ...prev, search: event.target.value }))
            }
          />
        </label>

        <div className="flex flex-wrap items-end gap-2">
          <Button disabled={is_pending} size="sm" type="submit">
            {is_pending ? 'Loading…' : 'Apply filters'}
          </Button>
          <Button disabled={is_pending} size="sm" type="button" variant="secondary" onClick={reset_filters}>
            Reset
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-foreground/70">
        <p>
          Showing {bookings.length} booking{bookings.length === 1 ? '' : 's'}
          {filters.search.trim() ? ` matching “${filters.search.trim()}”` : ''}
          {filters.session_start_date || filters.session_end_date
            ? ` · sessions ${filters.session_start_date || '…'} – ${filters.session_end_date || '…'}`
            : ''}
        </p>
        <p>Latest {STAFF_BOOKINGS_LIMIT} records</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {bookings.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground/60">
          No bookings match the current filters.
        </p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingRow booking={booking} key={booking.id} />
          ))}
        </div>
      )}
    </div>
  );
}
