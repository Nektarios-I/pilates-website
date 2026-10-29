import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { build_month_calendar_overview } from '@/features/bookings/month-calendar';
import type { ClientDashboardData } from '@/features/client-booking-manager/types';

import {
  BookingBox,
  CancelledSessionCard,
  DayDetailPopup,
  MonthCalendarSection,
} from './month-calendar-section';

const load_client_dashboard_mock = vi.hoisted(() => vi.fn());

vi.mock('@/features/client-booking-manager/actions', () => ({
  load_client_dashboard: load_client_dashboard_mock,
  load_manager_session_cards: vi.fn(async () => []),
  staff_cancel_client_booking: vi.fn(),
  staff_mark_booking_not_attended: vi.fn(),
}));

vi.mock('@/app/(marketing)/staff/membership/actions', () => ({
  list_membership_packages: vi.fn(async () => []),
  apply_membership: vi.fn(),
}));

const overview = build_month_calendar_overview({
  year: 2026,
  month: 9,
  today_key: '2026-09-05',
  bookings: [
    {
      id: 'b-ref',
      user_id: 'user-maria',
      session_id: 'session-ref',
      client_name: 'Maria Papadou',
      session_type: 'reformer',
      kind: 'reformer',
      starts_at: '2026-09-05T03:00:00.000Z',
      date_key: '2026-09-05',
      hour: 6,
      status: 'booked',
      counts_as_active: true,
      cancelled_at: null,
      cancelled_by_name: null,
      cancellation_actor_note: null,
    },
    {
      id: 'b-mat',
      user_id: 'user-elena',
      session_id: 'session-mat',
      client_name: 'Elena Matou',
      session_type: 'mat',
      kind: 'mat',
      starts_at: '2026-09-05T03:05:00.000Z',
      date_key: '2026-09-05',
      hour: 6,
      status: 'booked',
      counts_as_active: true,
      cancelled_at: null,
      cancelled_by_name: null,
      cancellation_actor_note: null,
    },
    {
      id: 'b-cancel-1',
      user_id: 'user-alex',
      session_id: 'session-ref',
      client_name: 'Alex Cancelled',
      session_type: 'reformer',
      kind: 'reformer',
      starts_at: '2026-09-05T03:00:00.000Z',
      date_key: '2026-09-05',
      hour: 6,
      status: 'cancelled',
      counts_as_active: false,
      cancelled_at: '2026-09-04T10:00:00.000Z',
      cancelled_by_name: 'Owner Staff',
      cancellation_actor_note: null,
    },
    {
      id: 'b-na',
      user_id: 'user-nia',
      session_id: 'session-ref',
      client_name: 'Nia Absent',
      session_type: 'reformer',
      kind: 'reformer',
      starts_at: '2026-09-04T03:00:00.000Z',
      date_key: '2026-09-04',
      hour: 6,
      status: 'not_attended',
      counts_as_active: false,
      cancelled_at: null,
      cancelled_by_name: null,
      cancellation_actor_note: null,
    },
  ],
});

const dashboard: ClientDashboardData = {
  packages: [
    {
      user_package_id: 'pkg-1',
      package_name: '10 Pack',
      class_type: 'reformer',
      package_type: 'credit_pack',
      credits_remaining: 4,
      expires_at: null,
    },
  ],
  bookings: [
    {
      id: 'b-ref',
      status: 'booked',
      booked_at: '2026-09-01T00:00:00.000Z',
      cancelled_at: null,
      cancellation_reason: null,
      credits_used: 1,
      booking_source: 'manual',
      session_id: 's1',
      session_title: 'Saturday Reformer',
      session_starts_at: '2026-09-05T03:00:00.000Z',
      session_ends_at: '2026-09-05T04:00:00.000Z',
      session_type: 'reformer',
      session_status: 'scheduled',
      credit_charges: [],
    },
    {
      id: 'b-other',
      status: 'booked',
      booked_at: '2026-09-01T00:00:00.000Z',
      cancelled_at: null,
      cancellation_reason: null,
      credits_used: 1,
      booking_source: 'manual',
      session_id: 's2',
      session_title: 'Monday Mat',
      session_starts_at: '2027-09-14T03:00:00.000Z',
      session_ends_at: '2027-09-14T04:00:00.000Z',
      session_type: 'mat',
      session_status: 'scheduled',
      credit_charges: [],
    },
  ],
  recurring_rules: [],
  attention: [],
};

describe('BookingBox', () => {
  it('shows compact name and session type', () => {
    const on_select = vi.fn();
    render(
      <BookingBox
        booking={{
          id: 'b-ref',
          user_id: 'user-maria',
          compact_name: 'Maria Pap',
          session_type_label: 'Reformer',
          kind: 'reformer',
          status: 'booked',
          counts_as_active: true,
          full_name: 'Maria Papadou',
        }}
        on_select={on_select}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Maria Pap/i }));
    expect(on_select).toHaveBeenCalled();
    expect(screen.getByText('Reformer')).toBeInTheDocument();
  });

  it('styles not attended bookings in yellow', () => {
    render(
      <BookingBox
        booking={{
          id: 'b-na',
          user_id: 'user-nia',
          compact_name: 'Nia Abs',
          session_type_label: 'Reformer',
          kind: 'reformer',
          status: 'not_attended',
          counts_as_active: false,
          full_name: 'Nia Absent',
        }}
        on_select={vi.fn()}
      />,
    );

    const box = screen.getByRole('button', { name: /Nia Abs/i });
    expect(box).toHaveAttribute('data-status', 'not_attended');
    expect(box.className).toContain('bg-warning-surface');
  });
});

describe('CancelledSessionCard', () => {
  it('shows cancelled count and opens via click', () => {
    const on_select = vi.fn();
    render(
      <CancelledSessionCard
        group={{
          session_id: 'session-ref',
          session_type_label: 'Reformer',
          kind: 'reformer',
          count: 2,
          cancellations: [
            {
              booking_id: 'c1',
              client_name: 'Alex Cancelled',
              cancelled_at: '2026-09-04T10:00:00.000Z',
              cancelled_by_label: 'Owner Staff',
            },
            {
              booking_id: 'c2',
              client_name: 'Ben Cancelled',
              cancelled_at: '2026-09-04T11:00:00.000Z',
              cancelled_by_label: 'Owner Staff',
            },
          ],
        }}
        on_select={on_select}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Cancelled, 2 cancelled, Reformer/i }));
    expect(on_select).toHaveBeenCalled();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText(/2 cancelled/i)).toBeInTheDocument();
  });
});

describe('MonthCalendarSection', () => {
  it('renders month navigation and a 7-column grid with today and empty days', () => {
    render(
      <MonthCalendarSection
        error={null}
        is_pending={false}
        overview={overview}
        on_navigate_month={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Month calendar' })).toBeInTheDocument();
    expect(screen.getByLabelText('Month')).toHaveValue('9');
    expect(screen.getByLabelText('Year')).toHaveValue('2026');
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument();

    const today = screen.getByRole('button', { name: '5 September, 1 Reformer, 1 Mat' });
    expect(today).toHaveAttribute('aria-current', 'date');
    expect(within(today).getByText('Today')).toBeInTheDocument();
    expect(within(today).getByText('5')).toBeInTheDocument();
    expect(within(today).getByText('Sat')).toBeInTheDocument();
    expect(today).toHaveAttribute('data-grade', '1');

    const empty = screen.getByRole('button', { name: '6 September, No sessions' });
    expect(empty).toHaveAttribute('data-grade', '0');
    expect(empty.className).toContain('bg-background');
    expect(today.className).toContain('bg-surface-2/25');

    expect(screen.getByRole('button', { name: '6 September, No sessions' })).toBeInTheDocument();
  });

  it('notifies parent when month or year changes', () => {
    const on_navigate_month = vi.fn();
    render(
      <MonthCalendarSection
        is_pending={false}
        overview={overview}
        on_navigate_month={on_navigate_month}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2027' } });

    expect(on_navigate_month).toHaveBeenNthCalledWith(1, 2026, 8);
    expect(on_navigate_month).toHaveBeenNthCalledWith(2, 2026, 10);
    expect(on_navigate_month).toHaveBeenNthCalledWith(3, 2026, 1);
    expect(on_navigate_month).toHaveBeenNthCalledWith(4, 2027, 9);
  });

  it('opens the day popup with 24 hour rows and Reformer before Mat', async () => {
    load_client_dashboard_mock.mockResolvedValue(dashboard);

    render(
      <MonthCalendarSection
        is_pending={false}
        overview={overview}
        on_navigate_month={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '5 September, 1 Reformer, 1 Mat' }));

    const dialog = await screen.findByRole('dialog', { name: /5 September 2026/i });
    expect(within(dialog).getByText('0:00')).toBeInTheDocument();
    expect(within(dialog).getByText('6:00')).toBeInTheDocument();
    expect(within(dialog).getByText('23:00')).toBeInTheDocument();
    expect(within(dialog).getAllByText('0 Reformer, 0 Mat').length).toBeGreaterThan(0);

    const six = dialog.querySelector('[data-hour="06"]');
    expect(six).not.toBeNull();
    expect(within(six as HTMLElement).getByText(/1 Reformer, 1 Mat · 1 cancelled/)).toBeInTheDocument();

    const boxes = within(six as HTMLElement).getAllByRole('button');
    expect(boxes[0]).toHaveTextContent('Maria Pap');
    expect(boxes[0]).toHaveTextContent('Reformer');
    expect(boxes[1]).toHaveTextContent('Elena Mat');
    expect(boxes[1]).toHaveTextContent('Mat');
    expect(within(six as HTMLElement).getByRole('button', { name: /Cancelled, 1 cancelled/i })).toBeInTheDocument();

    fireEvent.click(within(six as HTMLElement).getByRole('button', { name: /Cancelled, 1 cancelled/i }));
    expect(await screen.findByRole('heading', { name: 'Cancelled bookings' })).toBeInTheDocument();
    expect(screen.getByText('Alex Cancelled')).toBeInTheDocument();
    expect(screen.getByText(/By Owner Staff/i)).toBeInTheDocument();
  });

  it('opens read-only client details from a booking box', async () => {
    load_client_dashboard_mock.mockResolvedValue(dashboard);

    render(
      <MonthCalendarSection
        is_pending={false}
        overview={overview}
        on_navigate_month={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '5 September, 1 Reformer, 1 Mat' }));
    fireEvent.click(await screen.findByRole('button', { name: /Maria Pap/i }));

    expect(await screen.findByRole('heading', { name: 'Maria Papadou' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Bookings' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Memberships' }));
    expect(screen.getByRole('tab', { name: 'Memberships' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Bookings' })).toHaveAttribute('aria-selected', 'false');
    expect(await screen.findByText('10 Pack')).toBeInTheDocument();
    expect(screen.getByText('4 credits remaining')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Add booking' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close client details' })).toBeInTheDocument();
  });
});

describe('DayDetailPopup', () => {
  beforeEach(() => {
    load_client_dashboard_mock.mockResolvedValue(dashboard);
  });

  it('closes when the close button is pressed', () => {
    const on_close = vi.fn();
    render(
      <DayDetailPopup date_key="2026-09-06" overview={overview} on_close={on_close} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close day details' }));
    expect(on_close).toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const on_close = vi.fn();
    render(
      <DayDetailPopup date_key="2026-09-06" overview={overview} on_close={on_close} />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(on_close).toHaveBeenCalled();
  });
});
