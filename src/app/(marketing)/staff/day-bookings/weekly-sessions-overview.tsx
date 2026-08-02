'use client';

import { useId, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  format_session_count_label,
  format_week_range_label,
  type WeekDayOverview,
  type WeekSessionsOverview,
  type WeekTimeSlot,
} from '@/features/bookings/week-day-bookings';
import { add_days, parse_date_key, to_date_key } from '@/lib/schedule/studio-hours';

export type WeekNavigationDirection = 'previous' | 'next' | 'today';

type WeeklySessionsOverviewProps = {
  overview: WeekSessionsOverview;
  is_pending: boolean;
  error?: string | null;
  on_navigate_week: (direction: WeekNavigationDirection) => void;
};

function empty_week_sentence(monday_key: string): string {
  const label = format_week_range_label(monday_key);
  const start_year = monday_key.slice(0, 4);
  const end_year = to_date_key(add_days(parse_date_key(monday_key), 6)).slice(0, 4);

  if (start_year === end_year) {
    return `No sessions scheduled for ${label.replace(` ${start_year}`, '')}.`;
  }

  return `No sessions scheduled for ${label}.`;
}

function day_accessible_name(day: WeekDayOverview): string {
  const date = parse_date_key(day.date_key);
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const day_number = date.getDate();
  const month = date.toLocaleDateString('en-GB', { month: 'long' });
  return `Expand ${weekday}, ${day_number} ${month}: ${format_session_count_label(day.session_count)}`;
}

function DisclosurePanel({
  open,
  id,
  children,
}: {
  open: boolean;
  id: string;
  children: ReactNode;
}) {
  return (
    <div
      aria-hidden={!open}
      className={[
        'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
      ].join(' ')}
      id={id}
      inert={!open ? true : undefined}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function SlotDisclosure({
  slot,
  day_key,
}: {
  slot: WeekTimeSlot;
  day_key: string;
}) {
  const panel_id = useId();
  const [open, set_open] = useState(false);
  const count_label = format_session_count_label(slot.session_count);

  return (
    <div className="border-t border-border/60 first:border-t-0">
      <button
        aria-controls={panel_id}
        aria-expanded={open}
        aria-label={`Expand ${slot.time_label}: ${count_label}`}
        className="flex w-full items-start gap-1 px-2 py-1.5 text-left text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        type="button"
        onClick={() => set_open((value) => !value)}
      >
        <span className="min-w-0 flex-1">
          <span className="block whitespace-nowrap text-[11px] font-medium tabular-nums leading-tight">
            {slot.time_label}
          </span>
          <span className="mt-0.5 block whitespace-nowrap text-[10px] leading-tight text-foreground/65">
            {count_label}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 pt-0.5 text-[11px] font-medium leading-none text-foreground/55"
        >
          {open ? '−' : '+'}
        </span>
      </button>
      <DisclosurePanel id={panel_id} open={open}>
        {slot.attendees.length === 0 ? (
          <p className="px-2 pb-2 text-[10px] text-foreground/55" data-day={day_key}>
            No active clients.
          </p>
        ) : (
          <ul
            className="max-h-28 space-y-1 overflow-y-auto px-2 pb-2 pt-0.5"
            data-day={day_key}
          >
            {slot.attendees.map((attendee) => (
              <li
                className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-1.5 text-[10px] leading-snug"
                key={attendee.id}
              >
                <span className="shrink-0 font-medium text-foreground/55">
                  {attendee.session_type_label}
                </span>
                <span className="truncate font-medium text-foreground">
                  {attendee.client_name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DisclosurePanel>
    </div>
  );
}

function DayCard({ day }: { day: WeekDayOverview }) {
  const panel_id = useId();
  const [open, set_open] = useState(false);
  const count_label = format_session_count_label(day.session_count);

  return (
    <div
      className={[
        'shrink-0 rounded-md border bg-background',
        open ? 'min-w-[10.5rem] flex-[1.35]' : 'min-w-[6.75rem] flex-1',
        day.is_today ? 'border-accent ring-1 ring-accent/40' : 'border-border',
        open ? 'border-foreground/30' : '',
      ].join(' ')}
    >
      <button
        aria-controls={panel_id}
        aria-expanded={open}
        aria-label={day_accessible_name(day)}
        className="flex w-full flex-col items-start gap-0.5 px-2 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        type="button"
        onClick={() => set_open((value) => !value)}
      >
        <span className="flex w-full items-center justify-between gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-foreground/60">
            {day.weekday_short} {day.day_number}
          </span>
          <span aria-hidden="true" className="shrink-0 text-[11px] text-foreground/50">
            {open ? '−' : '+'}
          </span>
        </span>
        <span className="whitespace-nowrap text-[11px] font-medium leading-tight text-foreground">
          {count_label}
        </span>
        {day.is_today ? (
          <span className="text-[9px] font-medium uppercase tracking-wide text-accent">Today</span>
        ) : null}
      </button>

      <DisclosurePanel id={panel_id} open={open}>
        <div className="border-t border-border px-0 pb-1">
          {day.session_count === 0 ? (
            <p className="px-2 py-2 text-[10px] leading-snug text-foreground/60">
              No sessions scheduled for this day.
            </p>
          ) : (
            day.slots.map((slot) => (
              <SlotDisclosure day_key={day.date_key} key={slot.key} slot={slot} />
            ))
          )}
        </div>
      </DisclosurePanel>
    </div>
  );
}

function WeekSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading weekly sessions"
      className="space-y-3"
      role="status"
    >
      <div className="h-10 animate-pulse rounded-md bg-muted" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }, (_, index) => (
          <div
            className="h-16 min-w-[6.75rem] flex-1 animate-pulse rounded-md bg-muted"
            key={index}
          />
        ))}
      </div>
      <span className="sr-only">Loading weekly sessions</span>
    </div>
  );
}

export function WeeklySessionsOverview({
  overview,
  is_pending,
  error = null,
  on_navigate_week,
}: WeeklySessionsOverviewProps) {
  return (
    <section
      aria-labelledby="weekly-sessions-overview-heading"
      className="space-y-3"
      role="region"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="text-sm font-semibold text-foreground"
            id="weekly-sessions-overview-heading"
          >
            Weekly sessions overview
          </h2>
          <p className="mt-0.5 text-xs text-foreground/70">Week of {overview.range_label}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={is_pending}
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => on_navigate_week('previous')}
          >
            Previous week
          </Button>
          <p className="min-w-[9rem] text-center text-xs font-medium text-foreground">
            {overview.range_label}
          </p>
          <Button
            disabled={is_pending}
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => on_navigate_week('today')}
          >
            Today
          </Button>
          <Button
            disabled={is_pending}
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => on_navigate_week('next')}
          >
            Next week
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {is_pending ? (
        <WeekSkeleton />
      ) : (
        <div className="space-y-2" key={overview.monday_key}>
          {overview.total_sessions === 0 ? (
            <p className="text-xs text-foreground/60">{empty_week_sentence(overview.monday_key)}</p>
          ) : null}

          <div className="relative">
            <div className="flex gap-1.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
              {overview.days.map((day) => (
                <DayCard day={day} key={day.date_key} />
              ))}
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-surface to-transparent sm:hidden"
            />
          </div>
        </div>
      )}
    </section>
  );
}
