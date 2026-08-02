import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { WeekSessionsOverview } from '@/features/bookings/week-day-bookings';
import { build_week_sessions_overview } from '@/features/bookings/week-day-bookings';

import { WeeklySessionsOverview } from './weekly-sessions-overview';

const base_overview: WeekSessionsOverview = build_week_sessions_overview({
  monday_key: '2026-08-03',
  today_key: '2026-08-05',
  sessions: [
    {
      id: 's1',
      title: 'TEST TEST',
      starts_at: '2026-08-03T03:00:00.000Z',
      ends_at: '2026-08-03T04:00:00.000Z',
      session_type: 'reformer',
      location: 'Studio',
      instructor_name: null,
      capacity: 4,
      active_bookings: [
        {
          id: 'b1',
          status: 'booked',
          client_name: 'Client',
          client_email: 'c@example.com',
          client_phone: null,
          booked_at: '2026-07-01T00:00:00.000Z',
          cancelled_at: null,
        },
      ],
      cancelled_bookings: [],
    },
  ],
});

describe('WeeklySessionsOverview', () => {
  it('renders week navigation and seven day cards with counts', () => {
    render(
      <WeeklySessionsOverview
        is_pending={false}
        overview={base_overview}
        on_navigate_week={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Weekly sessions overview' })).toBeInTheDocument();
    expect(screen.getByText('3–9 August 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();

    const monday = screen.getByRole('button', { name: /Expand Monday, 3 August: 1 session/i });
    expect(monday).toHaveAttribute('aria-expanded', 'false');
    expect(within(monday).getByText('1 session')).toBeInTheDocument();
  });

  it('calls on_navigate_week for previous, next, and today', () => {
    const on_navigate_week = vi.fn();

    render(
      <WeeklySessionsOverview
        is_pending={false}
        overview={base_overview}
        on_navigate_week={on_navigate_week}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));

    expect(on_navigate_week).toHaveBeenNthCalledWith(1, 'previous');
    expect(on_navigate_week).toHaveBeenNthCalledWith(2, 'next');
    expect(on_navigate_week).toHaveBeenNthCalledWith(3, 'today');
  });

  it('expands days and slots independently with aria and keyboard support', () => {
    const overview = build_week_sessions_overview({
      monday_key: '2026-08-03',
      today_key: '2026-08-05',
      sessions: [
        {
          id: 's1',
          title: 'TEST TEST',
          starts_at: '2026-08-03T03:00:00.000Z',
          ends_at: '2026-08-03T04:00:00.000Z',
          session_type: 'reformer',
          location: 'Studio',
          instructor_name: null,
          capacity: 4,
          active_bookings: [
            {
              id: 'b1',
              status: 'booked',
              client_name: 'Client',
              client_email: 'c@example.com',
              client_phone: null,
              booked_at: '2026-07-01T00:00:00.000Z',
              cancelled_at: null,
            },
          ],
          cancelled_bookings: [],
        },
        {
          id: 's2',
          title: 'Tue Session',
          starts_at: '2026-08-04T06:00:00.000Z',
          ends_at: '2026-08-04T07:00:00.000Z',
          session_type: 'mat',
          location: 'Studio',
          instructor_name: null,
          capacity: 4,
          active_bookings: [
            {
              id: 'b2',
              status: 'booked',
              client_name: 'Client 2',
              client_email: 'c2@example.com',
              client_phone: null,
              booked_at: '2026-07-01T00:00:00.000Z',
              cancelled_at: null,
            },
          ],
          cancelled_bookings: [],
        },
      ],
    });

    render(
      <WeeklySessionsOverview
        is_pending={false}
        overview={overview}
        on_navigate_week={vi.fn()}
      />,
    );

    const monday = screen.getByRole('button', { name: /Expand Monday, 3 August: 1 session/i });
    const tuesday = screen.getByRole('button', { name: /Expand Tuesday, 4 August: 1 session/i });

    fireEvent.click(monday);
    expect(monday).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Expand 06:00–07:00: 1 session/i })).toBeInTheDocument();

    fireEvent.click(tuesday);
    expect(tuesday).toHaveAttribute('aria-expanded', 'true');
    expect(monday).toHaveAttribute('aria-expanded', 'true');

    const slot = screen.getByRole('button', { name: /Expand 06:00–07:00: 1 session/i });
    expect(slot).toHaveAttribute('aria-expanded', 'false');
    expect(slot.tagName).toBe('BUTTON');
    fireEvent.click(slot);
    expect(slot).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Client')).toBeInTheDocument();
    expect(screen.getByText('Reformer')).toBeInTheDocument();
    expect(screen.queryByText('TEST TEST')).not.toBeInTheDocument();

    fireEvent.click(slot);
    expect(slot).toHaveAttribute('aria-expanded', 'false');
  });

  it('lists Mat and Reformer clients from parallel sessions in one slot', () => {
    const overview = build_week_sessions_overview({
      monday_key: '2026-08-03',
      today_key: '2026-08-05',
      sessions: [
        {
          id: 's-reformer',
          title: 'Reformer Pilates',
          starts_at: '2026-08-03T03:00:00.000Z',
          ends_at: '2026-08-03T04:00:00.000Z',
          session_type: 'reformer',
          location: 'Studio',
          instructor_name: null,
          capacity: 4,
          active_bookings: [
            {
              id: 'b-r',
              status: 'booked',
              client_name: 'Maria',
              client_email: 'm@example.com',
              client_phone: null,
              booked_at: '2026-07-01T00:00:00.000Z',
              cancelled_at: null,
            },
          ],
          cancelled_bookings: [],
        },
        {
          id: 's-mat',
          title: 'Mat Pilates',
          starts_at: '2026-08-03T03:00:00.000Z',
          ends_at: '2026-08-03T04:00:00.000Z',
          session_type: 'mat',
          location: 'Studio',
          instructor_name: null,
          capacity: 4,
          active_bookings: [
            {
              id: 'b-m',
              status: 'booked',
              client_name: 'Alex',
              client_email: 'a@example.com',
              client_phone: null,
              booked_at: '2026-07-01T00:00:00.000Z',
              cancelled_at: null,
            },
          ],
          cancelled_bookings: [],
        },
      ],
    });

    render(
      <WeeklySessionsOverview
        is_pending={false}
        overview={overview}
        on_navigate_week={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Expand Monday, 3 August: 2 sessions/i }));
    fireEvent.click(screen.getByRole('button', { name: /Expand 06:00–07:00: 2 sessions/i }));

    expect(screen.getByText('Mat')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Reformer')).toBeInTheDocument();
    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.queryByText('Reformer Pilates')).not.toBeInTheDocument();
  });

  it('shows empty day and empty week messaging', () => {
    const empty = build_week_sessions_overview({
      monday_key: '2026-08-03',
      sessions: [],
      today_key: '2026-08-05',
    });

    render(
      <WeeklySessionsOverview is_pending={false} overview={empty} on_navigate_week={vi.fn()} />,
    );

    expect(screen.getByText('No sessions scheduled for 3–9 August.')).toBeInTheDocument();

    const monday = screen.getByRole('button', { name: /Expand Monday, 3 August: No sessions/i });
    fireEvent.click(monday);
    expect(within(monday.parentElement as HTMLElement).getByText('No sessions scheduled for this day.')).toBeInTheDocument();
  });

  it('renders a compact loading skeleton while pending', () => {
    render(
      <WeeklySessionsOverview
        is_pending
        overview={base_overview}
        on_navigate_week={vi.fn()}
      />,
    );

    expect(screen.getByRole('status', { name: 'Loading weekly sessions' })).toBeInTheDocument();
  });
});
