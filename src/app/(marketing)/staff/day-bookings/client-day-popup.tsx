'use client';

import { useEffect, useId, useState, useTransition, type ReactNode } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  load_client_dashboard,
  staff_cancel_client_booking,
  staff_mark_booking_not_attended,
} from '@/features/client-booking-manager/actions';
import { filter_client_bookings } from '@/features/client-booking-manager/booking-filters';
import { format_session_datetime } from '@/features/client-booking-manager/format';
import type { ClientBookingRecord, ClientDashboardData, ClientMembershipRecord } from '@/features/client-booking-manager/types';
import { evaluate_not_attended_eligibility } from '@/features/bookings/not-attended';
import { format_booking_status, type BookingStatus } from '@/features/bookings/staff-bookings';
import type { MonthCalendarSlotBooking } from '@/features/bookings/month-calendar';
import {
  partition_packages_by_lifecycle,
  type PackageLifecycleFields,
} from '@/lib/packages/lifecycle';

const PAGE_SIZE = 20;

type PopupTab = 'bookings' | 'memberships';

function can_mark_not_attended(booking: ClientBookingRecord, now: Date): boolean {
  return evaluate_not_attended_eligibility({
    now,
    booking_status: booking.status,
    session_status: booking.session_status || 'scheduled',
    session_ends_at: booking.session_ends_at,
    charge_count: booking.credit_charges.length,
    credits_used: booking.credits_used,
    class_types: booking.credit_charges.map((charge) => charge.class_type),
  }).ok;
}

function Group({
  title,
  count,
  open,
  children,
}: {
  title: string;
  count: number;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="rounded-md border border-border" open={open}>
      <summary className="cursor-pointer px-3 py-3 text-sm font-medium text-foreground">
        {title} ({count})
      </summary>
      <div className="space-y-2 border-t border-border px-3 py-3">{children}</div>
    </details>
  );
}

export function ClientDayPopup({
  booking,
  on_close,
}: {
  booking: MonthCalendarSlotBooking;
  on_close: () => void;
}) {
  const title_id = useId();
  const [dashboard, set_dashboard] = useState<ClientDashboardData | null>(null);
  const [error, set_error] = useState<string | null>(null);
  const [notice, set_notice] = useState<string | null>(null);
  const [loading, set_loading] = useState(true);
  const [tab, set_tab] = useState<PopupTab>('bookings');
  const [visible, set_visible] = useState(PAGE_SIZE);
  const [confirm, set_confirm] = useState<{ kind: 'cancel' | 'absent'; booking: ClientBookingRecord } | null>(null);
  const [loaded_at, set_loaded_at] = useState(() => new Date());
  const [is_pending, start_transition] = useTransition();

  function reload() {
    set_loading(true);
    void load_client_dashboard(booking.user_id)
      .then((data) => {
        set_dashboard(data);
        set_loaded_at(new Date());
        set_loading(false);
      })
      .catch(() => {
        set_error('Unable to load client details.');
        set_loading(false);
      });
  }

  useEffect(() => {
    let cancelled = false;
    void load_client_dashboard(booking.user_id)
      .then((data) => {
        if (cancelled) return;
        set_dashboard(data);
        set_loaded_at(new Date());
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

  const now = loaded_at;
  const bookings = dashboard?.bookings ?? [];
  const groups = {
    upcoming: filter_client_bookings(bookings, 'upcoming', now.getTime()),
    in_progress: filter_client_bookings(bookings, 'in_progress', now.getTime()),
    finished: filter_client_bookings(bookings, 'finished', now.getTime()),
    cancelled: filter_client_bookings(bookings, 'cancelled', now.getTime()),
    no_show: filter_client_bookings(bookings, 'no_show', now.getTime()),
    not_attended: filter_client_bookings(bookings, 'not_attended', now.getTime()),
  };
  const memberships =
    dashboard?.memberships && dashboard.memberships.length > 0
      ? dashboard.memberships
      : (dashboard?.packages ?? []).map((row) => ({
          user_package_id: row.user_package_id,
          package_name: row.package_name,
          class_type: row.class_type,
          credits_remaining: row.credits_remaining,
          expires_at: row.expires_at,
          status: 'active',
          purchased_at: new Date().toISOString(),
          is_replacement: false,
          replacement_source_booking_id: null,
        }));
  const lifecycle = partition_packages_by_lifecycle(
    memberships.map((row) => ({
      ...row,
      status: row.status as PackageLifecycleFields['status'],
    })),
    now,
  );
  const name = dashboard?.client_name || booking.full_name || booking.compact_name;
  const add_booking_href = `/staff/client-bookings?client=${encodeURIComponent(booking.user_id)}&return_to=${encodeURIComponent('/staff/day-bookings')}`;

  function run_confirmed() {
    if (!confirm) return;
    const current = confirm;
    start_transition(async () => {
      set_error(null);
      set_notice(null);
      const result =
        current.kind === 'cancel'
          ? await staff_cancel_client_booking(current.booking.id)
          : await staff_mark_booking_not_attended(current.booking.id);
      if (!result.success) {
        set_error(result.error);
        set_confirm(null);
        return;
      }
      set_notice(current.kind === 'cancel' ? 'Booking cancelled.' : 'Marked Not attended. One replacement credit was issued.');
      set_confirm(null);
      reload();
    });
  }

  function render_booking(item: ClientBookingRecord, mode: 'upcoming' | 'finished' | 'history') {
    const replacement = memberships.find((row) => row.replacement_source_booking_id === item.id);
    return (
      <li className="rounded-md border border-border/70 px-3 py-2 text-sm" key={item.id}>
        <p className="font-medium text-foreground">{item.session_title}</p>
        <p className="mt-0.5 text-foreground/75">{format_session_datetime(item.session_starts_at)}</p>
        <p className="mt-0.5 text-xs uppercase tracking-wide text-foreground/60">
          {format_booking_status(item.status as BookingStatus)} · {item.session_type}
        </p>
        {item.status === 'not_attended' ? (
          <p className="mt-1 text-xs text-foreground/70">
            Replacement credit awarded
            {replacement
              ? ` · ${replacement.class_type} · expires ${replacement.expires_at ? new Date(replacement.expires_at).toLocaleDateString('en-GB') : 'not set'}`
              : ''}
          </p>
        ) : null}
        {mode === 'upcoming' && ['booked', 'waitlisted'].includes(item.status) ? (
          <Button className="mt-2" disabled={is_pending} size="sm" type="button" variant="secondary" onClick={() => set_confirm({ kind: 'cancel', booking: item })}>
            Cancel booking
          </Button>
        ) : null}
        {mode === 'finished' && can_mark_not_attended(item, now) ? (
          <Button className="mt-2" disabled={is_pending} size="sm" type="button" variant="secondary" onClick={() => set_confirm({ kind: 'absent', booking: item })}>
            Mark not attended
          </Button>
        ) : null}
      </li>
    );
  }

  function render_page(rows: ClientBookingRecord[], mode: 'upcoming' | 'finished' | 'history') {
    const shown = rows.slice(0, visible);
    return (
      <>
        {shown.length === 0 ? <p className="text-sm text-foreground/60">None.</p> : <ul className="space-y-2">{shown.map((item) => render_booking(item, mode))}</ul>}
        {rows.length > shown.length ? (
          <Button size="sm" type="button" variant="secondary" onClick={() => set_visible((value) => value + PAGE_SIZE)}>
            Show older
          </Button>
        ) : null}
      </>
    );
  }

  return (
    <div
      aria-labelledby={title_id}
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-inverse/40 p-0 sm:items-center sm:p-4"
      role="dialog"
    >
      <button aria-label="Close client details backdrop" className="absolute inset-0 cursor-default" tabIndex={-1} type="button" onClick={on_close} />
      <div className="relative flex h-[100dvh] w-full max-w-none flex-col overflow-hidden bg-background shadow-lg sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-lg sm:border sm:border-border">
        <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-foreground" id={title_id}>{name}</h3>
              {dashboard?.client_phone ? <p className="mt-0.5 break-all text-sm text-foreground/70">{dashboard.client_phone}</p> : null}
            </div>
            <Button aria-label="Close client details" data-dialog-initial-focus="true" size="sm" type="button" variant="secondary" onClick={on_close}>
              Close
            </Button>
          </div>
          <Link className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-foreground underline" href={add_booking_href}>
            Add booking
          </Link>
          <div className="mt-3 flex gap-2" role="tablist">
            <button aria-selected={tab === 'bookings'} className="min-h-11 rounded-md px-3 text-sm font-medium" role="tab" type="button" onClick={() => set_tab('bookings')}>Bookings</button>
            <button aria-selected={tab === 'memberships'} className="min-h-11 rounded-md px-3 text-sm font-medium" role="tab" type="button" onClick={() => set_tab('memberships')}>Memberships</button>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {loading ? <p className="text-sm text-foreground/60">Loading client details…</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {notice ? <p className="text-sm text-foreground">{notice}</p> : null}
          {confirm ? (
            <div className="rounded-md border border-border p-3 text-sm">
              <p>
                {confirm.kind === 'cancel'
                  ? `Cancel ${name}'s ${confirm.booking.session_title} on ${format_session_datetime(confirm.booking.session_starts_at)}? Current cancellation rules will apply.`
                  : `Mark ${confirm.booking.session_title} on ${format_session_datetime(confirm.booking.session_starts_at)} as Not attended? The original package will not be changed. One replacement credit will be issued.`}
              </p>
              <div className="mt-3 flex gap-2">
                <Button disabled={is_pending} size="sm" type="button" onClick={run_confirmed}>{is_pending ? 'Working…' : 'Confirm'}</Button>
                <Button disabled={is_pending} size="sm" type="button" variant="secondary" onClick={() => set_confirm(null)}>Back</Button>
              </div>
            </div>
          ) : null}
          {tab === 'bookings' ? (
            <div className="space-y-3" role="tabpanel">
              <Group count={groups.in_progress.length} open title="In progress">{render_page(groups.in_progress, 'history')}</Group>
              <Group count={groups.upcoming.length} open title="Upcoming">{render_page(groups.upcoming, 'upcoming')}</Group>
              <Group count={groups.finished.length} title="Finished">{render_page(groups.finished, 'finished')}</Group>
              <Group count={groups.cancelled.length} title="Cancelled">{render_page(groups.cancelled, 'history')}</Group>
              <Group count={groups.no_show.length} title="No show">{render_page(groups.no_show, 'history')}</Group>
              <Group count={groups.not_attended.length} title="Not attended">{render_page(groups.not_attended, 'history')}</Group>
            </div>
          ) : (
            <MembershipGroups groups={lifecycle} />
          )}
        </div>
      </div>
    </div>
  );
}

function MembershipGroups({
  groups,
}: {
  groups: ReturnType<typeof partition_packages_by_lifecycle<ClientMembershipRecord & PackageLifecycleFields>>;
}) {
  const sections = [
    ['Active', groups.active, true],
    ['Expired', groups.expired, false],
    ['Exhausted', groups.exhausted, false],
    ['Cancelled', groups.cancelled, false],
  ] as const;
  return (
    <div className="space-y-3" role="tabpanel">
      {sections.map(([title, rows, open]) => (
        <Group count={rows.length} key={title} open={open} title={title}>
          {rows.length === 0 ? <p className="text-sm text-foreground/60">None.</p> : (
            <ul className="space-y-2">
              {rows.map((row) => (
                <li className="rounded-md border border-border/70 px-3 py-2 text-sm" key={row.user_package_id}>
                  <p className="font-medium">{row.is_replacement ? 'Replacement credit' : row.package_name}</p>
                  <p className="text-xs text-foreground/65">{row.class_type} · issued {new Date(row.purchased_at).toLocaleDateString('en-GB')}</p>
                  <p>{row.credits_remaining === null ? 'Unlimited' : `${row.credits_remaining} credits remaining`}</p>
                  <p className="text-xs text-foreground/65">{row.expires_at ? `Expires ${new Date(row.expires_at).toLocaleDateString('en-GB')}` : 'No expiry'}</p>
                </li>
              ))}
            </ul>
          )}
        </Group>
      ))}
    </div>
  );
}
