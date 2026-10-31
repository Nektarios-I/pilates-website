'use client';

import { useEffect, useId, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { format_session_datetime } from '@/features/client-booking-manager/format';
import {
  load_guest_booking_detail,
  staff_cancel_client_booking,
  staff_update_guest_booking_action,
  type GuestBookingDetail,
} from '@/features/client-booking-manager/actions';
import { format_booking_status, format_session_type } from '@/features/bookings/staff-bookings';
import {
  GUEST_LABEL_MAX_LENGTH,
  GUEST_NOTE_MAX_LENGTH,
} from '@/features/bookings/guest-booking';

type GuestDetailPopupProps = {
  booking_id: string;
  on_close: () => void;
  on_changed?: () => void;
};

export function GuestDetailPopup({ booking_id, on_close, on_changed }: GuestDetailPopupProps) {
  const title_id = useId();
  const [detail, set_detail] = useState<GuestBookingDetail | null>(null);
  const [error, set_error] = useState<string | null>(null);
  const [notice, set_notice] = useState<string | null>(null);
  const [loading, set_loading] = useState(true);
  const [editing, set_editing] = useState(false);
  const [label, set_label] = useState('');
  const [note, set_note] = useState('');
  const [confirm_cancel, set_confirm_cancel] = useState(false);
  const [is_pending, start_transition] = useTransition();

  function reload() {
    set_loading(true);
    void load_guest_booking_detail(booking_id)
      .then((data) => {
        set_detail(data);
        if (data) {
          set_label(data.guest_label);
          set_note(data.guest_note ?? '');
        }
        set_loading(false);
      })
      .catch(() => {
        set_error('Unable to load guest details.');
        set_loading(false);
      });
  }

  useEffect(() => {
    let cancelled = false;
    void load_guest_booking_detail(booking_id)
      .then((data) => {
        if (cancelled) return;
        set_detail(data);
        if (data) {
          set_label(data.guest_label);
          set_note(data.guest_note ?? '');
        }
        set_loading(false);
      })
      .catch(() => {
        if (cancelled) return;
        set_error('Unable to load guest details.');
        set_loading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [booking_id]);

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
    document.addEventListener('keydown', on_keydown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', on_keydown);
    };
  }, [on_close]);

  if (typeof document === 'undefined') return null;

  const can_cancel = detail?.status === 'booked';
  const can_edit =
    detail != null && ['booked', 'finished', 'attended', 'cancelled'].includes(detail.status);

  return createPortal(
    <div
      aria-labelledby={title_id}
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-inverse/40 p-0 sm:items-center sm:p-4"
      role="dialog"
    >
      <button
        aria-label="Close guest details backdrop"
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
        type="button"
        onClick={on_close}
      />
      <div className="relative flex h-[100dvh] w-full max-w-none flex-col overflow-hidden bg-background shadow-lg sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-lg sm:border sm:border-border">
        <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-foreground/45">
                Guest
              </p>
              <h3 className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground" id={title_id}>
                {detail?.guest_label ?? 'Guest booking'}
              </h3>
            </div>
            <Button
              aria-label="Close guest details"
              data-dialog-initial-focus="true"
              size="sm"
              type="button"
              variant="secondary"
              onClick={on_close}
            >
              Close
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {loading ? <p className="text-sm text-foreground/60">Loading…</p> : null}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="text-sm text-success" role="status">
              {notice}
            </p>
          ) : null}

          {detail && !editing ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-foreground/55">Session</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {format_session_type(detail.session_type)} · {format_session_datetime(detail.starts_at)}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/55">Status</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {format_booking_status(detail.status as never)}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/55">Note</dt>
                <dd className="mt-0.5 text-foreground">{detail.guest_note?.trim() || 'No note'}</dd>
              </div>
              <div>
                <dt className="text-foreground/55">Created by</dt>
                <dd className="mt-0.5 text-foreground">
                  {detail.created_by_name ?? 'Staff'} ·{' '}
                  {new Date(detail.booked_at).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </dd>
              </div>
            </dl>
          ) : null}

          {detail && editing ? (
            <div className="space-y-3">
              <label className="block text-sm text-foreground">
                Name or label
                <input
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  maxLength={GUEST_LABEL_MAX_LENGTH}
                  value={label}
                  onChange={(event) => set_label(event.target.value)}
                />
              </label>
              <label className="block text-sm text-foreground">
                Note
                <textarea
                  className="mt-1 block min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  maxLength={GUEST_NOTE_MAX_LENGTH}
                  value={note}
                  onChange={(event) => set_note(event.target.value)}
                />
              </label>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {can_edit && !editing ? (
              <Button size="sm" type="button" variant="secondary" onClick={() => set_editing(true)}>
                Edit details
              </Button>
            ) : null}
            {editing ? (
              <>
                <Button
                  disabled={is_pending}
                  size="sm"
                  type="button"
                  onClick={() => {
                    start_transition(async () => {
                      set_error(null);
                      const result = await staff_update_guest_booking_action({
                        booking_id,
                        label,
                        note,
                      });
                      if (!result.success) {
                        set_error(result.error);
                        return;
                      }
                      set_notice('Guest details updated.');
                      set_editing(false);
                      reload();
                      on_changed?.();
                    });
                  }}
                >
                  {is_pending ? 'Saving…' : 'Save'}
                </Button>
                <Button size="sm" type="button" variant="secondary" onClick={() => set_editing(false)}>
                  Cancel edit
                </Button>
              </>
            ) : null}
            {can_cancel && !editing ? (
              <Button
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => set_confirm_cancel(true)}
              >
                Cancel booking
              </Button>
            ) : null}
          </div>

          {confirm_cancel ? (
            <div className="rounded-md border border-border bg-surface/50 p-3 text-sm">
              <p className="font-medium text-foreground">Cancel this guest booking?</p>
              <p className="mt-1 text-foreground/70">The place returns to the session. No credits are refunded.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  disabled={is_pending}
                  size="sm"
                  type="button"
                  onClick={() => {
                    start_transition(async () => {
                      set_error(null);
                      const result = await staff_cancel_client_booking(booking_id);
                      if (!result.success) {
                        set_error(result.error);
                        set_confirm_cancel(false);
                        return;
                      }
                      set_notice('Guest booking cancelled.');
                      set_confirm_cancel(false);
                      reload();
                      on_changed?.();
                    });
                  }}
                >
                  {is_pending ? 'Cancelling…' : 'Confirm cancel'}
                </Button>
                <Button size="sm" type="button" variant="secondary" onClick={() => set_confirm_cancel(false)}>
                  Keep booking
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
