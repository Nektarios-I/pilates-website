'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { format_day_heading } from '@/features/bookings/day-bookings';
import {
  accessible_day_label,
  build_day_hour_slots,
  current_studio_year_month,
  format_compact_type_counts_label,
  format_slot_counts_label,
  format_type_counts_label,
  shift_year_month,
  year_dropdown_options,
  type MonthCalendarDay,
  type MonthCalendarHourSlot,
  type MonthCalendarOverview,
  type MonthCalendarSlotBooking,
} from '@/features/bookings/month-calendar';
import { load_client_dashboard } from '@/features/client-booking-manager/actions';
import { filter_client_bookings } from '@/features/client-booking-manager/booking-filters';
import { format_session_datetime } from '@/features/client-booking-manager/format';
import type { ClientDashboardData } from '@/features/client-booking-manager/types';

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const GRADE_CLASS: Record<MonthCalendarDay['grade'], string> = {
  0: 'border-border/40 bg-background text-foreground/55',
  1: 'border-border bg-surface-2/25',
  2: 'border-border bg-surface-2/55',
  3: 'border-border bg-surface-2',
  4: 'border-accent bg-accent/45',
};

const SELECT_CLASS =
  'min-h-11 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusable_elements(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) =>
      element.tabIndex !== -1 &&
      !element.hasAttribute('inert') &&
      !element.closest('[inert]'),
  );
}

function trap_dialog_tab(event: ReactKeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Tab') return;
  const root = event.currentTarget;
  const items = focusable_elements(root);
  if (items.length === 0) return;

  const first = items[0]!;
  const last = items[items.length - 1]!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

const BOOKING_KIND_CLASS: Record<MonthCalendarSlotBooking['kind'], string> = {
  reformer: 'border-accent bg-accent/20',
  mat: 'border-info-border bg-info-surface',
  private: 'border-success-border bg-success-surface',
  intro: 'border-success-border bg-success-surface',
  other: 'border-warning-border bg-warning-surface',
};

type MonthCalendarSectionProps = {
  overview: MonthCalendarOverview;
  is_pending: boolean;
  error?: string | null;
  on_navigate_month: (year: number, month: number) => void;
};

export function BookingBox({
  booking,
  on_select,
}: {
  booking: MonthCalendarSlotBooking;
  on_select: (booking: MonthCalendarSlotBooking) => void;
}) {
  return (
    <button
      className={[
        'min-h-11 min-w-[6.75rem] shrink-0 cursor-pointer rounded-md border px-3 py-2 text-left transition-colors duration-200 motion-reduce:transition-none sm:min-w-[7.5rem]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        BOOKING_KIND_CLASS[booking.kind],
      ].join(' ')}
      aria-label={`${booking.compact_name}, ${booking.session_type_label}`}
      data-kind={booking.kind}
      type="button"
      onClick={() => on_select(booking)}
    >
      <span className="block truncate text-sm font-medium text-foreground">{booking.compact_name}</span>
      <span className="mt-0.5 block text-[11px] uppercase tracking-wide text-foreground/70">
        {booking.session_type_label}
      </span>
    </button>
  );
}

function SlotRow({
  slot,
  on_select_booking,
}: {
  slot: MonthCalendarHourSlot;
  on_select_booking: (booking: MonthCalendarSlotBooking) => void;
}) {
  const has_bookings =
    slot.reformer.length + slot.mat.length + slot.other.length > 0;

  return (
    <div
      className={[
        'flex min-h-[4.75rem] border-b border-border/70',
        has_bookings ? 'bg-surface' : 'bg-background/70',
      ].join(' ')}
      data-empty={!has_bookings}
      data-hour={slot.time_label}
    >
      <div
        className={[
          'sticky left-0 z-10 flex w-11 shrink-0 items-start justify-center border-r border-border/70 px-1 py-3 sm:w-12',
          has_bookings ? 'bg-surface' : 'bg-background',
        ].join(' ')}
      >
        <span className="text-sm font-semibold tabular-nums text-foreground">{slot.time_label}</span>
      </div>
      <div className="min-w-0 flex-1 py-2 pr-3">
        <p className="text-[11px] font-medium text-foreground/70">
          {format_slot_counts_label(slot.counts)}
        </p>
        <div className="relative mt-2">
          {has_bookings ? (
            <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 pr-8 [scrollbar-width:thin]">
              {slot.reformer.length > 0 ? (
                <p className="sr-only">Reformer bookings</p>
              ) : null}
              {slot.reformer.map((booking) => (
                <BookingBox booking={booking} key={booking.id} on_select={on_select_booking} />
              ))}
              {slot.mat.length > 0 ? (
                <div
                  aria-hidden="true"
                  className="mx-1 w-px shrink-0 self-stretch bg-border"
                />
              ) : null}
              {slot.mat.map((booking) => (
                <BookingBox booking={booking} key={booking.id} on_select={on_select_booking} />
              ))}
              {slot.other.length > 0 ? (
                <div
                  aria-hidden="true"
                  className="mx-1 w-px shrink-0 self-stretch bg-border"
                />
              ) : null}
              {slot.other.map((booking) => (
                <BookingBox booking={booking} key={booking.id} on_select={on_select_booking} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-foreground/50">No bookings in this hour.</p>
          )}
          {has_bookings ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface to-transparent"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BookingClientDetailPopup({
  booking,
  on_close,
}: {
  booking: MonthCalendarSlotBooking;
  on_close: () => void;
}) {
  const title_id = useId();
  const dialog_ref = useRef<HTMLDivElement>(null);
  const [dashboard, set_dashboard] = useState<ClientDashboardData | null>(null);
  const [error, set_error] = useState<string | null>(null);
  const [loading, set_loading] = useState(true);

  useEffect(() => {
    const root = dialog_ref.current;
    if (!root) return;
    const previously = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const items = focusable_elements(root);
    const initial = items.find((element) => element.dataset.dialogInitialFocus === 'true') ?? items[0];
    initial?.focus();
    return () => {
      previously?.focus();
    };
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function on_keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        on_close();
      }
    }

    document.addEventListener('keydown', on_keydown, true);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', on_keydown, true);
    };
  }, [on_close]);

  useEffect(() => {
    let cancelled = false;

    void load_client_dashboard(booking.user_id)
      .then((data) => {
        if (cancelled) return;
        set_dashboard(data);
        set_loading(false);
      })
      .catch(() => {
        if (cancelled) return;
        set_error('Unable to load client details.');
        set_loading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [booking.user_id]);

  const upcoming = dashboard ? filter_client_bookings(dashboard.bookings, 'upcoming') : [];
  const finished = dashboard ? filter_client_bookings(dashboard.bookings, 'finished') : [];
  const other_bookings = [...upcoming, ...finished].filter((item) => item.id !== booking.id);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-labelledby={title_id}
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-inverse/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      onKeyDown={trap_dialog_tab}
    >
      <button
        aria-label="Close client details backdrop"
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
        type="button"
        onClick={on_close}
      />
      <div
        className="relative flex max-h-[96vh] w-full max-w-lg flex-col overscroll-contain rounded-t-lg border border-border bg-background shadow-lg sm:max-h-[92vh] sm:rounded-lg"
        ref={dialog_ref}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
          <div>
            <h3 className="text-base font-semibold text-foreground" id={title_id}>
              {booking.compact_name}
            </h3>
            <p className="mt-0.5 text-sm text-foreground/70">{booking.session_type_label}</p>
          </div>
          <Button
            aria-label="Close client details"
            data-dialog-initial-focus="true"
            size="sm"
            type="button"
            variant="secondary"
            onClick={on_close}
          >
            Close
          </Button>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {loading ? <p className="text-sm text-foreground/60">Loading client details…</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {dashboard ? (
            <>
              <section>
                <h4 className="text-sm font-semibold text-foreground">Memberships</h4>
                {dashboard.packages.length === 0 ? (
                  <p className="mt-2 text-sm text-foreground/60">No active memberships.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {dashboard.packages.map((pkg) => (
                      <li
                        className="rounded-md border border-border px-3 py-2 text-sm"
                        key={pkg.user_package_id}
                      >
                        <p className="font-medium text-foreground">{pkg.package_name}</p>
                        <p className="mt-0.5 text-xs text-foreground/65">
                          {pkg.class_type} · {pkg.package_type}
                        </p>
                        <p className="mt-1 text-sm text-foreground/80">
                          {pkg.credits_remaining === null
                            ? 'Unlimited credits'
                            : `${pkg.credits_remaining} credits remaining`}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section>
                <h4 className="text-sm font-semibold text-foreground">Other bookings</h4>
                {other_bookings.length === 0 ? (
                  <p className="mt-2 text-sm text-foreground/60">No other bookings.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {other_bookings.slice(0, 12).map((item) => (
                      <li
                        className="rounded-md border border-border/70 px-3 py-2 text-sm text-foreground/80"
                        key={item.id}
                      >
                        <p className="font-medium text-foreground">{item.session_title}</p>
                        <p className="mt-0.5">{format_session_datetime(item.session_starts_at)}</p>
                        <p className="mt-0.5 text-xs uppercase tracking-wide text-foreground/60">
                          {item.status} · {item.session_type}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function DayDetailPopup({
  date_key,
  overview,
  on_close,
}: {
  date_key: string;
  overview: MonthCalendarOverview;
  on_close: () => void;
}) {
  const title_id = useId();
  const dialog_ref = useRef<HTMLDivElement>(null);
  const [selected_booking, set_selected_booking] = useState<MonthCalendarSlotBooking | null>(null);
  const slots = useMemo(
    () => build_day_hour_slots({ date_key, bookings: overview.bookings }),
    [date_key, overview.bookings],
  );
  const heading = format_day_heading(date_key);

  useEffect(() => {
    const root = dialog_ref.current;
    if (!root) return;
    const previously = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const items = focusable_elements(root);
    const initial = items.find((element) => element.dataset.dialogInitialFocus === 'true') ?? items[0];
    initial?.focus();
    return () => {
      previously?.focus();
    };
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function on_keydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !selected_booking) {
        event.preventDefault();
        on_close();
      }
    }

    document.addEventListener('keydown', on_keydown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', on_keydown);
    };
  }, [on_close, selected_booking]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-labelledby={title_id}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-inverse/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      onKeyDown={trap_dialog_tab}
    >
      <button
        aria-label="Close day details backdrop"
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
        type="button"
        onClick={on_close}
      />
      <div
        className="relative flex h-[96vh] w-full max-w-5xl flex-col overscroll-contain rounded-t-lg border border-border bg-background shadow-lg sm:h-auto sm:max-h-[92vh] sm:rounded-lg"
        inert={selected_booking ? true : undefined}
        ref={dialog_ref}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground" id={title_id}>
              {heading}
            </h2>
            <p className="mt-0.5 text-sm text-foreground/70">All hours in studio time</p>
          </div>
          <Button
            aria-label="Close day details"
            data-dialog-initial-focus="true"
            size="sm"
            type="button"
            variant="secondary"
            onClick={on_close}
          >
            Close
          </Button>
        </div>
        <div
          aria-label="Hourly schedule"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background"
        >
          {slots.map((slot) => (
            <SlotRow
              key={slot.time_label}
              slot={slot}
              on_select_booking={set_selected_booking}
            />
          ))}
        </div>
      </div>
      {selected_booking ? (
        <BookingClientDetailPopup
          booking={selected_booking}
          key={selected_booking.id}
          on_close={() => set_selected_booking(null)}
        />
      ) : null}
    </div>,
    document.body,
  );
}

function MonthSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading month calendar" className="space-y-3" role="status">
      <div className="h-10 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 42 }, (_, index) => (
          <div className="h-20 animate-pulse rounded-md bg-muted motion-reduce:animate-none" key={index} />
        ))}
      </div>
      <span className="sr-only">Loading month calendar</span>
    </div>
  );
}

function DayCell({
  day,
  on_select,
}: {
  day: MonthCalendarDay;
  on_select: (date_key: string) => void;
}) {
  return (
    <button
      aria-current={day.is_today ? 'date' : undefined}
      aria-label={accessible_day_label(day)}
      className={[
        'flex min-h-14 cursor-pointer touch-manipulation flex-col items-start gap-0.5 rounded-md border px-1 py-1.5 text-left transition-colors duration-200 motion-reduce:transition-none sm:min-h-[5.5rem] sm:px-2 sm:py-2',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        GRADE_CLASS[day.grade],
        day.is_today ? 'ring-1 ring-accent/50' : '',
        day.is_current_month ? '' : 'opacity-55',
      ].join(' ')}
      data-current-month={day.is_current_month}
      data-grade={day.grade}
      type="button"
      onClick={() => on_select(day.date_key)}
    >
      <span className="flex w-full items-center justify-between gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-foreground/60">
          {day.weekday_short}
        </span>
        <span className="text-sm font-semibold tabular-nums text-foreground">{day.day_number}</span>
      </span>
      <span className="line-clamp-3 text-[9px] font-medium leading-tight text-foreground sm:hidden">
        {format_compact_type_counts_label(day.counts)}
      </span>
      <span className="hidden line-clamp-2 text-[11px] font-medium leading-tight text-foreground sm:block">
        {format_type_counts_label(day.counts)}
      </span>
      {day.is_today ? (
        <span className="text-[9px] font-medium uppercase tracking-wide text-accent">Today</span>
      ) : null}
    </button>
  );
}

export function MonthCalendarSection({
  overview,
  is_pending,
  error = null,
  on_navigate_month,
}: MonthCalendarSectionProps) {
  const [selected_date_key, set_selected_date_key] = useState<string | null>(null);
  const now = current_studio_year_month();
  const years = year_dropdown_options(overview.year, now.year);

  return (
    <section aria-labelledby="month-calendar-heading" className="space-y-3" role="region">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground" id="month-calendar-heading">
            Month calendar
          </h2>
          <p className="mt-0.5 text-xs text-foreground/70">{overview.month_label}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="min-w-11 px-3"
            aria-label="Previous month"
            disabled={is_pending}
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => {
              set_selected_date_key(null);
              const next = shift_year_month(overview.year, overview.month, -1);
              on_navigate_month(next.year, next.month);
            }}
          >
            <span aria-hidden="true">‹</span>
          </Button>
          <label className="sr-only" htmlFor="month-calendar-month">
            Month
          </label>
          <select
            className={SELECT_CLASS}
            disabled={is_pending}
            id="month-calendar-month"
            value={overview.month}
            onChange={(event) => {
              set_selected_date_key(null);
              on_navigate_month(overview.year, Number(event.target.value));
            }}
          >
            {MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="month-calendar-year">
            Year
          </label>
          <select
            className={SELECT_CLASS}
            disabled={is_pending}
            id="month-calendar-year"
            value={overview.year}
            onChange={(event) => {
              set_selected_date_key(null);
              on_navigate_month(Number(event.target.value), overview.month);
            }}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <Button
            className="min-w-11 px-3"
            aria-label="Next month"
            disabled={is_pending}
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => {
              set_selected_date_key(null);
              const next = shift_year_month(overview.year, overview.month, 1);
              on_navigate_month(next.year, next.month);
            }}
          >
            <span aria-hidden="true">›</span>
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {is_pending ? (
        <MonthSkeleton />
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {WEEKDAY_HEADERS.map((label) => (
              <p
                className="text-center text-[10px] font-medium uppercase tracking-wide text-foreground/55"
                key={label}
              >
                {label}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {overview.days.map((day) => (
              <DayCell day={day} key={day.date_key} on_select={set_selected_date_key} />
            ))}
          </div>
        </div>
      )}

      {selected_date_key ? (
        <DayDetailPopup
          date_key={selected_date_key}
          overview={overview}
          on_close={() => set_selected_date_key(null)}
        />
      ) : null}
    </section>
  );
}
