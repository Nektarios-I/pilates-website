'use client';

import { useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { ContentImage } from '@/components/ui/content-image';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import type { DaySchedule } from '@/lib/schedule/studio-hours';
import {
  add_days,
  format_day_number,
  format_month_year,
  format_weekday_short,
  generate_hourly_slots,
  get_month_grid,
  is_past_day,
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

const select_class =
  'mt-2 block w-full rounded-xl bg-background p-4 font-sans text-[17px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all';
const field_label_class =
  'block font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground';

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
      <div className="rounded-md border border-warning-border bg-warning-surface p-6">
        <p className="text-sm font-semibold text-warning-foreground">No bookable classes</p>
        <p className="mt-1 text-sm text-warning-foreground/90">
          Ask an owner or admin to add a session card before clients can book online.
        </p>
      </div>
    );
  }

  function render_day_button(date: Date) {
    const date_key = to_date_key(date);
    const is_selected = date_key === selected_date;
    const is_past = is_past_day(date, today);
    const in_month = view === 'month' ? date.getMonth() === anchor.getMonth() : true;
    const is_month_grid = view === 'month';

    return (
      <button
        key={date_key}
        className={[
          'flex flex-col items-center justify-center rounded-2xl transition-colors duration-200',
          is_month_grid
            ? 'min-h-14 w-full px-1 py-2 sm:min-h-16 sm:px-2'
            : 'min-w-[4.5rem] shrink-0 snap-start px-3 py-4 sm:min-w-20',
          is_past
            ? 'pointer-events-none cursor-not-allowed bg-surface text-foreground opacity-40'
            : is_selected
              ? 'cursor-pointer bg-inverse text-primary-foreground shadow-md'
              : 'cursor-pointer bg-surface text-foreground hover:bg-surface-2',
          view === 'month' && !in_month && !is_past ? 'opacity-40' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        disabled={is_past}
        onClick={() => select_date(date)}
        type="button"
      >
        <span className="mb-1 font-sans text-[11px] font-semibold uppercase leading-none tracking-widest sm:text-[13px]">
          {format_weekday_short(date)}
        </span>
        <span className="font-serif text-lg font-medium leading-none sm:text-xl">
          {format_day_number(date)}
        </span>
      </button>
    );
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-6">
      <div>
        <h2 className="font-serif font-medium text-2xl md:text-4xl leading-snug text-foreground mb-8">
          Choose a class
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {session_cards.map((card) => {
            const is_selected = card.id === selected_card?.id;
            return (
              <button
                key={card.id}
                className={[
                  'overflow-hidden rounded-2xl text-left transition-colors duration-200',
                  is_selected
                    ? 'bg-inverse text-primary-foreground'
                    : 'bg-surface text-foreground hover:bg-surface-2',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => select_card(card)}
                type="button"
              >
                {card.image_src ? (
                  <div className="relative h-32 w-full">
                    <ContentImage
                      alt={`${card.title} class`}
                      sizes="320px"
                      src={card.image_src}
                    />
                  </div>
                ) : (
                  <div className="h-32 w-full overflow-hidden">
                    <ImagePlaceholder className="h-full rounded-none rounded-t-2xl" />
                  </div>
                )}
                <div className="p-4 md:p-6">
                  <p
                    className={[
                      'font-serif font-medium text-xl leading-normal',
                      is_selected ? 'text-primary-foreground' : 'text-foreground',
                    ].join(' ')}
                  >
                    {card.title}
                  </p>
                  <p
                    className={[
                      'mt-1 font-sans text-sm leading-normal',
                      is_selected ? 'text-primary-foreground opacity-80' : 'text-foreground opacity-80',
                    ].join(' ')}
                  >
                    {card.description}
                  </p>
                  <div
                    className={[
                      'mt-3 flex flex-wrap gap-2 font-sans text-xs',
                      is_selected ? 'text-primary-foreground opacity-70' : 'text-foreground opacity-70',
                    ].join(' ')}
                  >
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
        <div className="rounded-md border border-success-border bg-success-surface p-5" role="status">
          <p className="text-sm font-semibold text-success">
            {confirmed.status === 'waitlisted' ? 'Added to waitlist' : 'Booking confirmed'}
          </p>
          <p className="mt-1 text-sm text-success">{confirmed.session_title}</p>
          <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:gap-4">
            <a className="inline-flex min-h-11 items-center font-medium text-success underline" href="/account">
              View account
            </a>
            <button
              className="inline-flex min-h-11 items-center font-medium text-success underline"
              onClick={() => set_confirmed(null)}
              type="button"
            >
              Book another
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap gap-2">
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

        <div className="flex min-w-0 items-center gap-2">
          <Button onClick={() => shift_anchor(-1)} size="sm" type="button" variant="secondary">
            Prev
          </Button>
          <p className="min-w-0 flex-1 text-center font-sans text-sm font-medium text-foreground sm:min-w-[10rem] sm:flex-none">
            {view === 'week'
              ? `${format_day_number(week_days[0])} – ${format_day_number(week_days[6])} ${format_month_year(anchor)}`
              : format_month_year(anchor)}
          </p>
          <Button onClick={() => shift_anchor(1)} size="sm" type="button" variant="secondary">
            Next
          </Button>
        </div>
      </div>

      <p className="mb-3 font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground">
        {view === 'week' ? 'Choose a day this week' : 'Choose a day'}
      </p>
      {view === 'week' ? (
        <div className="min-w-0 max-w-full overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-3 md:w-full md:justify-start">{week_days.map(render_day_button)}</div>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-7 gap-1.5 sm:gap-2">{month_days.map(render_day_button)}</div>
      )}

      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-foreground">
              {new Date(selected_date).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            <p className="mt-1 font-sans text-sm leading-normal text-foreground">
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
          <p className="mt-4 font-sans text-sm text-foreground opacity-80">Loading available times…</p>
        ) : day_schedule?.is_closed ? (
          <p className="mt-4 font-sans text-[17px] leading-relaxed text-foreground">
            Studio closed on this day.
          </p>
        ) : hourly_slots.length === 0 ? (
          <p className="mt-4 font-sans text-[17px] leading-relaxed text-foreground">
            No sessions available.
          </p>
        ) : (
          <>
            <p className="mt-10 mb-4 font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground">
              Available times
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                    'w-full py-3 rounded-xl text-center font-sans text-[17px] transition-colors',
                    is_unavailable
                      ? 'opacity-40 cursor-not-allowed bg-surface text-foreground'
                      : is_active
                        ? 'bg-inverse text-primary-foreground cursor-pointer'
                        : 'bg-surface text-foreground hover:bg-surface-2 cursor-pointer transition-colors',
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
                  <span>{slot.label}</span>
                  <span className="sr-only">
                    {is_past_slot ? 'Not available' : is_full ? 'Not available' : 'Available'}
                  </span>
                </button>
              );
            })}
            </div>
          </>
        )}
      </div>

      {selected_slot ? (
        <div className="mt-10 rounded-3xl bg-surface p-5 sm:p-8 flex flex-col gap-6">
          <div>
            <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-foreground">
              Confirm booking
            </h3>
            <p className="mt-2 font-sans text-[17px] leading-relaxed text-foreground opacity-80">
              {selected_card?.title ?? 'Class'} · {selected_date} · {selected_slot.slot_start} –{' '}
              {selected_slot.slot_end}
            </p>
          </div>

          <div className="space-y-4">
            {requires_reformer ? (
              <div>
                <label className={field_label_class} htmlFor="book-reformer-package">
                  Pay {selected_card?.reformer_credits_required} reformer credit
                  {selected_card?.reformer_credits_required === 1 ? '' : 's'} with
                </label>
                <select
                  className={select_class}
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
                  <p className="mt-2 text-xs text-destructive">
                    You do not have enough active reformer credits for this class.
                  </p>
                ) : null}
              </div>
            ) : null}

            {requires_mat ? (
              <div>
                <label className={field_label_class} htmlFor="book-mat-package">
                  Pay {selected_card?.mat_credits_required} mat credit
                  {selected_card?.mat_credits_required === 1 ? '' : 's'} with
                </label>
                <select
                  className={select_class}
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
                  <p className="mt-2 text-xs text-destructive">
                    You do not have enough active mat credits for this class.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              className="w-full sm:w-auto"
              disabled={is_pending || !can_pay_required_credits}
              onClick={handle_book}
              type="button"
            >
              {is_pending ? 'Booking…' : 'Confirm booking'}
            </Button>
            <Button
              className="w-full sm:w-auto"
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
