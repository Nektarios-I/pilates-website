'use client';

import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

import type { SessionCard } from '@/app/(marketing)/book/schedule-actions';
import { get_slots_for_day } from '@/app/(marketing)/book/schedule-actions';
import { Button } from '@/components/ui/button';
import { SlotBookingPicker } from '@/features/bookings/components/slot-booking-picker';
import {
  GUEST_LABEL_MAX_LENGTH,
  GUEST_NOTE_MAX_LENGTH,
  new_guest_request_id,
  normalize_guest_attendees,
} from '@/features/bookings/guest-booking';
import {
  build_session_availability,
  format_remaining_spots_label,
} from '@/features/bookings/session-availability';
import { staff_book_guests_action } from '@/features/client-booking-manager/actions';
import { format_session_type } from '@/features/bookings/staff-bookings';

type GuestRow = { key: string; label: string; note: string };

type GuestBookingDialogProps = {
  open: boolean;
  session_cards: SessionCard[];
  on_close: () => void;
  on_success: (message: string) => void;
};

type SelectedSlot = {
  session_card: SessionCard;
  date_key: string;
  slot_start: string;
  slot_end: string;
  confirmed_count: number;
  capacity: number;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusable_elements(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => element.tabIndex !== -1 && !element.hasAttribute('inert'),
  );
}

function trap_dialog_tab(event: ReactKeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Tab') return;
  const items = focusable_elements(event.currentTarget);
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

function empty_row(): GuestRow {
  return { key: crypto.randomUUID(), label: '', note: '' };
}

export function GuestBookingDialog({
  open,
  session_cards,
  on_close,
  on_success,
}: GuestBookingDialogProps) {
  const title_id = useId();
  const dialog_ref = useRef<HTMLDivElement>(null);
  const [step, set_step] = useState<'pick' | 'guests'>('pick');
  const [selected, set_selected] = useState<SelectedSlot | null>(null);
  const [rows, set_rows] = useState<GuestRow[]>([empty_row()]);
  const [request_id] = useState(new_guest_request_id);
  const [error, set_error] = useState('');
  const [is_pending, start_transition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const root = dialog_ref.current;
    if (!root) return;
    const previously = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const items = focusable_elements(root);
    items[0]?.focus();
    const previous_overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function on_keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        on_close();
      }
    }
    document.addEventListener('keydown', on_keydown);
    return () => {
      document.body.style.overflow = previous_overflow;
      document.removeEventListener('keydown', on_keydown);
      previously?.focus();
    };
  }, [open, on_close]);

  if (!open || typeof document === 'undefined') return null;

  const availability = selected
    ? build_session_availability(selected.capacity, selected.confirmed_count)
    : null;
  const spots_left = availability?.spots_left ?? 0;
  const remaining_label = availability ? format_remaining_spots_label(availability) : null;

  function add_row() {
    if (rows.length >= Math.max(spots_left, 1)) return;
    set_rows((current) => [...current, empty_row()]);
  }

  function remove_row(key: string) {
    set_rows((current) => (current.length <= 1 ? current : current.filter((row) => row.key !== key)));
  }

  function submit() {
    if (!selected) return;
    const normalized = normalize_guest_attendees(
      rows.map((row) => ({ label: row.label, note: row.note || null })),
    );
    if (!normalized.ok) {
      set_error(normalized.error);
      return;
    }
    if (normalized.guests.length > spots_left) {
      set_error(
        spots_left <= 0
          ? 'This session is full. Choose another time.'
          : `Only ${spots_left} place${spots_left === 1 ? '' : 's'} available. Remove a guest or choose another time.`,
      );
      return;
    }

    set_error('');
    start_transition(async () => {
      const refreshed = await get_slots_for_day(
        selected.date_key,
        selected.session_card.session_type,
        selected.session_card.duration_minutes,
        selected.session_card.capacity,
        true,
      );
      const live = refreshed.find((slot) => slot.slot_start === selected.slot_start);
      const live_spots = live
        ? build_session_availability(live.capacity, live.confirmed_count).spots_left
        : 0;
      if (normalized.guests.length > live_spots) {
        set_selected({
          ...selected,
          confirmed_count: live?.confirmed_count ?? selected.confirmed_count,
          capacity: live?.capacity ?? selected.capacity,
        });
        set_error(
          live_spots <= 0
            ? 'This session just filled up. Choose another time.'
            : `Only ${live_spots} place${live_spots === 1 ? '' : 's'} left now. Remove a guest or choose another time.`,
        );
        return;
      }

      const result = await staff_book_guests_action({
        request_id,
        date_key: selected.date_key,
        slot_start: selected.slot_start,
        slot_end: selected.slot_end,
        session_card_id: selected.session_card.id,
        guests: normalized.guests,
      });

      if (!result.success) {
        set_error(result.error);
        return;
      }

      const count = result.result?.booking_ids.length ?? normalized.guests.length;
      on_success(count === 1 ? 'Booked 1 guest.' : `Booked ${count} guests.`);
      on_close();
    });
  }

  const weekday = selected
    ? new Date(`${selected.date_key}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long' })
    : '';

  return createPortal(
    <div
      aria-labelledby={title_id}
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-end justify-center bg-inverse/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      onKeyDown={trap_dialog_tab}
    >
      <button
        aria-label="Close guest booking backdrop"
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
        type="button"
        onClick={on_close}
      />
      <div
        className="relative flex h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-lg border border-border bg-background shadow-lg sm:h-auto sm:max-h-[92vh] sm:rounded-lg"
        ref={dialog_ref}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground" id={title_id}>
              Guest booking
            </h2>
            <p className="mt-0.5 text-sm text-foreground/70">
              Book walk-in guests without a client account or package.
            </p>
          </div>
          <Button size="sm" type="button" variant="secondary" onClick={on_close}>
            Close
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {step === 'pick' ? (
            <SlotBookingPicker
              booking_mode="staff_manual"
              confirm_label="Continue with guests"
              heading="Choose class and time"
              session_cards={session_cards}
              on_confirm={async ({ session_card, date_key, slot }) => {
                set_selected({
                  session_card,
                  date_key,
                  slot_start: slot.slot_start,
                  slot_end: slot.slot_end,
                  confirmed_count: slot.confirmed_count,
                  capacity: slot.capacity,
                });
                set_step('guests');
                set_error('');
                return { success: true };
              }}
            />
          ) : selected ? (
            <div className="space-y-5">
              <div className="rounded-md border border-border bg-surface/40 px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  {format_session_type(selected.session_card.session_type)} · {weekday} ·{' '}
                  {selected.slot_start.slice(0, 5)}–{selected.slot_end.slice(0, 5)}
                </p>
                <p className="mt-1 text-sm text-foreground/70">
                  {remaining_label === 'Full'
                    ? 'No places available'
                    : remaining_label?.replace('spots left', 'places available').replace('spot left', 'place available') ??
                      'Availability unavailable'}
                </p>
                <Button
                  className="mt-3"
                  size="sm"
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    set_step('pick');
                    set_error('');
                  }}
                >
                  Change session
                </Button>
              </div>

              <div className="space-y-4">
                {rows.map((row, index) => (
                  <fieldset className="space-y-3 rounded-md border border-border p-3" key={row.key}>
                    <legend className="px-1 text-sm font-medium text-foreground">
                      Guest {index + 1}
                    </legend>
                    <label className="block text-sm text-foreground">
                      Name or label
                      <input
                        className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        maxLength={GUEST_LABEL_MAX_LENGTH}
                        value={row.label}
                        onChange={(event) =>
                          set_rows((current) =>
                            current.map((item) =>
                              item.key === row.key ? { ...item, label: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="block text-sm text-foreground">
                      Note <span className="text-foreground/55">(optional)</span>
                      <textarea
                        className="mt-1 block min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        maxLength={GUEST_NOTE_MAX_LENGTH}
                        value={row.note}
                        onChange={(event) =>
                          set_rows((current) =>
                            current.map((item) =>
                              item.key === row.key ? { ...item, note: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </label>
                    {rows.length > 1 ? (
                      <Button
                        size="sm"
                        type="button"
                        variant="secondary"
                        onClick={() => remove_row(row.key)}
                      >
                        Remove guest
                      </Button>
                    ) : null}
                  </fieldset>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={rows.length >= spots_left || spots_left <= 0}
                  size="sm"
                  type="button"
                  variant="secondary"
                  onClick={add_row}
                >
                  Add another guest
                </Button>
              </div>

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                <Button size="sm" type="button" variant="secondary" onClick={on_close}>
                  Cancel
                </Button>
                <Button disabled={is_pending || spots_left <= 0} size="sm" type="button" onClick={submit}>
                  {is_pending
                    ? 'Booking…'
                    : rows.length === 1
                      ? 'Book 1 guest'
                      : `Book ${rows.length} guests`}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
