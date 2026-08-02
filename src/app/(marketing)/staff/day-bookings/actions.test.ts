import { beforeEach, describe, expect, it, vi } from 'vitest';

import { STAFF_DAY_BOOKINGS_SELECT } from '@/features/bookings/staff-booking-queries';
import { createClient } from '@/lib/supabase/server';

import { list_day_bookings, list_week_day_bookings } from './actions';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const create_client_mock = vi.mocked(createClient);

const maria_row = {
  id: '2c230621-2812-44b4-9bfb-2c38c97eb178',
  status: 'booked',
  booked_at: '2026-07-20T09:00:00.000Z',
  cancelled_at: null,
  session_id: 'session-30-jul',
  profiles: {
    full_name: 'MARIA ERAKLEOUS',
    email: 'mariaerakleous6@iclous.com',
    phone: null,
  },
  sessions: {
    id: 'session-30-jul',
    title: 'Reformer · 30 Jul 19:00',
    starts_at: '2026-07-30T16:00:00.000Z',
    ends_at: '2026-07-30T17:00:00.000Z',
    session_type: 'reformer',
    location: 'Studio',
    status: 'scheduled',
    capacity: 6,
    instructor: { full_name: 'Instructor' },
  },
};

function staff_supabase(options?: {
  bookings_error?: { message: string; code?: string; hint?: string } | null;
  bookings_data?: unknown[];
}) {
  const last_query: {
    gte?: ReturnType<typeof vi.fn>;
    lte?: ReturnType<typeof vi.fn>;
    in?: ReturnType<typeof vi.fn>;
    order?: ReturnType<typeof vi.fn>;
  } = {};

  const select = vi.fn(() => {
    const query: Record<string, unknown> = {};
    const finalize = async () => ({
      data: options?.bookings_error ? null : (options?.bookings_data ?? [maria_row]),
      error: options?.bookings_error ?? null,
    });

    query.gte = vi.fn(() => query);
    query.lte = vi.fn(() => query);
    query.in = vi.fn(() => query);
    query.order = vi.fn(() => query);
    query.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(finalize()).then(resolve, reject);

    last_query.gte = query.gte as ReturnType<typeof vi.fn>;
    last_query.lte = query.lte as ReturnType<typeof vi.fn>;
    last_query.in = query.in as ReturnType<typeof vi.fn>;
    last_query.order = query.order as ReturnType<typeof vi.fn>;

    return query;
  });

  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'staff-user' } } })) },
    from: vi.fn((table: string) => {
      if (table === 'user_roles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(async () => ({ data: [{ role: 'owner' }], error: null })),
          })),
        };
      }
      if (table === 'bookings') {
        return { select };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
    _select: select,
    _last_query: last_query,
  };
}

describe('list_day_bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selects day bookings with the explicit client profile relationship', async () => {
    const supabase = staff_supabase();
    create_client_mock.mockResolvedValue(supabase as never);

    await list_day_bookings({
      date_key: '2026-07-30',
      hour_start: '06:00',
      hour_end: '22:00',
    });

    expect(supabase._select).toHaveBeenCalledWith(STAFF_DAY_BOOKINGS_SELECT);
  });

  it('groups Maria Erakleous into the active roster for 30 Jul', async () => {
    create_client_mock.mockResolvedValue(staff_supabase() as never);

    const result = await list_day_bookings({
      date_key: '2026-07-30',
      hour_start: '06:00',
      hour_end: '22:00',
    });

    expect(result.error).toBeNull();
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]?.active_bookings[0]).toMatchObject({
      id: maria_row.id,
      client_name: 'MARIA ERAKLEOUS',
      status: 'booked',
    });
    expect(result.summary).toEqual({ sessions: 1, active: 1, cancelled: 0 });
  });

  it('places cancelled bookings in the cancelled roster', async () => {
    const cancelled = {
      ...maria_row,
      id: 'cancelled-1',
      status: 'cancelled',
      cancelled_at: '2026-07-28T10:00:00.000Z',
    };
    create_client_mock.mockResolvedValue(
      staff_supabase({ bookings_data: [cancelled] }) as never,
    );

    const result = await list_day_bookings({
      date_key: '2026-07-30',
      hour_start: '06:00',
      hour_end: '22:00',
    });

    expect(result.error).toBeNull();
    expect(result.sessions[0]?.cancelled_bookings).toHaveLength(1);
    expect(result.summary.cancelled).toBe(1);
  });

  it('returns the known friendly day error and logs PGRST diagnostics', async () => {
    const console_error = vi.spyOn(console, 'error').mockImplementation(() => {});
    create_client_mock.mockResolvedValue(
      staff_supabase({
        bookings_error: {
          code: 'PGRST201',
          message: 'Could not embed because more than one relationship was found',
          hint: 'Try profiles!bookings_user_id_fkey',
        },
      }) as never,
    );

    const result = await list_day_bookings({
      date_key: '2026-07-30',
      hour_start: '06:00',
      hour_end: '22:00',
    });

    expect(result.error).toBe('Unable to load bookings for this day. Please try again.');
    expect(result.sessions).toEqual([]);
    expect(console_error).toHaveBeenCalledWith(
      expect.stringContaining('code=PGRST201'),
    );

    console_error.mockRestore();
  });
});

describe('list_week_day_bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries one week window with the shared day-bookings select', async () => {
    const supabase = staff_supabase();
    create_client_mock.mockResolvedValue(supabase as never);

    await list_week_day_bookings({
      date_key: '2026-07-30',
      hour_start: '06:00',
      hour_end: '22:00',
    });

    expect(supabase._select).toHaveBeenCalledWith(STAFF_DAY_BOOKINGS_SELECT);
    expect(supabase._last_query.gte).toHaveBeenCalledWith(
      'sessions.starts_at',
      '2026-07-27T00:00:00',
    );
    expect(supabase._last_query.lte).toHaveBeenCalledWith(
      'sessions.starts_at',
      '2026-08-02T23:59:59',
    );
  });

  it('groups week sessions onto the correct studio-local day', async () => {
    create_client_mock.mockResolvedValue(staff_supabase() as never);

    const result = await list_week_day_bookings({
      date_key: '2026-07-30',
      hour_start: '06:00',
      hour_end: '22:00',
    });

    expect(result.error).toBeNull();
    expect(result.overview.monday_key).toBe('2026-07-27');
    expect(result.overview.total_sessions).toBe(1);
    const thursday = result.overview.days.find((day) => day.date_key === '2026-07-30');
    expect(thursday?.session_count).toBe(1);
    expect(thursday?.slots[0]?.sessions[0]?.title).toBe('Reformer · 30 Jul 19:00');
  });

  it('returns a friendly week error without leaking PostgREST details', async () => {
    const console_error = vi.spyOn(console, 'error').mockImplementation(() => {});
    create_client_mock.mockResolvedValue(
      staff_supabase({
        bookings_error: {
          code: 'PGRST201',
          message: 'Could not embed because more than one relationship was found',
        },
      }) as never,
    );

    const result = await list_week_day_bookings({
      date_key: '2026-07-30',
      hour_start: '06:00',
      hour_end: '22:00',
    });

    expect(result.error).toBe('Unable to load bookings for this week. Please try again.');
    expect(result.overview.total_sessions).toBe(0);
    expect(console_error).toHaveBeenCalledWith(expect.stringContaining('list_week_day_bookings'));

    console_error.mockRestore();
  });
});
