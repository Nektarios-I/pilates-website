import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TimeSlotPicker } from '@/app/(marketing)/book/components/time-slot-picker';

const hourly_slots = [
  { start: '09:00', end: '10:00', label: '09:00 – 10:00' },
  { start: '10:00', end: '11:00', label: '10:00 – 11:00' },
];

describe('TimeSlotPicker', () => {
  it('does not allow selecting a full slot', () => {
    const on_select = vi.fn();
    const future_date = '2099-12-01';

    render(
      <TimeSlotPicker
        date_key={future_date}
        hourly_slots={hourly_slots}
        on_select={on_select}
        selected_slot={null}
        show_available_only={false}
        slots={[
          {
            slot_start: '09:00',
            slot_end: '10:00',
            session_id: 'session-1',
            confirmed_count: 6,
            capacity: 6,
            open_for_public_booking: true,
          },
        ]}
      />,
    );

    const full_button = screen.getByRole('button', { name: /09:00 – 10:00/i });
    expect(full_button).toBeDisabled();
    expect(screen.getByText('Full')).toBeInTheDocument();
    fireEvent.click(full_button);
    expect(on_select).not.toHaveBeenCalled();
  });

  it('hides full slots when showing available only', () => {
    render(
      <TimeSlotPicker
        date_key="2099-12-01"
        hourly_slots={hourly_slots}
        on_select={vi.fn()}
        selected_slot={null}
        show_available_only
        slots={[
          {
            slot_start: '09:00',
            slot_end: '10:00',
            session_id: 'session-1',
            confirmed_count: 6,
            capacity: 6,
            open_for_public_booking: true,
          },
          {
            slot_start: '10:00',
            slot_end: '11:00',
            session_id: null,
            confirmed_count: 0,
            capacity: 6,
            open_for_public_booking: true,
          },
        ]}
      />,
    );

    expect(screen.queryByRole('button', { name: /09:00 – 10:00/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /10:00 – 11:00/i })).toBeInTheDocument();
  });
});
