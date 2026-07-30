'use client';

import type { HourlySlot } from '@/lib/schedule/studio-hours';
import {
  build_session_availability,
  format_availability_label,
  type AvailabilityLabelMode,
} from '@/features/bookings/session-availability';

import { is_slot_full, is_slot_in_past, slot_is_selectable } from '../booking-ui';
import type { SlotSession } from '../schedule-actions';

type TimeSlotPickerProps = {
  date_key: string;
  hourly_slots: HourlySlot[];
  slots: SlotSession[];
  selected_slot: SlotSession | null;
  show_available_only: boolean;
  on_select: (slot: SlotSession) => void;
  /** Client: remaining spots. Staff: booked / capacity ratio. */
  availability_mode?: AvailabilityLabelMode;
};

export function TimeSlotPicker({
  date_key,
  hourly_slots,
  slots,
  selected_slot,
  show_available_only,
  on_select,
  availability_mode = 'remaining',
}: TimeSlotPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {hourly_slots.map((slot) => {
        const slot_state = slots.find(
          (entry) => entry.slot_start === slot.start && entry.slot_end === slot.end,
        );
        const is_past = is_slot_in_past(date_key, slot.start);
        const is_full = is_slot_full(slot_state);
        const is_open = slot_state?.open_for_public_booking ?? false;
        const is_selectable = slot_is_selectable(is_past, is_full, is_open);
        const is_active =
          selected_slot?.slot_start === slot.start && selected_slot?.slot_end === slot.end;

        if (show_available_only && !is_selectable) return null;

        const availability = slot_state
          ? build_session_availability(slot_state.capacity, slot_state.confirmed_count)
          : null;

        let status_label: string | null = null;
        if (is_full) {
          status_label = 'Full';
        } else if (!is_open && !is_past) {
          status_label = 'Recurring';
        } else if (availability && !is_past && is_open) {
          status_label = format_availability_label(availability, availability_mode);
        }

        const accessible_name = status_label
          ? `${slot.label}, ${status_label}`
          : slot.label;

        return (
          <button
            key={`${slot.start}-${slot.end}`}
            aria-label={accessible_name}
            className={[
              'w-full rounded-full px-2 py-3 text-center font-sans text-[17px] transition-colors',
              !is_selectable
                ? 'cursor-not-allowed bg-surface text-foreground opacity-40'
                : is_active
                  ? 'cursor-pointer bg-inverse text-primary-foreground'
                  : 'cursor-pointer bg-surface text-foreground hover:bg-surface-2',
            ].join(' ')}
            disabled={!is_selectable}
            onClick={() => {
              if (!is_selectable || !slot_state) return;
              on_select(slot_state);
            }}
            type="button"
          >
            <span>{slot.label}</span>
            {status_label ? (
              <span className="mt-0.5 block font-sans text-[11px] font-medium tracking-wide text-current/80">
                {status_label}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
