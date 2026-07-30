import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MembershipPanel } from './membership-panel';

const list_user_memberships = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/features/client-booking-manager/format', () => ({
  format_client_label: (name: string | null, email: string | null) => name ?? email ?? 'Client',
}));

vi.mock('./actions', () => ({
  list_user_memberships: (...args: unknown[]) => list_user_memberships(...args),
  apply_membership: vi.fn(),
  deactivate_membership: vi.fn(),
  remove_membership: vi.fn(),
  update_membership_credits: vi.fn(),
  extend_membership_expiry: vi.fn(),
}));

describe('MembershipPanel lifecycle groups', () => {
  beforeEach(() => {
    list_user_memberships.mockReset();
    list_user_memberships.mockResolvedValue([
      {
        id: 'active-1',
        package_id: 'p1',
        package_name: 'Reformer · Active',
        class_type: 'reformer',
        status: 'active',
        credits_remaining: 5,
        expires_at: '2099-01-01T00:00:00.000Z',
        purchased_at: '2026-07-01T00:00:00.000Z',
        starts_at: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 'expired-1',
        package_id: 'p2',
        package_name: 'Reformer · Expired With Credits',
        class_type: 'reformer',
        status: 'expired',
        credits_remaining: 9,
        expires_at: '2026-07-01T00:00:00.000Z',
        purchased_at: '2026-06-01T00:00:00.000Z',
        starts_at: '2026-06-01T00:00:00.000Z',
      },
      {
        id: 'exhausted-1',
        package_id: 'p3',
        package_name: 'Reformer · Exhausted',
        class_type: 'reformer',
        status: 'used_up',
        credits_remaining: 0,
        expires_at: '2099-02-01T00:00:00.000Z',
        purchased_at: '2026-07-02T00:00:00.000Z',
        starts_at: '2026-07-02T00:00:00.000Z',
      },
      {
        id: 'cancelled-1',
        package_id: 'p4',
        package_name: 'Reformer · Cancelled',
        class_type: 'reformer',
        status: 'cancelled',
        credits_remaining: 3,
        expires_at: '2099-03-01T00:00:00.000Z',
        purchased_at: '2026-07-03T00:00:00.000Z',
        starts_at: '2026-07-03T00:00:00.000Z',
      },
    ]);
  });

  it('shows Active open by default and collapses history groups', async () => {
    render(
      <MembershipPanel
        clients={[{ id: 'c1', full_name: 'Test Client', email: 't@example.com', phone: null }]}
        packages={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText('Client account'), { target: { value: 'c1' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Active packages \(1\)/i })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    expect(screen.getByText('Reformer · Active')).toBeInTheDocument();

    const expired_toggle = screen.getByRole('button', { name: /Expired packages \(1\)/i });
    expect(expired_toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Reformer · Expired With Credits')).not.toBeInTheDocument();

    fireEvent.click(expired_toggle);
    expect(expired_toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Reformer · Expired With Credits')).toBeInTheDocument();
    expect(
      screen.getByText(/Adjusting credits alone will not make this package bookable/i),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Exhausted packages \(1\)/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: /Cancelled packages \(1\)/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
