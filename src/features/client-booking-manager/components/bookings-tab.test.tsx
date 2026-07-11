import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { staff_cancel_mock } = vi.hoisted(() => ({
  staff_cancel_mock: vi.fn(),
}));

vi.mock('@/features/client-booking-manager/actions', () => ({
  staff_cancel_client_booking: staff_cancel_mock,
}));

import { BookingsTab } from '@/features/client-booking-manager/components/bookings-tab';

const upcoming_booking = {
  id: 'booking-1',
  status: 'booked',
  booked_at: '2026-07-01T10:00:00.000Z',
  cancelled_at: null,
  cancellation_reason: null,
  credits_used: 1,
  booking_source: 'client',
  session_id: 'session-1',
  session_title: 'Reformer Flow',
  session_starts_at: '2026-12-01T10:00:00.000Z',
  session_ends_at: '2026-12-01T11:00:00.000Z',
  session_type: 'reformer',
  credit_charges: [{ class_type: 'reformer', credits_used: 1 }],
};

describe('BookingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the upcoming empty state intentionally', () => {
    render(<BookingsTab bookings={[]} on_refresh={vi.fn()} />);

    expect(screen.getByText('No upcoming bookings for this client.')).toBeInTheDocument();
  });

  it('wires cancel booking to the staff cancel action', async () => {
    const on_refresh = vi.fn();
    staff_cancel_mock.mockResolvedValue({ success: true });

    render(<BookingsTab bookings={[upcoming_booking]} on_refresh={on_refresh} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel booking' }));

    await waitFor(() => {
      expect(staff_cancel_mock).toHaveBeenCalledWith('booking-1');
    });
    expect(screen.getByText('Booking cancelled.')).toBeInTheDocument();
    expect(on_refresh).toHaveBeenCalled();
  });

  it('shows cancel failures explicitly', async () => {
    staff_cancel_mock.mockResolvedValue({
      success: false,
      error: 'This booking could not be cancelled.',
    });

    render(<BookingsTab bookings={[upcoming_booking]} on_refresh={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel booking' }));

    await waitFor(() => {
      expect(screen.getByText('This booking could not be cancelled.')).toBeInTheDocument();
    });
  });
});
