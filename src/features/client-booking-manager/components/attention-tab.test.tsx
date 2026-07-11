import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { retry_mock } = vi.hoisted(() => ({
  retry_mock: vi.fn(),
}));

vi.mock('@/features/client-booking-manager/actions', () => ({
  retry_materialization: retry_mock,
}));

import { AttentionTab } from '@/features/client-booking-manager/components/attention-tab';

const attention_row = {
  id: 'log-1',
  rule_id: 'rule-1',
  occurrence_date: '2026-07-15',
  occurrence_starts_at: '2026-07-15T09:00:00.000Z',
  occurrence_ends_at: '2026-07-15T10:00:00.000Z',
  status: 'failed',
  failure_code: 'session_full',
  failure_message: 'Session is full',
  attempt_count: 2,
  last_attempted_at: '2026-07-14T04:00:00.000Z',
};

describe('AttentionTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty attention state intentionally', () => {
    render(<AttentionTab attention={[]} on_refresh={vi.fn()} />);

    expect(
      screen.getByText('No failed or pending materializations need attention.'),
    ).toBeInTheDocument();
  });

  it('wires retry to the materialization retry action', async () => {
    const on_refresh = vi.fn();
    retry_mock.mockResolvedValue({ success: true });

    render(<AttentionTab attention={[attention_row]} on_refresh={on_refresh} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(retry_mock).toHaveBeenCalledWith('log-1');
    });
    expect(screen.getByText('Retry succeeded. Refreshing…')).toBeInTheDocument();
    expect(on_refresh).toHaveBeenCalled();
  });

  it('shows retry failures explicitly', async () => {
    retry_mock.mockResolvedValue({ success: false, error: 'Still full' });

    render(<AttentionTab attention={[attention_row]} on_refresh={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByText('Still full')).toBeInTheDocument();
    });
  });
});
