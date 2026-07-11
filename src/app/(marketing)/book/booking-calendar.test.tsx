import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  book_slot_action_mock,
  get_day_schedule_mock,
  get_slots_for_day_mock,
} = vi.hoisted(() => ({
  book_slot_action_mock: vi.fn(),
  get_day_schedule_mock: vi.fn(),
  get_slots_for_day_mock: vi.fn(),
}));

vi.mock('@/app/(marketing)/book/schedule-actions', () => ({
  book_slot_action: book_slot_action_mock,
  get_day_schedule: get_day_schedule_mock,
  get_slots_for_day: get_slots_for_day_mock,
}));

const refresh_mock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refresh_mock }),
}));

import { BookingCalendar } from '@/app/(marketing)/book/booking-calendar';

const packages = [
  {
    id: 'pkg-1',
    credits_remaining: 5,
    expires_at: null,
    package_name: '10 Pack',
    class_type: 'reformer',
    package_type: 'credit_pack',
  },
];

const session_cards = [
  {
    id: 'card-1',
    title: 'Reformer Flow',
    description: 'A balanced reformer class',
    session_type: 'reformer' as const,
    duration_minutes: 60,
    instructor_name: 'Alex',
    image_src: null,
    capacity: 6,
    credits_required: 1,
    reformer_credits_required: 1,
    mat_credits_required: 0,
  },
];

const open_schedule = {
  date: '2099-12-01',
  is_closed: false,
  time_ranges: [{ start: '09:00', end: '12:00' }],
  is_override: false,
};

const open_slot = {
  slot_start: '09:00',
  slot_end: '10:00',
  session_id: 'session-1',
  confirmed_count: 1,
  capacity: 6,
  open_for_public_booking: true,
};

describe('BookingCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refresh_mock.mockReset();
    get_day_schedule_mock.mockResolvedValue(open_schedule);
    get_slots_for_day_mock.mockResolvedValue([open_slot]);
    book_slot_action_mock.mockResolvedValue({
      success: true,
      booking_id: 'booking-1',
      status: 'booked',
      session_title: 'Reformer Flow',
    });
  });

  it('renders the no-packages empty state', () => {
    render(
      <BookingCalendar
        initial_date="2099-12-01"
        initial_schedule={open_schedule}
        initial_slots={[]}
        packages={[]}
        session_cards={session_cards}
      />,
    );

    expect(screen.getByText('No active packages')).toBeInTheDocument();
  });

  it('resets the selected time when the date changes', async () => {
    get_slots_for_day_mock
      .mockResolvedValueOnce([open_slot])
      .mockResolvedValueOnce([
        {
          slot_start: '10:00',
          slot_end: '11:00',
          session_id: 'session-2',
          confirmed_count: 0,
          capacity: 6,
          open_for_public_booking: true,
        },
      ]);

    render(
      <BookingCalendar
        initial_date="2099-12-01"
        initial_schedule={open_schedule}
        initial_slots={[open_slot]}
        packages={packages}
        session_cards={session_cards}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /09:00 – 10:00/i }));
    expect(screen.getByRole('heading', { name: 'Confirm booking' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Wed 2 Dec' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Confirm booking' })).not.toBeInTheDocument();
    });
  });

  it('wires booking action and shows success feedback', async () => {
    render(
      <BookingCalendar
        initial_date="2099-12-01"
        initial_schedule={open_schedule}
        initial_slots={[open_slot]}
        packages={packages}
        session_cards={session_cards}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /09:00 – 10:00/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    await waitFor(() => {
      expect(book_slot_action_mock).toHaveBeenCalled();
      expect(screen.getByText('Booking confirmed')).toBeInTheDocument();
      expect(refresh_mock).toHaveBeenCalled();
    });
  });

  it('surfaces booking errors explicitly', async () => {
    book_slot_action_mock.mockResolvedValue({
      success: false,
      error: 'You already have a booking at this time.',
    });

    render(
      <BookingCalendar
        initial_date="2099-12-01"
        initial_schedule={open_schedule}
        initial_slots={[open_slot]}
        packages={packages}
        session_cards={session_cards}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /09:00 – 10:00/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    await waitFor(() => {
      expect(screen.getByText('You already have a booking at this time.')).toBeInTheDocument();
    });
  });

  it('shows cancellation policy in the confirm panel', async () => {
    render(
      <BookingCalendar
        initial_date="2099-12-01"
        initial_schedule={open_schedule}
        initial_slots={[open_slot]}
        packages={packages}
        session_cards={session_cards}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /09:00 – 10:00/i }));

    expect(
      screen.getByText(
        'You can cancel online more than 4 hours before class. Inside 4 hours, the session credit is kept.',
      ),
    ).toBeInTheDocument();
  });

  it('shows full slots as unavailable', () => {
    const full_slot = {
      ...open_slot,
      confirmed_count: 6,
    };

    get_slots_for_day_mock.mockResolvedValue([full_slot]);

    render(
      <BookingCalendar
        initial_date="2099-12-01"
        initial_schedule={open_schedule}
        initial_slots={[full_slot]}
        packages={packages}
        session_cards={session_cards}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /09:00 – 10:00/i }));

    expect(screen.queryByRole('heading', { name: 'Confirm booking' })).not.toBeInTheDocument();
    expect(screen.getByText('Full')).toBeInTheDocument();
  });
});
