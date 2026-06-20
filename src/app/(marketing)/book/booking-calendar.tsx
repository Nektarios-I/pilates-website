'use client';

import { useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import type { DaySchedule } from '@/lib/schedule/studio-hours';
import {
  add_days,
  format_day_number,
  format_month_year,
  format_weekday_short,
  generate_hourly_slots,
  get_month_grid,
  is_past_day,
  is_same_day,
  parse_date_key,
  start_of_week_monday,
  to_date_key,
} from '@/lib/schedule/studio-hours';

import type { PackageItem } from './booking-panel';
import {
  book_slot_action,
  get_day_schedule,
  get_slots_for_day,
  type SessionCard,
  type SlotSession,
} from './schedule-actions';

type CalendarView = 'week' | 'month';

type BookingCalendarProps = {
  packages: PackageItem[];
  session_cards: SessionCard[];
  initial_date: string;
  initial_schedule: DaySchedule;
  initial_slots: SlotSession[];
};

function package_label(pkg: PackageItem): string {
  if (pkg.package_type === 'unlimited' || pkg.package_type === 'monthly') {
    return `${pkg.package_name} — unlimited`;
  }
  const credits = pkg.credits_remaining ?? 0;
  return `${pkg.package_name} — ${credits} credit${credits !== 1 ? 's' : ''}`;
}

function is_slot_in_past(date_key: string, slot_start: string): boolean {
  const [year, month, day] = date_key.split('-').map(Number);
  const [hours, minutes] = slot_start.split(':').map(Number);
  const slot_time = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return slot_time.getTime() <= Date.now();
}

export function BookingCalendar({
  packages,
  session_cards,
  initial_date,
  initial_schedule,
  initial_slots,
}: BookingCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const today_key = to_date_key(today);

  const [anchor, set_anchor] = useState(() => parse_date_key(initial_date));
  const [view, set_view] = useState<CalendarView>('week');
  const [selected_date, set_selected_date] = useState(initial_date);
  const [selected_card_id, set_selected_card_id] = useState(session_cards[0]?.id ?? '');
  const [day_schedule, set_day_schedule] = useState<DaySchedule | null>(initial_schedule);
  const [slots, set_slots] = useState<SlotSession[]>(initial_slots);
  const [selected_slot, set_selected_slot] = useState<SlotSession | null>(null);
  const [selected_reformer_package, set_selected_reformer_package] = useState('');
  const [selected_mat_package, set_selected_mat_package] = useState('');
  const [show_available_only, set_show_available_only] = useState(false);
  const [error, set_error] = useState('');
  const [confirmed, set_confirmed] = useState<{
    booking_id: string;
    session_title: string;
    status: string;
  } | null>(null);
  const [loading_day, set_loading_day] = useState(false);
  const [is_pending, start_transition] = useTransition();

  const week_days = useMemo(() => {
    const monday = start_of_week_monday(anchor);
    return Array.from({ length: 7 }, (_, index) => add_days(monday, index));
  }, [anchor]);

  const month_days = useMemo(() => get_month_grid(anchor), [anchor]);

  const selected_card =
    session_cards.find((card) => card.id === selected_card_id) ?? session_cards[0] ?? null;

  function load_day(date_key: string, card = selected_card) {
    set_loading_day(true);
    set_error('');

    if (!card) {
      set_slots([]);
      set_loading_day(false);
      return;
    }

    void Promise.all([
      get_day_schedule(date_key),
      get_slots_for_day(date_key, card.session_type, card.duration_minutes),
    ]).then(
      ([schedule, day_slots]) => {
        set_day_schedule(schedule);
        set_slots(day_slots);
        set_selected_slot(null);
        set_loading_day(false);
      },
    );
  }

  function select_date_key(date_key: string, date: Date) {
    if (is_past_day(date, today)) return;
    set_selected_date(date_key);
    set_confirmed(null);
    load_day(date_key);
  }

  function select_card(card: SessionCard) {
    set_selected_card_id(card.id);
    set_selected_slot(null);
    set_confirmed(null);
    set_error('');
    load_day(selected_date, card);
  }

  function select_date(date: Date) {
    select_date_key(to_date_key(date), date);
  }

  function go_today() {
    set_anchor(today);
    select_date_key(today_key, today);
    set_view('week');
  }

  function shift_anchor(delta: number) {
    if (view === 'week') {
      set_anchor(add_days(anchor, delta * 7));
      return;
    }
    const next = new Date(anchor);
    next.setMonth(next.getMonth() + delta);
    set_anchor(next);
  }

  function handle_book() {
    const reformer_package_to_use = selected_reformer_package_is_eligible
      ? selected_reformer_package
      : (eligible_reformer_packages[0]?.id ?? '');
    const mat_package_to_use = selected_mat_package_is_eligible
      ? selected_mat_package
      : (eligible_mat_packages[0]?.id ?? '');

    if (!selected_slot || !selected_card) return;
    if (requires_reformer && !reformer_package_to_use) return;
    if (requires_mat && !mat_package_to_use) return;

    start_transition(async () => {
      set_error('');
      const result = await book_slot_action(
        selected_date,
        selected_slot.slot_start,
        selected_slot.slot_end,
        requires_reformer ? reformer_package_to_use : null,
        requires_mat ? mat_package_to_use : null,
        selected_card.id,
      );

      if (!result.success) {
        set_error(result.error);
        return;
      }

      set_confirmed({
        booking_id: result.booking_id,
        session_title: result.session_title,
        status: result.status,
      });
      set_selected_slot(null);

      const refreshed = await get_slots_for_day(
        selected_date,
        selected_card.session_type,
        selected_card.duration_minutes,
      );
      set_slots(refreshed);
    });
  }

  const visible_days = view === 'week' ? week_days : month_days;
  const hourly_slots = day_schedule
    ? generate_hourly_slots(day_schedule.time_ranges, selected_card?.duration_minutes ?? 60)
    : [];

  const requires_reformer = (selected_card?.reformer_credits_required ?? 0) > 0;
  const requires_mat = (selected_card?.mat_credits_required ?? 0) > 0;
  const eligible_reformer_packages = packages.filter((pkg) => {
    if (pkg.class_type !== 'reformer') return false;
    if (pkg.package_type === 'unlimited' || pkg.package_type === 'monthly') return true;
    return (pkg.credits_remaining ?? 0) >= (selected_card?.reformer_credits_required ?? 0);
  });
  const eligible_mat_packages = packages.filter((pkg) => {
    if (pkg.class_type !== 'mat') return false;
    if (pkg.package_type === 'unlimited' || pkg.package_type === 'monthly') return true;
    return (pkg.credits_remaining ?? 0) >= (selected_card?.mat_credits_required ?? 0);
  });

  const selected_reformer_package_is_eligible = eligible_reformer_packages.some(
    (pkg) => pkg.id === selected_reformer_package,
  );
  const selected_mat_package_is_eligible = eligible_mat_packages.some(
    (pkg) => pkg.id === selected_mat_package,
  );
  const selected_reformer_package_value = selected_reformer_package_is_eligible
    ? selected_reformer_package
    : (eligible_reformer_packages[0]?.id ?? '');
  const selected_mat_package_value = selected_mat_package_is_eligible
    ? selected_mat_package
    : (eligible_mat_packages[0]?.id ?? '');
  const can_pay_required_credits =
    (!requires_reformer || eligible_reformer_packages.length > 0) &&
    (!requires_mat || eligible_mat_packages.length > 0);

  if (session_cards.length === 0) {
    return (
      <div className="rounded-md border border-amber-100 bg-amber-50 p-6">
        <p className="text-sm font-semibold text-amber-800">No bookable classes</p>
        <p className="mt-1 text-sm text-amber-700">
          Ask an owner or admin to add a session card before clients can book online.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-stone-950">Choose a class</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {session_cards.map((card) => {
            const is_selected = card.id === selected_card?.id;
            return (
              <button
                key={card.id}
                className={[
                  'overflow-hidden rounded-lg border bg-surface text-left transition-colors',
                  is_selected ? 'border-stone-950 ring-2 ring-stone-950 ring-offset-2' : 'border-border hover:border-stone-500',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => select_card(card)}
                type="button"
              >
                {card.image_src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="h-32 w-full object-cover" src={card.image_src} />
                ) : (
                  <div className="flex h-32 items-center justify-center bg-stone-100 text-sm font-medium text-stone-500">
                    {card.session_type === 'mat' ? 'Mat Pilates' : 'Reformer Pilates'}
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm font-semibold text-stone-950">{card.title}</p>
                  <p className="mt-1 text-sm text-stone-600">{card.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
                    <span>{card.duration_minutes} min</span>
                    <span>{card.instructor_name ?? 'Instructor varies'}</span>
                    <span>{card.session_type}</span>
                    <span>
                      {card.reformer_credits_required} reformer / {card.mat_credits_required} mat
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {confirmed ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-5" role="status">
          <p className="text-sm font-semibold text-emerald-800">
            {confirmed.status === 'waitlisted' ? 'Added to waitlist' : 'Booking confirmed'}
          </p>
          <p className="mt-1 text-sm text-emerald-700">{confirmed.session_title}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <a className="font-medium text-emerald-700 underline" href="/account">
              View account
            </a>
            <button
              className="font-medium text-emerald-700 underline"
              onClick={() => set_confirmed(null)}
              type="button"
            >
              Book another
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => set_view('week')}
            size="sm"
            type="button"
            variant={view === 'week' ? 'primary' : 'secondary'}
          >
            Week
          </Button>
          <Button
            onClick={() => set_view('month')}
            size="sm"
            type="button"
            variant={view === 'month' ? 'primary' : 'secondary'}
          >
            Month
          </Button>
          <Button onClick={go_today} size="sm" type="button" variant="secondary">
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => shift_anchor(-1)} size="sm" type="button" variant="secondary">
            Prev
          </Button>
          <p className="min-w-[10rem] text-center text-sm font-medium text-stone-950">
            {view === 'week'
              ? `${format_day_number(week_days[0])} – ${format_day_number(week_days[6])} ${format_month_year(anchor)}`
              : format_month_year(anchor)}
          </p>
          <Button onClick={() => shift_anchor(1)} size="sm" type="button" variant="secondary">
            Next
          </Button>
        </div>
      </div>

      <div
        className={
          view === 'week'
            ? 'grid grid-cols-7 gap-2'
            : 'grid grid-cols-7 gap-1 sm:gap-2'
        }
      >
        {(view === 'month' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : []).map((label) => (
          <div
            key={label}
            className="hidden text-center text-xs font-medium uppercase tracking-wide text-stone-500 sm:block"
          >
            {label}
          </div>
        ))}

        {visible_days.map((date) => {
          const date_key = to_date_key(date);
          const is_today = is_same_day(date, today);
          const is_selected = date_key === selected_date;
          const is_past = is_past_day(date, today);
          const in_month = view === 'month' ? date.getMonth() === anchor.getMonth() : true;

          return (
            <button
              key={date_key}
              className={[
                'rounded-md border px-2 py-3 text-left transition-colors',
                view === 'month' ? 'min-h-[3.25rem]' : 'min-h-[4.5rem]',
                is_past ? 'cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300' : '',
                !is_past && !is_selected && !is_today
                  ? 'border-border bg-surface hover:border-stone-400'
                  : '',
                is_today && !is_selected ? 'border-stone-950 ring-2 ring-stone-950 ring-offset-1' : '',
                is_selected && !is_today ? 'border-stone-900 bg-stone-900 text-white' : '',
                is_selected && is_today ? 'border-stone-900 bg-stone-900 text-white ring-2 ring-stone-400 ring-offset-1' : '',
                view === 'month' && !in_month ? 'opacity-40' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={is_past}
              onClick={() => select_date(date)}
              type="button"
            >
              {view === 'week' ? (
                <>
                  <span className="block text-xs font-medium uppercase opacity-80">
                    {format_weekday_short(date)}
                  </span>
                  <span className="mt-1 block text-2xl font-semibold">{format_day_number(date)}</span>
                </>
              ) : (
                <span className="block text-sm font-semibold">{format_day_number(date)}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-md border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-stone-950">
              {new Date(selected_date).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              {selected_card?.title ?? 'Selected class'}
            </p>
          </div>
          <Button
            onClick={() => set_show_available_only((value) => !value)}
            size="sm"
            type="button"
            variant={show_available_only ? 'primary' : 'secondary'}
          >
            {show_available_only ? 'Showing available' : 'Show available only'}
          </Button>
        </div>

        {loading_day ? (
          <p className="mt-4 text-sm text-stone-500">Loading available times…</p>
        ) : day_schedule?.is_closed ? (
          <p className="mt-4 text-sm text-stone-600">Studio closed on this day.</p>
        ) : hourly_slots.length === 0 ? (
          <p className="mt-4 text-sm text-stone-600">No sessions available.</p>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {hourly_slots.map((slot) => {
              const slot_state = slots.find(
                (entry) => entry.slot_start === slot.start && entry.slot_end === slot.end,
              );
              const is_past_slot = is_slot_in_past(selected_date, slot.start);
              const is_full =
                slot_state !== undefined && slot_state.confirmed_count >= slot_state.capacity;
              const is_unavailable = is_past_slot || is_full;
              const is_active =
                selected_slot?.slot_start === slot.start && selected_slot?.slot_end === slot.end;

              if (show_available_only && is_unavailable) return null;

              return (
                <button
                  key={`${slot.start}-${slot.end}`}
                  className={[
                    'rounded-md border px-4 py-3 text-left text-sm transition-colors',
                    is_unavailable
                      ? 'cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300'
                      : '',
                    !is_unavailable && !is_active ? 'border-border bg-background hover:border-stone-500' : '',
                    is_active ? 'border-stone-900 bg-stone-900 text-white' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={is_unavailable}
                  onClick={() => {
                    set_selected_slot(
                      slot_state ?? {
                        slot_start: slot.start,
                        slot_end: slot.end,
                        session_id: null,
                        confirmed_count: 0,
                        capacity: 6,
                      },
                    );
                    set_error('');
                  }}
                  type="button"
                >
                  <span className="font-medium">{slot.label}</span>
                  <span className={`mt-1 block text-xs ${is_active ? 'text-stone-200' : 'text-stone-500'}`}>
                    {selected_card?.session_type ?? 'Class'} ·{' '}
                    {is_past_slot ? 'Not available' : is_full ? 'Not available' : 'Available'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected_slot ? (
        <div className="rounded-md border border-stone-200 bg-stone-50 p-5">
          <h3 className="text-sm font-semibold text-stone-950">Confirm booking</h3>
          <p className="mt-1 text-sm text-stone-600">
            {selected_card?.title ?? 'Class'} · {selected_date} · {selected_slot.slot_start} –{' '}
            {selected_slot.slot_end}
          </p>

          <div className="mt-4 space-y-4">
            {requires_reformer ? (
              <div>
                <label className="block text-sm font-medium text-stone-950" htmlFor="book-reformer-package">
                  Pay {selected_card?.reformer_credits_required} reformer credit
                  {selected_card?.reformer_credits_required === 1 ? '' : 's'} with
                </label>
                <select
                  className="mt-2 block w-full rounded-md border border-stone-300 bg-white px-4 py-3 text-sm"
                  id="book-reformer-package"
                  onChange={(event) => set_selected_reformer_package(event.target.value)}
                  value={selected_reformer_package_value}
                >
                  {eligible_reformer_packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {package_label(pkg)}
                    </option>
                  ))}
                </select>
                {eligible_reformer_packages.length === 0 ? (
                  <p className="mt-2 text-xs text-red-600">
                    You do not have enough active reformer credits for this class.
                  </p>
                ) : null}
              </div>
            ) : null}

            {requires_mat ? (
              <div>
                <label className="block text-sm font-medium text-stone-950" htmlFor="book-mat-package">
                  Pay {selected_card?.mat_credits_required} mat credit
                  {selected_card?.mat_credits_required === 1 ? '' : 's'} with
                </label>
                <select
                  className="mt-2 block w-full rounded-md border border-stone-300 bg-white px-4 py-3 text-sm"
                  id="book-mat-package"
                  onChange={(event) => set_selected_mat_package(event.target.value)}
                  value={selected_mat_package_value}
                >
                  {eligible_mat_packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {package_label(pkg)}
                    </option>
                  ))}
                </select>
                {eligible_mat_packages.length === 0 ? (
                  <p className="mt-2 text-xs text-red-600">
                    You do not have enough active mat credits for this class.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <div className="mt-4 flex gap-3">
            <Button disabled={is_pending || !can_pay_required_credits} onClick={handle_book} type="button">
              {is_pending ? 'Booking…' : 'Confirm booking'}
            </Button>
            <Button
              disabled={is_pending}
              onClick={() => set_selected_slot(null)}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
