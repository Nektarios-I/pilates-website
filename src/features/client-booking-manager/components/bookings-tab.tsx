'use client';

import { useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  format_booking_source,
  format_session_datetime,
} from '@/features/client-booking-manager/format';
import {
  filter_client_bookings,
  type ClientBookingFilter,
} from '@/features/client-booking-manager/booking-filters';
import { staff_cancel_client_booking } from '@/features/client-booking-manager/actions';
import type { ClientBookingRecord } from '@/features/client-booking-manager/types';

type BookingsTabProps = {
  bookings: ClientBookingRecord[];
  on_refresh: () => void;
};

const FILTER_OPTIONS: { value: ClientBookingFilter; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'finished', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function BookingsTab({ bookings, on_refresh }: BookingsTabProps) {
  const [filter, set_filter] = useState<ClientBookingFilter>('upcoming');
  const [message, set_message] = useState('');
  const [error, set_error] = useState('');
  const [is_pending, start_transition] = useTransition();

  const visible_bookings = useMemo(
    () => filter_client_bookings(bookings, filter),
    [bookings, filter],
  );

  function handle_cancel(booking_id: string) {
    start_transition(async () => {
      set_message('');
      set_error('');
      const result = await staff_cancel_client_booking(booking_id);
      if (!result.success) {
        set_error(result.error);
        return;
      }
      set_message('Booking cancelled.');
      on_refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={[
              'rounded-full px-3 py-1.5 text-sm font-medium',
              filter === option.value
                ? 'bg-foreground text-background'
                : 'border border-border text-foreground/80',
            ].join(' ')}
            onClick={() => set_filter(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-danger-foreground">{error}</p> : null}

      {visible_bookings.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground/60">
          No {filter} bookings for this client.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible_bookings.map((booking) => (
            <li
              key={booking.id}
              className="rounded-md border border-border bg-background px-4 py-4 sm:px-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{booking.session_title}</p>
                  <p className="mt-1 text-sm text-foreground/70">
                    {format_session_datetime(booking.session_starts_at)}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-foreground/60">
                    {booking.status} · {booking.session_type} ·{' '}
                    {format_booking_source(booking.booking_source)}
                  </p>
                  {booking.credit_charges.length > 0 ? (
                    <p className="mt-1 text-xs text-foreground/60">
                      Credits:{' '}
                      {booking.credit_charges
                        .map((charge) => `${charge.class_type} ${charge.credits_used}`)
                        .join(', ')}
                    </p>
                  ) : null}
                  {booking.cancellation_reason ? (
                    <p className="mt-1 text-xs text-foreground/60">
                      Reason: {booking.cancellation_reason}
                    </p>
                  ) : null}
                </div>

                {filter === 'upcoming' && ['booked', 'waitlisted'].includes(booking.status) ? (
                  <Button
                    disabled={is_pending}
                    onClick={() => handle_cancel(booking.id)}
                    size="sm"
                    variant="secondary"
                  >
                    Cancel booking
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
