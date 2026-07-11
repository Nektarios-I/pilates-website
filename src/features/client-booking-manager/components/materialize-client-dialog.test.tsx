'use client';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  list_occurrences_mock,
  materialize_mock,
} = vi.hoisted(() => ({
  list_occurrences_mock: vi.fn(),
  materialize_mock: vi.fn(),
}));

vi.mock('@/features/client-booking-manager/actions', () => ({
  list_client_materializable_occurrences: list_occurrences_mock,
  materialize_client_recurring_prebooks: materialize_mock,
}));

import { MaterializeClientDialog } from '@/features/client-booking-manager/components/materialize-client-dialog';

const occurrence = {
  rule_id: 'rule-1',
  rule_label: 'Tuesday reformer',
  session_card_title: 'Reformer',
  schedule_line_id: 'line-1',
  occurrence_date: '2026-07-15',
  start_time: '09:00:00',
  occurrence_starts_at: '2026-07-15T06:00:00.000Z',
  booking_state: 'planned',
  token_health: 'ok' as const,
  failure_message: null,
};

describe('MaterializeClientDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    list_occurrences_mock.mockResolvedValue({ success: true, rows: [occurrence] });
  });

  it('closes and reports success after materialization creates bookings', async () => {
    const on_close = vi.fn();
    const on_complete = vi.fn();
    const on_error = vi.fn();
    const on_refresh = vi.fn();

    materialize_mock.mockResolvedValue({
      success: true,
      result: {
        booking_ids: ['booking-1'],
        processed: 1,
        succeeded: 1,
        failed: 0,
        skipped: 0,
        excluded: 0,
        window_start: '2026-07-11',
        window_end: '2026-07-25',
        failures: [],
      },
    });

    render(
      <MaterializeClientDialog
        client_user_id="client-1"
        on_close={on_close}
        on_complete={on_complete}
        on_error={on_error}
        on_refresh={on_refresh}
        open
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /materialize 1 occurrence/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /materialize 1 occurrence/i }));

    await waitFor(() => {
      expect(on_close).toHaveBeenCalledTimes(1);
      expect(on_complete).toHaveBeenCalledWith(expect.stringContaining('1 booking created'));
      expect(on_error).not.toHaveBeenCalled();
      expect(on_refresh).toHaveBeenCalledWith({ silent: true });
    });

    expect(materialize_mock).toHaveBeenCalledWith('client-1', [
      {
        rule_id: 'rule-1',
        schedule_line_id: 'line-1',
        occurrence_date: '2026-07-15',
        start_time: '09:00:00',
      },
    ]);
  });

  it('blocks materialize when a selected row has insufficient tokens', async () => {
    list_occurrences_mock.mockResolvedValue({
      success: true,
      rows: [{ ...occurrence, token_health: 'insufficient_tokens' }],
    });

    render(
      <MaterializeClientDialog
        client_user_id="client-1"
        on_close={vi.fn()}
        on_complete={vi.fn()}
        on_error={vi.fn()}
        on_refresh={vi.fn()}
        open
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /materialize 1 occurrence/i })).toBeDisabled();
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/not enough credits/i);
    expect(materialize_mock).not.toHaveBeenCalled();
  });

  it('keeps the dialog open and surfaces errors when materialization fails', async () => {
    const on_close = vi.fn();
    const on_complete = vi.fn();
    const on_error = vi.fn();
    const on_refresh = vi.fn();

    materialize_mock.mockResolvedValue({
      success: false,
      error: 'Not enough credits for all selected occurrences.',
    });

    render(
      <MaterializeClientDialog
        client_user_id="client-1"
        on_close={on_close}
        on_complete={on_complete}
        on_error={on_error}
        on_refresh={on_refresh}
        open
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /materialize 1 occurrence/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /materialize 1 occurrence/i }));

    await waitFor(() => {
      expect(on_close).not.toHaveBeenCalled();
      expect(on_error).toHaveBeenCalledWith('Not enough credits for all selected occurrences.');
      expect(on_complete).not.toHaveBeenCalled();
      expect(on_refresh).toHaveBeenCalledWith({ silent: true });
      expect(screen.getByRole('alert')).toHaveTextContent(/not enough credits/i);
    });
  });
});
