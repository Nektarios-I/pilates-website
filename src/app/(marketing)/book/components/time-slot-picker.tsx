'use client';

import type { HourlySlot } from '@/lib/schedule/studio-hours';

import { is_slot_full, is_slot_in_past, slot_is_selectable } from '../booking-ui';
import type { SlotSession } from '../schedule-actions';

type TimeSlotPickerProps = {
  date_key: string;
  hourly_slots: HourlySlot[];
  slots: SlotSession[];
  selected_slot: SlotSession | null;
  show_available_only: boolean;
  on_select: (slot: SlotSession) => void;
};

export function TimeSlotPicker({
  date_key,
  hourly_slots,
  slots,
  selected_slot,
  show_available_only,
  on_select,
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

        return (
          <button
            key={`${slot.start}-${slot.end}`}
            className={[
              'w-full rounded-full py-3 text-center font-sans text-[17px] transition-colors',
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
            {is_full ? (
              <span className="mt-0.5 block font-sans text-[11px] font-semibold uppercase tracking-wide">
                Full
              </span>
            ) : !is_open && !is_past ? (
              <span className="mt-0.5 block font-sans text-[11px] font-semibold uppercase tracking-wide">
                Recurring
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
