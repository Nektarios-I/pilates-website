'use client';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RecurringWeeklySlotPicker } from '@/features/client-booking-manager/components/recurring-weekly-slot-picker';

vi.mock('@/features/bookings/recurring-weekly-slot-options', () => ({
  build_recurring_weekly_slot_options: () => [
    {
      day_of_week: 1,
      weekday_label: 'Monday',
      is_closed: false,
      slots: [{ start_time: '06:00:00', end_time: '07:00:00', label: '06:00–07:00' }],
    },
    {
      day_of_week: 2,
      weekday_label: 'Tuesday',
      is_closed: false,
      slots: [{ start_time: '06:00:00', end_time: '07:00:00', label: '06:00–07:00' }],
    },
  ],
}));

describe('RecurringWeeklySlotPicker', () => {
  it('shows day rows collapsed by default and expands one day when pressed', () => {
    render(
      <RecurringWeeklySlotPicker
        active_lines={[]}
        duration_minutes={55}
        on_add={vi.fn()}
        session_title="Reformer"
      />,
    );

    expect(screen.getByRole('button', { name: /monday/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tuesday/i })).toBeInTheDocument();
    expect(screen.queryByLabelText('Session slot')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /monday/i }));

    expect(screen.getByLabelText('Session slot')).toBeInTheDocument();
    expect(screen.getByLabelText('First session date')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add slot/i })).toBeInTheDocument();
  });
});
