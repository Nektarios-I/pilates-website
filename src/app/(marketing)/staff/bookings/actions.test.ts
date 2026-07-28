import { beforeEach, describe, expect, it, vi } from 'vitest';

import { STAFF_BOOKING_HISTORY_SELECT } from '@/features/bookings/staff-booking-queries';
import { createClient } from '@/lib/supabase/server';

import { list_staff_bookings } from './actions';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const create_client_mock = vi.mocked(createClient);

const maria_row = {
  id: '2c230621-2812-44b4-9bfb-2c38c97eb178',
  status: 'booked',
  booked_at: '2026-07-20T09:00:00.000Z',
  cancelled_at: null,
  cancellation_reason: null,
  credits_used: 1,
  profiles: {
    full_name: 'MARIA ERAKLEOUS',
    email: 'mariaerakleous6@iclous.com',
    phone: null,
  },
  sessions: {
    title: 'Reformer · 30 Jul 19:00',
    starts_at: '2026-07-30T16:00:00.000Z',
    ends_at: '2026-07-30T17:00:00.000Z',
    session_type: 'reformer',
    location: 'Studio',
    credits_required: 1,
    reformer_credits_required: 1,
    mat_credits_required: 0,
  },
  booking_credit_charges: [{ class_type: 'reformer', credits_used: 1 }],
};

function admin_supabase(options?: {
  bookings_error?: { message: string; code?: string; hint?: string } | null;
  bookings_data?: unknown[];
}) {
  const select = vi.fn(() => {
    const query: Record<string, unknown> = {};
    const finalize = async () => ({
      data: options?.bookings_error ? null : (options?.bookings_data ?? [maria_row]),
      error: options?.bookings_error ?? null,
    });

    query.order = vi.fn(() => query);
    query.limit = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.neq = vi.fn(() => query);
    query.lt = vi.fn(() => query);
    query.gte = vi.fn(() => query);
    query.lte = vi.fn(() => query);
    // terminal thenable
    query.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(finalize()).then(resolve, reject);

    return query;
  });

  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'admin-user' } } })) },
    from: vi.fn((table: string) => {
      if (table === 'user_roles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(async () => ({ data: [{ role: 'admin' }], error: null })),
          })),
        };
      }
      if (table === 'bookings') {
        return { select };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
    _select: select,
  };
}

describe('list_staff_bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selects bookings with the explicit client profile relationship', async () => {
    const supabase = admin_supabase();
    create_client_mock.mockResolvedValue(supabase as never);

    await list_staff_bookings();

    expect(supabase._select).toHaveBeenCalledWith(STAFF_BOOKING_HISTORY_SELECT);
  });

  it('maps Maria Erakleous booking into history records', async () => {
    create_client_mock.mockResolvedValue(admin_supabase() as never);

    const result = await list_staff_bookings();

    expect(result.error).toBeNull();
    expect(result.bookings).toHaveLength(1);
    expect(result.bookings[0]).toMatchObject({
      id: maria_row.id,
      status: 'booked',
      client_name: 'MARIA ERAKLEOUS',
      session_title: 'Reformer · 30 Jul 19:00',
      session_starts_at: '2026-07-30T16:00:00.000Z',
      credit_charges: [{ class_type: 'reformer', credits_used: 1 }],
    });
  });

  it('maps cancelled bookings and keeps friendly load errors', async () => {
    const cancelled = {
      ...maria_row,
      id: 'cancelled-1',
      status: 'cancelled',
      cancelled_at: '2026-07-28T10:00:00.000Z',
      cancellation_reason: 'Client requested',
    };
    create_client_mock.mockResolvedValue(
      admin_supabase({ bookings_data: [cancelled] }) as never,
    );

    const result = await list_staff_bookings({
      status: 'cancelled',
      search: '',
      session_start_date: '',
      session_end_date: '',
    });

    expect(result.error).toBeNull();
    expect(result.bookings[0]?.status).toBe('cancelled');
    expect(result.bookings[0]?.cancellation_reason).toBe('Client requested');
  });

  it('returns a friendly error and logs PGRST diagnostics on query failure', async () => {
    const console_error = vi.spyOn(console, 'error').mockImplementation(() => {});
    create_client_mock.mockResolvedValue(
      admin_supabase({
        bookings_error: {
          code: 'PGRST201',
          message: 'Could not embed because more than one relationship was found',
          hint: 'Try profiles!bookings_user_id_fkey',
        },
      }) as never,
    );

    const result = await list_staff_bookings();

    expect(result).toEqual({
      bookings: [],
      error: 'Unable to load bookings. Please try again.',
    });
    expect(console_error).toHaveBeenCalledWith(
      expect.stringContaining('code=PGRST201'),
    );

    console_error.mockRestore();
  });
});
