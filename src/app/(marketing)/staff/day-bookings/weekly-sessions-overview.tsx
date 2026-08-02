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
    <div className="border-t border-border/70 first:border-t-0">
      <button
        aria-controls={panel_id}
        aria-expanded={open}
        aria-label={`Expand ${slot.time_label}: ${count_label}`}
        className="flex w-full min-h-11 items-center justify-between gap-3 px-3 py-2 text-left text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        type="button"
        onClick={() => set_open((value) => !value)}
      >
        <span className="font-medium tabular-nums">{slot.time_label}</span>
        <span className="flex items-center gap-2 text-foreground/70">
          <span>{count_label}</span>
          <span aria-hidden="true" className="text-foreground/50">
            {open ? '−' : '+'}
          </span>
        </span>
      </button>
      <DisclosurePanel id={panel_id} open={open}>
        <ul className="space-y-2 px-3 pb-3 pt-1" data-day={day_key}>
          {slot.sessions.map((session) => (
            <li key={session.id} className="rounded-md bg-background px-3 py-2">
              <p className="text-sm font-medium text-foreground">{session.title}</p>
              <p className="mt-0.5 text-sm text-foreground/70">{session.session_type_label}</p>
            </li>
          ))}
        </ul>
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
        'min-w-[7.5rem] shrink-0 rounded-md border bg-background sm:min-w-0',
        day.is_today ? 'border-accent ring-1 ring-accent/40' : 'border-border',
        open ? 'border-foreground/30' : '',
      ].join(' ')}
    >
      <button
        aria-controls={panel_id}
        aria-expanded={open}
        aria-label={day_accessible_name(day)}
        className="flex w-full min-h-11 flex-col items-start gap-1 px-3 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        type="button"
        onClick={() => set_open((value) => !value)}
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground/60">
            {day.weekday_short} {day.day_number}
          </span>
          <span aria-hidden="true" className="text-sm text-foreground/50">
            {open ? '−' : '+'}
          </span>
        </span>
        <span className="text-sm font-medium text-foreground">{count_label}</span>
        {day.is_today ? (
          <span className="text-[11px] font-medium uppercase tracking-wide text-accent">Today</span>
        ) : null}
      </button>

      <DisclosurePanel id={panel_id} open={open}>
        <div className="border-t border-border px-0 pb-1">
          {day.session_count === 0 ? (
            <p className="px-3 py-3 text-sm text-foreground/60">No sessions scheduled for this day.</p>
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
            className="h-20 min-w-[7.5rem] flex-1 animate-pulse rounded-md bg-muted"
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
      className="space-y-4"
      role="region"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="text-base font-semibold text-foreground"
            id="weekly-sessions-overview-heading"
          >
            Weekly sessions overview
          </h2>
          <p className="mt-1 text-sm text-foreground/70">Week of {overview.range_label}</p>
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
          <p className="min-w-[10rem] text-center text-sm font-medium text-foreground">
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
        <div className="space-y-3" key={overview.monday_key}>
          {overview.total_sessions === 0 ? (
            <p className="text-sm text-foreground/60">{empty_week_sentence(overview.monday_key)}</p>
          ) : null}

          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin] md:grid md:grid-cols-7 md:overflow-visible md:pb-0">
              {overview.days.map((day) => (
                <DayCard day={day} key={day.date_key} />
              ))}
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface to-transparent md:hidden"
            />
          </div>
        </div>
      )}
    </section>
  );
}
