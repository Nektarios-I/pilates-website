'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';

import {
  build_date_pill_range,
  is_slot_full,
  slot_is_selectable,
} from '@/app/(marketing)/book/booking-ui';
import { DateNavigationHeading, DatePillStrip } from '@/app/(marketing)/book/components/date-pill-strip';
import { TimeSlotPicker } from '@/app/(marketing)/book/components/time-slot-picker';
import {
  get_day_schedule,
  get_slots_for_day,
  type SessionCard,
  type SlotSession,
} from '@/app/(marketing)/book/schedule-actions';
import { Button } from '@/components/ui/button';
import {
  add_days,
  generate_hourly_slots,
  parse_date_key,
  studio_date_key,
} from '@/lib/schedule/studio-hours';

export type SlotBookingConfirmPayload = {
  session_card: SessionCard;
  date_key: string;
  slot: SlotSession;
};

type SlotBookingPickerProps = {
  session_cards: SessionCard[];
  confirm_label?: string;
  heading?: string;
  on_confirm: (payload: SlotBookingConfirmPayload) => Promise<{ success: boolean; error?: string }>;
};

export function SlotBookingPicker({
  session_cards,
  confirm_label = 'Confirm booking',
  heading = 'Choose class and time',
  on_confirm,
}: SlotBookingPickerProps) {
  const today = useMemo(() => new Date(), []);
  const today_key = studio_date_key(today);

  const [anchor, set_anchor] = useState(() => parse_date_key(today_key));
  const [selected_date, set_selected_date] = useState(today_key);
  const [selected_card_id, set_selected_card_id] = useState(session_cards[0]?.id ?? '');
  const [day_schedule, set_day_schedule] = useState<Awaited<ReturnType<typeof get_day_schedule>> | null>(
    null,
  );
  const [slots, set_slots] = useState<SlotSession[]>([]);
  const [selected_slot, set_selected_slot] = useState<SlotSession | null>(null);
  const [show_available_only, set_show_available_only] = useState(false);
  const [error, set_error] = useState('');
  const [load_error, set_load_error] = useState('');
  const [loading_day, set_loading_day] = useState(false);
  const [is_pending, start_transition] = useTransition();

  const date_pills = useMemo(() => build_date_pill_range(anchor), [anchor]);
  const selected_card =
    session_cards.find((card) => card.id === selected_card_id) ?? session_cards[0] ?? null;

  useEffect(() => {
    if (selected_card) {
      load_day(selected_date, selected_card);
    }
    // Initial slot load for the default class/day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    load_day(date_key);
  }

  function select_card(card: SessionCard) {
    set_selected_card_id(card.id);
    set_selected_slot(null);
    set_error('');
    load_day(selected_date, card);
  }

  function handle_confirm() {
    if (!selected_slot || !selected_card) return;

    start_transition(async () => {
      set_error('');
      const result = await on_confirm({
        session_card: selected_card,
        date_key: selected_date,
        slot: selected_slot,
      });

      if (!result.success) {
        set_error(result.error ?? 'Booking failed.');
        return;
      }

      set_selected_slot(null);
      load_day(selected_date, selected_card);
    });
  }

  const hourly_slots = day_schedule
    ? generate_hourly_slots(day_schedule.time_ranges, selected_card?.duration_minutes ?? 60)
    : [];

  if (session_cards.length === 0) {
    return (
      <p className="text-sm text-foreground/60">No session cards are available for booking.</p>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <h3 className="text-sm font-semibold text-foreground">{heading}</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {session_cards.map((card) => {
          const is_selected = card.id === selected_card?.id;
          return (
            <button
              key={card.id}
              className={[
                'rounded-md border px-4 py-3 text-left text-sm transition-colors',
                is_selected
                  ? 'border-accent bg-surface text-foreground'
                  : 'border-border bg-background text-foreground hover:bg-surface',
              ].join(' ')}
              onClick={() => select_card(card)}
              type="button"
            >
              <p className="font-medium">{card.title}</p>
              <p className="mt-1 text-xs text-foreground/70">
                {card.session_type} · {card.duration_minutes} min
              </p>
            </button>
          );
        })}
      </div>

      <DateNavigationHeading
        anchor={anchor}
        on_next={() => set_anchor(add_days(anchor, 7))}
        on_prev={() => set_anchor(add_days(anchor, -7))}
        on_today={() => {
          set_anchor(parse_date_key(today_key));
          select_date_key(today_key);
        }}
      />

      <DatePillStrip
        dates={date_pills}
        heading="Choose a day"
        on_select={(date_key) => select_date_key(date_key)}
        selected_date={selected_date}
        today={today}
      />

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">Available times</p>
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
          <p className="text-sm text-foreground/60">Loading available times…</p>
        ) : load_error ? (
          <p className="text-sm text-danger-foreground">{load_error}</p>
        ) : day_schedule?.is_closed ? (
          <p className="text-sm text-foreground/70">Studio closed on this day.</p>
        ) : hourly_slots.length === 0 ? (
          <p className="text-sm text-foreground/70">No sessions available.</p>
        ) : (
          <TimeSlotPicker
            date_key={selected_date}
            hourly_slots={hourly_slots}
            on_select={(slot) => {
              if (
                is_slot_full(slot) ||
                !slot_is_selectable(false, false, slot.open_for_public_booking)
              ) {
                return;
              }
              set_selected_slot(slot);
              set_error('');
            }}
            selected_slot={selected_slot}
            show_available_only={show_available_only}
            slots={slots}
          />
        )}
      </div>

      {selected_slot &&
      slot_is_selectable(
        false,
        is_slot_full(selected_slot),
        selected_slot.open_for_public_booking,
      ) ? (
        <div className="rounded-md border border-border bg-surface/60 p-4">
          <p className="text-sm text-foreground">
            {selected_card?.title} · {selected_date} · {selected_slot.slot_start} –{' '}
            {selected_slot.slot_end}
          </p>
          {error ? <p className="mt-2 text-sm text-danger-foreground">{error}</p> : null}
          <Button
            className="mt-4"
            disabled={
              is_pending ||
              !slot_is_selectable(
                false,
                is_slot_full(selected_slot),
                selected_slot.open_for_public_booking,
              )
            }
            onClick={handle_confirm}
            type="button"
          >
            {is_pending ? 'Booking…' : confirm_label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
