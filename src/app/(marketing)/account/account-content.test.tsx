import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/(marketing)/book/actions', () => ({
  cancel_booking_action: vi.fn(),
}));

vi.mock('@/app/(marketing)/login/actions', () => ({
  signOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { updateUser: vi.fn() },
  })),
}));

import { AccountContent } from '@/app/(marketing)/account/account-content';
import { CANCELLATION_POLICY_SHORT } from '@/lib/booking/cancellation-policy';

const base_user = {
  id: 'user-1',
  email: 'client@example.com',
} as never;

describe('AccountContent cancellation policy', () => {
  it('shows policy text and hides cancel inside the 2-hour window', () => {
    const inside_cutoff = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const outside_cutoff = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    render(
      <AccountContent
        active_packages={[]}
        profile={null}
        roles={[]}
        upcoming_bookings={[
          {
            id: 'inside',
            status: 'booked',
            created_at: '2026-07-01T10:00:00.000Z',
            sessions: [
              {
                id: 's1',
                title: 'Soon class',
                starts_at: inside_cutoff,
                ends_at: inside_cutoff,
                session_type: 'reformer',
                location: null,
              },
            ],
          },
          {
            id: 'outside',
            status: 'booked',
            created_at: '2026-07-01T10:00:00.000Z',
            sessions: [
              {
                id: 's2',
                title: 'Later class',
                starts_at: outside_cutoff,
                ends_at: outside_cutoff,
                session_type: 'reformer',
                location: null,
              },
            ],
          },
        ]}
        user={base_user}
      />,
    );

    expect(screen.getByText(CANCELLATION_POLICY_SHORT)).toBeInTheDocument();
    expect(
      screen.getByText(
        'Online cancellation closes 2 hours before class. Your session credit is kept for this booking.',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Cancel booking' })).toHaveLength(1);
  });

  it('shows legacy waitlisted status without a cancel button', () => {
    render(
      <AccountContent
        active_packages={[]}
        profile={null}
        roles={[]}
        upcoming_bookings={[
          {
            id: 'legacy-wl',
            status: 'waitlisted',
            created_at: '2026-07-01T10:00:00.000Z',
            sessions: [
              {
                id: 's3',
                title: 'Legacy waitlist',
                starts_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                ends_at: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
                session_type: 'reformer',
                location: null,
              },
            ],
          },
        ]}
        user={base_user}
      />,
    );

    expect(screen.getByText('waitlisted')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel booking' })).not.toBeInTheDocument();
  });
});
