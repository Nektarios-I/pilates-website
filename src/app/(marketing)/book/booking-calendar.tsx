'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { ContentImage } from '@/components/ui/content-image';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import type { DaySchedule } from '@/lib/schedule/studio-hours';
import {
  add_days,
  generate_hourly_slots,
  parse_date_key,
  to_date_key,
} from '@/lib/schedule/studio-hours';

import {
  booking_action_label,
  build_date_pill_range,
  can_pay_required_credits,
  eligible_mat_packages,
  eligible_reformer_packages,
  is_slot_full,
  package_label,
  success_banner_title,
} from './booking-ui';
import { CANCELLATION_POLICY_BOOKING } from '@/lib/booking/cancellation-policy';
import type { PackageItem } from './booking-types';
import { DateNavigationHeading, DatePillStrip } from './components/date-pill-strip';
import { TimeSlotPicker } from './components/time-slot-picker';
import {
  book_slot_action,
  get_day_schedule,
  get_slots_for_day,
  type SessionCard,
  type SlotSession,
} from './schedule-actions';

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

export function BookingCalendar({
  packages,
  session_cards,
  initial_date,
  initial_schedule,
  initial_slots,
}: BookingCalendarProps) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const today_key = to_date_key(today);

  const [anchor, set_anchor] = useState(() => parse_date_key(initial_date));
  const [selected_date, set_selected_date] = useState(initial_date);
  const [selected_card_id, set_selected_card_id] = useState(session_cards[0]?.id ?? '');
  const [day_schedule, set_day_schedule] = useState<DaySchedule | null>(initial_schedule);
  const [slots, set_slots] = useState<SlotSession[]>(initial_slots);
  const [selected_slot, set_selected_slot] = useState<SlotSession | null>(null);
  const [selected_reformer_package, set_selected_reformer_package] = useState('');
  const [selected_mat_package, set_selected_mat_package] = useState('');
  const [show_available_only, set_show_available_only] = useState(false);
  const [error, set_error] = useState('');
  const [load_error, set_load_error] = useState('');
  const [confirmed, set_confirmed] = useState<{
    booking_id: string;
    session_title: string;
    status: string;
  } | null>(null);
  const [loading_day, set_loading_day] = useState(false);
  const [is_pending, start_transition] = useTransition();

  const date_pills = useMemo(() => build_date_pill_range(anchor), [anchor]);

  const selected_card =
    session_cards.find((card) => card.id === selected_card_id) ?? session_cards[0] ?? null;

  const credit_requirements = {
    reformer_credits_required: selected_card?.reformer_credits_required ?? 0,
    mat_credits_required: selected_card?.mat_credits_required ?? 0,
  };

  const requires_reformer = credit_requirements.reformer_credits_required > 0;
  const requires_mat = credit_requirements.mat_credits_required > 0;
  const reformer_packages = eligible_reformer_packages(packages, credit_requirements);
  const mat_packages = eligible_mat_packages(packages, credit_requirements);
  const selected_reformer_package_is_eligible = reformer_packages.some(
    (pkg) => pkg.id === selected_reformer_package,
  );
  const selected_mat_package_is_eligible = mat_packages.some(
    (pkg) => pkg.id === selected_mat_package,
  );
  const selected_reformer_package_value = selected_reformer_package_is_eligible
    ? selected_reformer_package
    : (reformer_packages[0]?.id ?? '');
  const selected_mat_package_value = selected_mat_package_is_eligible
    ? selected_mat_package
    : (mat_packages[0]?.id ?? '');
  const can_book = can_pay_required_credits(packages, credit_requirements);

  function load_day(date_key: string, card = selected_card) {
    set_loading_day(true);
    set_load_error('');
    set_error('');
    set_selected_slot(null);

    if (!card) {
      set_slots([]);
      set_loading_day(false);
      return;
    }

    void Promise.all([
      get_day_schedule(date_key),
      get_slots_for_day(date_key, card.session_type, card.duration_minutes),
    ])
      .then(([schedule, day_slots]) => {
        set_day_schedule(schedule);
        set_slots(day_slots);
      })
      .catch(() => {
        set_day_schedule(null);
        set_slots([]);
        set_load_error('Could not load times for this day. Please try again.');
      })
      .finally(() => {
        set_loading_day(false);
      });
  }

  function select_date_key(date_key: string) {
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

  function go_today() {
    set_anchor(today);
    select_date_key(today_key);
  }

  function shift_anchor(delta_weeks: number) {
    set_anchor(add_days(anchor, delta_weeks * 7));
  }

  function handle_book() {
    const reformer_package_to_use = selected_reformer_package_is_eligible
      ? selected_reformer_package
      : (reformer_packages[0]?.id ?? '');
    const mat_package_to_use = selected_mat_package_is_eligible
      ? selected_mat_package
      : (mat_packages[0]?.id ?? '');

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

      try {
        const refreshed = await get_slots_for_day(
          selected_date,
          selected_card.session_type,
          selected_card.duration_minutes,
        );
        set_slots(refreshed);
      } catch {
        // Booking succeeded; slot refresh is best-effort.
      }

      router.refresh();
    });
  }

  const hourly_slots = day_schedule
    ? generate_hourly_slots(day_schedule.time_ranges, selected_card?.duration_minutes ?? 60)
    : [];

  if (session_cards.length === 0) {
    return (
      <div className="rounded-2xl bg-warning-surface p-6">
        <p className="text-sm font-semibold text-warning-foreground">No bookable classes</p>
        <p className="mt-1 text-sm text-warning-foreground/90">
          Ask an owner or admin to add a session card before clients can book online.
        </p>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="rounded-2xl bg-warning-surface p-6">
        <p className="text-sm font-semibold text-warning-foreground">No active packages</p>
        <p className="mt-1 text-sm text-warning-foreground/90">
          You need an active package with available credits to book a class.
        </p>
        <a
          className="mt-4 inline-flex min-h-11 items-center font-sans font-medium text-warning-foreground underline"
          href="/pricing"
        >
          View pricing
        </a>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-6">
      <div>
        <h2 className="mb-8 font-serif font-medium text-2xl leading-snug text-foreground md:text-4xl">
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
                ].join(' ')}
                onClick={() => select_card(card)}
                type="button"
              >
                {card.image_src ? (
                  <div className="relative h-32 w-full">
                    <ContentImage alt={`${card.title} class`} sizes="320px" src={card.image_src} />
                  </div>
                ) : (
                  <div className="h-32 w-full overflow-hidden">
                    <ImagePlaceholder className="h-full rounded-none rounded-t-2xl" />
                  </div>
                )}
                <div className="p-4 md:p-6">
                  <p
                    className={[
                      'font-serif text-xl font-medium leading-normal',
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
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {confirmed ? (
        <div className="rounded-2xl bg-success-surface p-5" role="status">
          <p className="text-sm font-semibold text-success">{success_banner_title()}</p>
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

      <DateNavigationHeading
        anchor={anchor}
        on_next={() => shift_anchor(1)}
        on_prev={() => shift_anchor(-1)}
        on_today={go_today}
      />

      <DatePillStrip
        dates={date_pills}
        heading="Choose a day"
        on_select={(date_key) => select_date_key(date_key)}
        selected_date={selected_date}
        today={today}
      />

      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-medium leading-normal text-foreground md:text-2xl">
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
        ) : load_error ? (
          <div className="mt-4 rounded-2xl bg-danger-surface/40 p-4 text-sm text-danger-foreground">
            <p>{load_error}</p>
            <button
              className="mt-2 font-medium underline"
              onClick={() => load_day(selected_date)}
              type="button"
            >
              Retry
            </button>
          </div>
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
            <p className="mb-4 mt-10 font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground">
              Available times
            </p>
            <TimeSlotPicker
              date_key={selected_date}
              hourly_slots={hourly_slots}
              on_select={(slot) => {
                if (is_slot_full(slot)) return;
                set_selected_slot(slot);
                set_error('');
              }}
              selected_slot={selected_slot}
              show_available_only={show_available_only}
              slots={slots}
            />
          </>
        )}
      </div>

      {selected_slot ? (
        <div className="mt-10 flex flex-col gap-6 rounded-3xl bg-surface p-5 sm:p-8">
          <div>
            <h3 className="font-serif text-xl font-medium leading-normal text-foreground md:text-2xl">
              Confirm booking
            </h3>
            <p className="mt-2 font-sans text-[17px] leading-relaxed text-foreground opacity-80">
              {selected_card?.title ?? 'Class'} · {selected_date} · {selected_slot.slot_start} –{' '}
              {selected_slot.slot_end}
            </p>
            <p className="mt-3 text-sm text-foreground/70">{CANCELLATION_POLICY_BOOKING}</p>
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
                  {reformer_packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {package_label(pkg)}
                    </option>
                  ))}
                </select>
                {reformer_packages.length === 0 ? (
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
                  {mat_packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {package_label(pkg)}
                    </option>
                  ))}
                </select>
                {mat_packages.length === 0 ? (
                  <p className="mt-2 text-xs text-destructive">
                    You do not have enough active mat credits for this class.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              className="w-full sm:w-auto"
              disabled={is_pending || !can_book}
              onClick={handle_book}
              type="button"
            >
              {booking_action_label(is_pending)}
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
