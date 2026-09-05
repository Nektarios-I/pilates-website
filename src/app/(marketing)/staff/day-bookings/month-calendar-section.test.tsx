import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { build_month_calendar_overview } from '@/features/bookings/month-calendar';
import type { ClientDashboardData } from '@/features/client-booking-manager/types';

import {
  BookingBox,
  DayDetailPopup,
  MonthCalendarSection,
} from './month-calendar-section';

const load_client_dashboard_mock = vi.hoisted(() => vi.fn());

vi.mock('@/features/client-booking-manager/actions', () => ({
  load_client_dashboard: load_client_dashboard_mock,
}));

const overview = build_month_calendar_overview({
  year: 2026,
  month: 9,
  today_key: '2026-09-05',
  bookings: [
    {
      id: 'b-ref',
      user_id: 'user-maria',
      client_name: 'Maria Papadou',
      session_type: 'reformer',
      kind: 'reformer',
      starts_at: '2026-09-05T03:00:00.000Z',
      date_key: '2026-09-05',
      hour: 6,
    },
    {
      id: 'b-mat',
      user_id: 'user-elena',
      client_name: 'Elena Matou',
      session_type: 'mat',
      kind: 'mat',
      starts_at: '2026-09-05T03:05:00.000Z',
      date_key: '2026-09-05',
      hour: 6,
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
        }}
        on_select={on_select}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Maria Pap/i }));
    expect(on_select).toHaveBeenCalled();
    expect(screen.getByText('Reformer')).toBeInTheDocument();
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
    expect(within(six as HTMLElement).getByText('1 Reformer, 1 Mat')).toBeInTheDocument();

    const boxes = within(six as HTMLElement).getAllByRole('button');
    expect(boxes[0]).toHaveTextContent('Maria Pap');
    expect(boxes[0]).toHaveTextContent('Reformer');
    expect(boxes[1]).toHaveTextContent('Elena Mat');
    expect(boxes[1]).toHaveTextContent('Mat');
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

    expect(await screen.findByRole('heading', { name: 'Maria Pap' })).toBeInTheDocument();
    expect(await screen.findByText('10 Pack')).toBeInTheDocument();
    expect(screen.getByText('4 credits remaining')).toBeInTheDocument();
    expect(screen.getByText('Monday Mat')).toBeInTheDocument();
    expect(screen.queryByText('Saturday Reformer')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel|edit/i })).not.toBeInTheDocument();
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
