/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RecurringPlannedSessionsPreview } from '@/features/client-booking-manager/components/recurring-planned-sessions-preview';
import { CancelRecurringSessionsModal } from '@/features/client-booking-manager/components/cancel-recurring-sessions-modal';

describe('RecurringPlannedSessionsPreview', () => {
  it('renders empty state until first occurrence is valid', () => {
    render(
      <RecurringPlannedSessionsPreview
        day_of_week={null}
        first_occurrence_date=""
        session_title="Reformer"
        start_time=""
      />,
    );
    expect(
      screen.getByText(/choose weekday, session slot, and first session date/i),
    ).toBeInTheDocument();
  });

  it('shows three-month planned sessions grouped by month', () => {
    render(
      <RecurringPlannedSessionsPreview
        day_of_week={1}
        end_time="19:00"
        first_occurrence_date="2026-08-24"
        session_title="Reformer"
        start_time="18:00"
      />,
    );
    expect(screen.getByRole('heading', { name: /planned sessions/i })).toBeInTheDocument();
    expect(screen.getByText(/24 August 2026 – 24 November 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/^August 2026$/i)).toBeInTheDocument();
    expect(screen.getByText(/^September 2026$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/18:00/i).length).toBeGreaterThan(2);
  });
});

describe('CancelRecurringSessionsModal', () => {
  it('keeps checkboxes unchecked and disables primary action by default', () => {
    render(
      <CancelRecurringSessionsModal
        open
        occurrences={[
          {
            occurrence_date: '2026-08-24',
            start_time: '18:00',
            end_time: '19:00',
            session_title: 'Reformer',
            state: 'planned',
          },
          {
            occurrence_date: '2026-08-31',
            start_time: '18:00',
            end_time: '19:00',
            session_title: 'Reformer',
            state: 'booked',
            booking_id: 'b1',
          },
          {
            occurrence_date: '2026-09-07',
            start_time: '18:00',
            end_time: '19:00',
            session_title: 'Reformer',
            state: 'cancelled',
          },
        ]}
        on_close={vi.fn()}
        on_confirm={vi.fn(async () => ({ success: true, message: 'ok' }))}
      />,
    );

    expect(screen.getByRole('heading', { name: /cancel recurring sessions/i })).toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.every((box) => !(box as HTMLInputElement).checked)).toBe(true);
    expect(screen.getByRole('button', { name: /cancel selected sessions/i })).toBeDisabled();
  });

  it('enables cancel after selecting occurrences and confirms without ending the rule', async () => {
    const on_confirm = vi.fn(async () => ({ success: true, message: 'Cancelled 1' }));

    render(
      <CancelRecurringSessionsModal
        open
        occurrences={[
          {
            occurrence_date: '2026-08-24',
            start_time: '18:00',
            end_time: '19:00',
            session_title: 'Reformer',
            state: 'planned',
          },
          {
            occurrence_date: '2026-09-07',
            start_time: '18:00',
            end_time: '19:00',
            session_title: 'Reformer',
            state: 'cancelled',
          },
        ]}
        on_close={vi.fn()}
        on_confirm={on_confirm}
      />,
    );

    const planned = screen.getByLabelText(/24 August/i);
    fireEvent.click(planned);
    expect(screen.getByRole('button', { name: /cancel selected sessions/i })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /cancel selected sessions/i }));
    expect(screen.getByText(/will not end the recurring rule/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^cancel selected sessions$/i }));
    await waitFor(() => {
      expect(on_confirm).toHaveBeenCalled();
    });
  });
});
