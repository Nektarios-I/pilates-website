import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  load_client_dashboard_mock,
  replace_mock,
  refresh_mock,
  search_params_mock,
} = vi.hoisted(() => ({
  load_client_dashboard_mock: vi.fn(),
  replace_mock: vi.fn(),
  refresh_mock: vi.fn(),
  search_params_mock: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replace_mock, refresh: refresh_mock }),
  useSearchParams: () => search_params_mock,
}));

vi.mock('@/features/client-booking-manager/actions', () => ({
  load_client_dashboard: load_client_dashboard_mock,
  list_bookable_sessions_for_staff: vi.fn(async () => []),
  staff_cancel_client_booking: vi.fn(),
  staff_manual_book_session: vi.fn(),
  staff_manual_book_slot: vi.fn(),
  create_recurring_rule: vi.fn(),
  deactivate_recurring_rule: vi.fn(),
  delete_recurring_rule: vi.fn(),
  update_recurring_rule: vi.fn(),
  list_recurring_schedule_lines: vi.fn(async () => []),
  add_recurring_schedule_line: vi.fn(),
  deactivate_recurring_schedule_line: vi.fn(),
  list_recurring_skips: vi.fn(async () => []),
  add_recurring_skip: vi.fn(),
  remove_recurring_skip: vi.fn(),
  list_client_materializable_occurrences: vi.fn(async () => ({ success: true, rows: [] })),
  materialize_client_recurring_prebooks: vi.fn(),
  load_recurring_forecast: vi.fn(async () => []),
  list_weekly_slot_patterns_for_card: vi.fn(async () => []),
  retry_materialization: vi.fn(),
}));

import { ClientBookingManagerPanel } from '@/features/client-booking-manager/client-booking-manager-panel';

const clients = [
  { id: 'client-1', full_name: 'Alex Client', email: 'alex@example.com', phone: '+357 99 111111' },
  { id: 'client-2', full_name: 'Sam Client', email: null, phone: '+357 99 222222' },
];

const session_cards = [
  {
    id: 'card-1',
    title: 'Morning Reformer',
    description: '',
    session_type: 'reformer' as const,
    duration_minutes: 55,
    instructor_name: null,
    image_src: null,
    capacity: 8,
    credits_required: 1,
    reformer_credits_required: 1,
    mat_credits_required: 0,
  },
];

describe('ClientBookingManagerPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search_params_mock.forEach((_, key) => search_params_mock.delete(key));
    load_client_dashboard_mock.mockResolvedValue({
      packages: [],
      bookings: [],
      recurring_rules: [
        {
          id: 'rule-1',
          client_user_id: 'client-1',
          session_card_id: 'card-1',
          label: 'Tuesday reformer',
          status: 'active',
          created_at: '2026-07-01T00:00:00.000Z',
          session_card_title: 'Morning Reformer',
          forecast: [],
        },
      ],
      attention: [],
    });
  });

  it('shows the empty state before a client is selected', () => {
    render(<ClientBookingManagerPanel clients={clients} session_cards={session_cards} />);

    expect(
      screen.getByText('Select a client to manage bookings and recurring prebooks.'),
    ).toBeInTheDocument();
  });

  it('filters clients in the selector and loads dashboard data on selection', async () => {
    render(<ClientBookingManagerPanel clients={clients} session_cards={session_cards} />);

    fireEvent.change(screen.getByLabelText('Search clients'), { target: { value: 'sam' } });
    fireEvent.change(screen.getByLabelText('Client account'), { target: { value: 'client-2' } });

    await waitFor(() => {
      expect(load_client_dashboard_mock).toHaveBeenCalledWith('client-2');
    });
    expect(replace_mock).toHaveBeenCalledWith('/staff/client-bookings?client=client-2', {
      scroll: false,
    });
  });

  it('renders recurring rules for the selected client', async () => {
    render(<ClientBookingManagerPanel clients={clients} session_cards={session_cards} />);

    fireEvent.change(screen.getByLabelText('Client account'), { target: { value: 'client-1' } });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Recurring Prebooks' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Recurring Prebooks' }));

    await waitFor(() => {
      expect(screen.getByText('Tuesday reformer')).toBeInTheDocument();
    });
  });

  it('uses server-preloaded dashboard data without an immediate reload', () => {
    render(
      <ClientBookingManagerPanel
        clients={clients}
        initial_client_id="client-1"
        initial_dashboard={{
          packages: [{ user_package_id: 'pkg-1', package_name: '10 Pack', class_type: 'reformer', package_type: 'bundle', credits_remaining: 5, expires_at: null }],
          bookings: [],
          recurring_rules: [],
          attention: [],
        }}
        session_cards={session_cards}
      />,
    );

    expect(screen.getByText('10 Pack')).toBeInTheDocument();
    expect(load_client_dashboard_mock).not.toHaveBeenCalled();
  });

  it('shows a dashboard load error with retry', async () => {
    load_client_dashboard_mock.mockRejectedValueOnce(new Error('network'));

    render(<ClientBookingManagerPanel clients={clients} session_cards={session_cards} />);
    fireEvent.change(screen.getByLabelText('Client account'), { target: { value: 'client-2' } });

    await waitFor(() => {
      expect(
        screen.getByText('Could not load client booking data. Please try again.'),
      ).toBeInTheDocument();
    });
  });
});
