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

function build_rows(count: number, options?: { reformer?: number; mat?: number }) {
  return Array.from({ length: count }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    return {
      rule_id: 'rule-1',
      rule_label: 'Tuesday reformer',
      session_card_title: 'Reformer',
      schedule_line_id: 'line-1',
      occurrence_date: `2026-08-${day}`,
      start_time: '09:00:00',
      occurrence_starts_at: `2026-08-${day}T06:00:00.000Z`,
      booking_state: 'planned',
      token_health: 'ok' as const,
      failure_message: null,
      reformer_credits_required: options?.reformer ?? 1,
      mat_credits_required: options?.mat ?? 0,
    };
  });
}

describe('MaterializeClientDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    list_occurrences_mock.mockResolvedValue({
      success: true,
      rows: build_rows(12),
      pools: { reformer: 9, mat: 0 },
    });
  });

  it('defaults to the earliest credit-funded sessions instead of selecting everything', async () => {
    render(
      <MaterializeClientDialog
        client_name="Alex Client"
        client_user_id="client-1"
        on_close={vi.fn()}
        on_complete={vi.fn()}
        on_error={vi.fn()}
        on_refresh={vi.fn()}
        open
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Book 9 occurrence/i })).toBeEnabled();
    });

    const checked = screen.getAllByRole('checkbox').filter(
      (input) => (input as HTMLInputElement).checked,
    );
    expect(checked).toHaveLength(9);
    expect(screen.getAllByText(/not enough credits/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/earliest selected/i)).toBeInTheDocument();
  });

  it('opens with nothing selected and a clear message when credits are zero', async () => {
    list_occurrences_mock.mockResolvedValue({
      success: true,
      rows: build_rows(4),
      pools: { reformer: 0, mat: 0 },
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
      expect(
        screen.getByText(/no eligible .*credits are available/i),
      ).toBeInTheDocument();
    });

    const checked = screen.getAllByRole('checkbox').filter(
      (input) => (input as HTMLInputElement).checked,
    );
    expect(checked).toHaveLength(0);
  });

  it('applies a successful quick-select count and labels unchecked rows as not selected', async () => {
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
      expect(screen.getByRole('button', { name: /^8$/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^8$/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Book 8 occurrence/i })).toBeEnabled();
    });
    expect(screen.getAllByText(/^Not selected$/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/^Not enough credits$/i)).toHaveLength(0);
  });

  it('shows a popup and preserves the prior selection when quick-select exceeds availability', async () => {
    list_occurrences_mock.mockResolvedValue({
      success: true,
      rows: build_rows(20),
      pools: { reformer: 5, mat: 0 },
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
      expect(screen.getByRole('button', { name: /Book 5 occurrence/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /^8$/ }));

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toHaveTextContent(/available credits cover 5/i);
    });
    expect(screen.getByRole('heading', { name: /cannot select that many sessions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Book 5 occurrence/i })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /^OK$/i }));
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('closes and reports success after materialization creates bookings', async () => {
    const on_close = vi.fn();
    const on_complete = vi.fn();
    const on_error = vi.fn();
    const on_refresh = vi.fn();

    list_occurrences_mock.mockResolvedValue({
      success: true,
      rows: build_rows(1),
      pools: { reformer: 1, mat: 0 },
    });

    materialize_mock.mockResolvedValue({
      success: true,
      result: {
        booking_ids: ['booking-1'],
        processed: 1,
        succeeded: 1,
        failed: 0,
        skipped: 0,
        excluded: 0,
        window_start: '2026-08-01',
        window_end: '2026-10-31',
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
      expect(screen.getByRole('button', { name: /Book 1 occurrence/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Book 1 occurrence/i }));

    await waitFor(() => {
      expect(on_close).toHaveBeenCalledTimes(1);
      expect(on_complete).toHaveBeenCalledWith(expect.stringContaining('1 booking created'));
      expect(on_error).not.toHaveBeenCalled();
      expect(on_refresh).toHaveBeenCalledWith({ silent: true });
    });
  });

  it('ignores stale list responses after the dialog client changes', async () => {
    let resolve_first: ((value: unknown) => void) | undefined;
    list_occurrences_mock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolve_first = resolve;
        }),
    );

    const { rerender } = render(
      <MaterializeClientDialog
        client_user_id="client-1"
        on_close={vi.fn()}
        on_complete={vi.fn()}
        on_error={vi.fn()}
        on_refresh={vi.fn()}
        open
      />,
    );

    list_occurrences_mock.mockResolvedValue({
      success: true,
      rows: build_rows(2),
      pools: { reformer: 2, mat: 0 },
    });

    rerender(
      <MaterializeClientDialog
        client_user_id="client-2"
        on_close={vi.fn()}
        on_complete={vi.fn()}
        on_error={vi.fn()}
        on_refresh={vi.fn()}
        open
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Book 2 occurrence/i })).toBeEnabled();
    });

    resolve_first?.({
      success: true,
      rows: build_rows(12),
      pools: { reformer: 9, mat: 0 },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Book 2 occurrence/i })).toBeEnabled();
    });
    expect(screen.queryByRole('button', { name: /Book 9 occurrence/i })).not.toBeInTheDocument();
  });
});
