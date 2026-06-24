'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { book_session_action } from './actions';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SessionItem = {
  id: string;
  title: string;
  description: string | null;
  session_type: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  credits_required: number;
  location: string | null;
  instructor_name: string | null;
  confirmed_count: number;
};

export type PackageItem = {
  id: string;
  credits_remaining: number | null;
  expires_at: string | null;
  package_name: string;
  class_type: string;
  package_type: string;
};

type BookingPanelProps = {
  sessions: SessionItem[];
  packages: PackageItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_TYPE_LABELS: Record<string, string> = {
  reformer: 'Reformer',
  mat:      'Mat',
  private:  'Private',
  intro:    'Intro',
};

const select_class =
  'mt-2 block w-full rounded-xl bg-[#F4F1E8] p-4 font-sans text-[17px] text-[#2D3A1F] focus:outline-none focus:ring-2 focus:ring-[#B8A678] transition-all';
const field_label_class =
  'block font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F]';
const text_link_class =
  'inline-flex min-h-11 items-center font-sans font-medium text-[#2D3A1F] border-b border-[#B8A678] pb-0.5 transition-colors duration-200 hover:text-[#B8A678]';

function format_date(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function format_time(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function remaining_spots(session: SessionItem): number {
  return Math.max(0, session.capacity - session.confirmed_count);
}

function package_label(pkg: PackageItem): string {
  if (pkg.package_type === 'unlimited') {
    return `${pkg.package_name} — unlimited`;
  }
  const credits = pkg.credits_remaining ?? 0;
  const expiry = pkg.expires_at ? ` · expires ${format_date(pkg.expires_at)}` : '';
  return `${pkg.package_name} — ${credits} credit${credits !== 1 ? 's' : ''}${expiry}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Session card
// ─────────────────────────────────────────────────────────────────────────────

function SessionCard({
  session,
  is_selected,
  on_select,
}: {
  session: SessionItem;
  is_selected: boolean;
  on_select: () => void;
}) {
  const spots = remaining_spots(session);
  const is_full = spots === 0;

  return (
    <article
      className={[
        'rounded-2xl p-5 md:p-6 transition-colors duration-200',
        is_selected
          ? 'bg-[#2D3A1F] text-[#F4F1E8]'
          : 'bg-[#E8E2D0] text-[#2D3A1F] hover:bg-[#CDD2C9]',
      ].join(' ')}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                'inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-xs font-medium',
                is_selected ? 'bg-[#F4F1E8]/20 text-[#F4F1E8]' : 'bg-[#F4F1E8] text-[#2D3A1F]',
              ].join(' ')}
            >
              {SESSION_TYPE_LABELS[session.session_type] ?? session.session_type}
            </span>
            {is_full && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 font-sans text-xs font-medium text-amber-700">
                Waitlist
              </span>
            )}
          </div>
          <h3
            className={[
              'mt-2 font-serif font-medium text-xl leading-normal',
              is_selected ? 'text-[#F4F1E8]' : 'text-[#2D3A1F]',
            ].join(' ')}
          >
            {session.title}
          </h3>
          {session.description && (
            <p
              className={[
                'mt-1 font-sans text-sm leading-5',
                is_selected ? 'text-[#F4F1E8] opacity-80' : 'text-[#2D3A1F] opacity-80',
              ].join(' ')}
            >
              {session.description}
            </p>
          )}
          <div
            className={[
              'mt-3 flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs',
              is_selected ? 'text-[#F4F1E8] opacity-70' : 'text-[#2D3A1F] opacity-70',
            ].join(' ')}
          >
            <span>{format_date(session.starts_at)}</span>
            <span>
              {format_time(session.starts_at)} – {format_time(session.ends_at)}
            </span>
            {session.instructor_name && <span>{session.instructor_name}</span>}
            {session.location && <span>{session.location}</span>}
            <span>
              {is_full ? `Full · ${session.capacity} capacity` : `${spots} spot${spots !== 1 ? 's' : ''} left`}
            </span>
            <span>
              {session.credits_required} credit{session.credits_required !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <Button
          className="w-full shrink-0 sm:w-auto"
          size="sm"
          variant={is_selected ? 'primary' : 'secondary'}
          onClick={on_select}
        >
          {is_selected ? 'Selected' : is_full ? 'Join waitlist' : 'Select'}
        </Button>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Booking confirmation panel
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmBooking({
  session,
  packages,
  on_cancel,
  on_booked,
}: {
  session: SessionItem;
  packages: PackageItem[];
  on_cancel: () => void;
  on_booked: (booking_id: string, session_title: string, status: string) => void;
}) {
  const [selected_package, set_selected_package] = useState(packages[0]?.id ?? '');
  const [is_submitting, set_is_submitting] = useState(false);
  const [error, set_error] = useState<string | undefined>();

  const eligible_packages = packages.filter((p) => {
    if (p.package_type === 'unlimited') return true;
    return (p.credits_remaining ?? 0) >= session.credits_required;
  });

  async function handle_book() {
    if (!selected_package) {
      set_error('Please select a package.');
      return;
    }
    set_is_submitting(true);
    set_error(undefined);

    const result = await book_session_action(session.id, selected_package);

    if (result.success) {
      on_booked(result.booking.id, session.title, result.status);
    } else {
      set_error(result.error);
      set_is_submitting(false);
    }
  }

  return (
    <div className="mt-4 rounded-3xl bg-[#E8E2D0] p-8">
      <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F]">
        Confirm booking
      </h3>
      <p className="mt-2 font-sans text-[17px] leading-relaxed text-[#2D3A1F] opacity-80">
        <strong className="font-medium">{session.title}</strong> · {format_date(session.starts_at)} ·{' '}
        {format_time(session.starts_at)} – {format_time(session.ends_at)}
      </p>

      {eligible_packages.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-amber-50 p-4">
          <p className="font-sans text-sm font-medium text-amber-800">No eligible package</p>
          <p className="mt-1 font-sans text-sm text-amber-700">
            This session requires {session.credits_required} credit
            {session.credits_required !== 1 ? 's' : ''}. None of your active packages have
            sufficient credits. Contact the studio to purchase a package.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <label className={field_label_class} htmlFor="package-select">
            Pay with package
          </label>
          <select
            className={select_class}
            disabled={is_submitting}
            id="package-select"
            value={selected_package}
            onChange={(e) => set_selected_package(e.target.value)}
          >
            {eligible_packages.map((p) => (
              <option key={p.id} value={p.id}>
                {package_label(p)}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div
          aria-live="polite"
          className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {eligible_packages.length > 0 && (
          <Button
            className="w-full sm:w-auto"
            disabled={is_submitting || !selected_package}
            size="md"
            type="button"
            onClick={handle_book}
          >
            {is_submitting ? 'Booking…' : 'Confirm booking'}
          </Button>
        )}
        <Button
          className="w-full sm:w-auto"
          disabled={is_submitting}
          size="md"
          type="button"
          variant="secondary"
          onClick={on_cancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Success confirmation
// ─────────────────────────────────────────────────────────────────────────────

function BookingConfirmed({
  booking_id,
  session_title,
  status,
  on_book_another,
}: {
  booking_id: string;
  session_title: string;
  status: string;
  on_book_another: () => void;
}) {
  return (
    <div
      aria-live="polite"
      className="rounded-md border border-emerald-200 bg-emerald-50 p-6"
      role="status"
    >
      <div className="flex items-start gap-3">
        <svg
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            {status === 'waitlisted' ? 'Added to waitlist' : 'Booking confirmed'}
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            {status === 'waitlisted'
              ? `You are on the waitlist for ${session_title}. You will be moved to confirmed if a spot opens.`
              : `Your spot in ${session_title} is confirmed. Check your account for details.`}
          </p>
          <p className="mt-1 text-xs text-emerald-600">Booking ID: {booking_id}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <a className={text_link_class} href="/account">
              View my bookings
            </a>
            <button className={text_link_class} type="button" onClick={on_book_another}>
              Book another class
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main booking panel
// ─────────────────────────────────────────────────────────────────────────────

export function BookingPanel({ sessions, packages }: BookingPanelProps) {
  const [selected_session_id, set_selected_session_id] = useState<string | null>(null);
  const [confirmed, set_confirmed] = useState<{
    booking_id: string;
    session_title: string;
    status: string;
  } | null>(null);

  const selected_session = sessions.find((s) => s.id === selected_session_id) ?? null;

  function handle_select(session_id: string) {
    set_selected_session_id((prev) => (prev === session_id ? null : session_id));
    set_confirmed(null);
  }

  function handle_booked(booking_id: string, session_title: string, status: string) {
    set_confirmed({ booking_id, session_title, status });
    set_selected_session_id(null);
  }

  function handle_book_another() {
    set_confirmed(null);
    set_selected_session_id(null);
  }

  // ── No packages — can't book anything ──────────────────────────────────
  if (packages.length === 0) {
    return (
      <div className="rounded-md border border-amber-100 bg-amber-50 p-6">
        <p className="text-sm font-semibold text-amber-800">No active packages</p>
        <p className="mt-1 text-sm text-amber-700">
          You need an active package with available credits to book a class. Contact the studio to
          purchase one.
        </p>
        <div className="mt-4">
          <a className={text_link_class} href="/pricing">
            View pricing
          </a>
        </div>
      </div>
    );
  }

  // ── No upcoming sessions ────────────────────────────────────────────────
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl bg-[#E8E2D0] p-8 text-center">
        <p className="font-serif font-medium text-xl text-[#2D3A1F]">No sessions scheduled</p>
        <p className="mt-2 font-sans text-sm leading-normal text-[#2D3A1F] opacity-80">
          There are no upcoming sessions available right now. Check back soon or contact the studio.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Success banner */}
      {confirmed && (
        <div className="mb-6">
          <BookingConfirmed
            booking_id={confirmed.booking_id}
            session_title={confirmed.session_title}
            status={confirmed.status}
            on_book_another={handle_book_another}
          />
        </div>
      )}

      {/* Session list */}
      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id}>
            <SessionCard
              is_selected={selected_session_id === session.id}
              session={session}
              on_select={() => handle_select(session.id)}
            />

            {/* Inline booking confirmation — only for selected session */}
            {selected_session_id === session.id && selected_session && (
              <ConfirmBooking
                packages={packages}
                session={selected_session}
                on_booked={handle_booked}
                on_cancel={() => set_selected_session_id(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
