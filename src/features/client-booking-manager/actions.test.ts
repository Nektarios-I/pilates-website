import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  add_recurring_skip,
  list_client_materializable_occurrences,
  load_client_dashboard,
  materialize_client_recurring_prebooks,
  retry_materialization,
  staff_cancel_client_booking,
  staff_manual_book_session,
  staff_manual_book_slot,
} from '@/features/client-booking-manager/actions';

const { create_client_mock, revalidate_path_mock } = vi.hoisted(() => ({
  create_client_mock: vi.fn(),
  revalidate_path_mock: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: create_client_mock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidate_path_mock,
}));

vi.mock('@/app/(marketing)/staff/membership/actions', () => ({
  list_manageable_clients: vi.fn(),
}));

vi.mock('@/app/(marketing)/book/schedule-actions', () => ({
  get_session_cards: vi.fn(),
  get_slots_for_day: vi.fn(async () => [
    { slot_start: '09:00', slot_end: '10:00' },
  ]),
}));

function staff_supabase(options?: {
  rpc_error?: string | null;
  rpc_data?: unknown;
  rpc_name?: string;
}) {
  const rpc = vi.fn(async (name: string) => {
    if (options?.rpc_name && name !== options.rpc_name) {
      return { data: null, error: null };
    }
    if (options?.rpc_error) {
      return { data: null, error: { message: options.rpc_error } };
    }
    return { data: options?.rpc_data ?? null, error: null };
  });

  const from = vi.fn((table: string) => {
    if (table === 'user_roles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: [{ role: 'instructor' }], error: null })),
        })),
      };
    }

    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(async () => ({ data: [], error: null })),
          })),
        })),
        in: vi.fn(async () => ({ data: [], error: null })),
      })),
    };
  });

  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'staff-user' } } })),
    },
    from,
    rpc,
  };
}

describe('client booking manager actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated callers', async () => {
    create_client_mock.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    });

    await expect(staff_cancel_client_booking('booking-1')).resolves.toEqual({
      success: false,
      error: 'You must be signed in as staff.',
    });
  });

  it('rejects non-staff callers', async () => {
    create_client_mock.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'client-user' } } })) },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: [{ role: 'client' }], error: null })),
        })),
      })),
    });

    await expect(retry_materialization('log-1')).resolves.toEqual({
      success: false,
      error: 'You must be signed in as staff.',
    });
  });

  it('cancels bookings through cancel_booking RPC', async () => {
    const supabase = staff_supabase();
    create_client_mock.mockResolvedValue(supabase);

    const result = await staff_cancel_client_booking('booking-1');

    expect(result).toEqual({ success: true });
    expect(supabase.rpc).toHaveBeenCalledWith('cancel_booking', {
      p_booking_id: 'booking-1',
      p_reason: 'Cancelled by staff',
    });
    expect(revalidate_path_mock).toHaveBeenCalledWith('/staff/client-bookings');
  });

  it('staff cancel succeeds without client P0029 cutoff mapping (late cancel is allowed in SQL)', async () => {
    const supabase = staff_supabase({
      rpc_data: { id: 'booking-1', status: 'cancelled', credits_used: 1 },
    });
    create_client_mock.mockResolvedValue(supabase);

    const result = await staff_cancel_client_booking('booking-1');

    expect(result).toEqual({ success: true });
    expect(supabase.rpc).toHaveBeenCalledWith('cancel_booking', {
      p_booking_id: 'booking-1',
      p_reason: 'Cancelled by staff',
    });
  });

  it('surfaces unexpected P0029 from staff cancel as a generic RPC failure', async () => {
    const supabase = staff_supabase({ rpc_error: 'P0029 cutoff' });
    create_client_mock.mockResolvedValue(supabase);

    const result = await staff_cancel_client_booking('booking-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('P0029');
    }
  });

  it('maps full-session staff booking errors clearly', async () => {
    const supabase = staff_supabase({ rpc_error: 'P0015 session full' });
    create_client_mock.mockResolvedValue(supabase);

    const result = await staff_manual_book_session('client-1', 'session-1', 'pkg-1');

    expect(result).toEqual({
      success: false,
      error: 'This session is full. Staff manual booking does not waitlist.',
    });
    expect(supabase.rpc).toHaveBeenCalledWith('staff_book_session_for_client', {
      p_client_user_id: 'client-1',
      p_session_id: 'session-1',
      p_user_package_id: 'pkg-1',
    });
  });

  it('materializes a slot then books for the client', async () => {
    const supabase = staff_supabase({ rpc_data: 'session-new' });
    const from_mock = vi.fn((table: string) => {
      if (table === 'user_roles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(async () => ({ data: [{ role: 'instructor' }], error: null })),
          })),
        };
      }
      if (table === 'session_cards') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: {
                    id: 'card-1',
                    session_type: 'reformer',
                    capacity: 6,
                    credits_required: 1,
                    reformer_credits_required: 1,
                    mat_credits_required: 0,
                    is_active: true,
                  },
                  error: null,
                })),
              })),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(async () => ({ data: [], error: null })),
            })),
          })),
          in: vi.fn(async () => ({ data: [], error: null })),
        })),
      };
    });
    supabase.from = from_mock as typeof supabase.from;
    create_client_mock.mockResolvedValue(supabase);

    const result = await staff_manual_book_slot(
      'client-1',
      '2026-08-20',
      '09:00',
      '10:00',
      'card-1',
      'pkg-1',
    );

    expect(result).toEqual({ success: true });
    expect(supabase.rpc).toHaveBeenCalledWith('ensure_session_slot_at', expect.any(Object));
    expect(supabase.rpc).toHaveBeenCalledWith('staff_book_session_for_client', {
      p_client_user_id: 'client-1',
      p_session_id: 'session-new',
      p_user_package_id: 'pkg-1',
    });
  });

  it('rejects recurring skips that are not in the rule forecast', async () => {
    const supabase = staff_supabase();
    supabase.rpc = vi.fn(async (name: string) => {
      if (name === 'get_recurring_prebook_forecast') {
        return {
          data: [
            {
              occurrence_date: '2026-07-12',
              start_time: '09:00:00',
              occurrence_starts_at: '2026-07-12T09:00:00+03:00',
            },
          ],
          error: null,
        };
      }
      return { data: null, error: null };
    });
    create_client_mock.mockResolvedValue(supabase);

    const result = await add_recurring_skip('rule-1', '2026-07-13', '09:00', 'Away');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('not part of this recurring rule');
    }
  });

  it('uses split-credit staff booking RPC when mat package is provided', async () => {
    const supabase = staff_supabase();
    create_client_mock.mockResolvedValue(supabase);

    const result = await staff_manual_book_session('client-1', 'session-1', 'pkg-r', 'pkg-m');

    expect(result).toEqual({ success: true });
    expect(supabase.rpc).toHaveBeenCalledWith('staff_book_session_with_credits_for_client', {
      p_client_user_id: 'client-1',
      p_session_id: 'session-1',
      p_reformer_user_package_id: 'pkg-r',
      p_mat_user_package_id: 'pkg-m',
    });
  });

  it('materializes selected recurring occurrences via selection RPC', async () => {
    const supabase = staff_supabase({
      rpc_name: 'staff_materialize_client_recurring_selection',
      rpc_data: {
        booking_ids: ['booking-1', 'booking-2'],
        processed: 2,
        succeeded: 2,
        failed: 0,
        skipped: 0,
        excluded: 0,
        window_start: '2026-07-10',
        window_end: '2026-07-24',
        failures: [],
      },
    });
    create_client_mock.mockResolvedValue(supabase);

    const selected = [
      {
        rule_id: 'rule-1',
        schedule_line_id: 'line-1',
        occurrence_date: '2026-07-20',
        start_time: '06:00',
      },
      {
        rule_id: 'rule-1',
        schedule_line_id: 'line-1',
        occurrence_date: '2026-07-22',
        start_time: '06:00',
      },
    ];
    const result = await materialize_client_recurring_prebooks('client-1', selected);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result.booking_ids).toEqual(['booking-1', 'booking-2']);
      expect(result.result.succeeded).toBe(2);
    }
    expect(supabase.rpc).toHaveBeenCalledWith('staff_materialize_client_recurring_selection', {
      p_client_user_id: 'client-1',
      p_occurrences: [
        {
          rule_id: 'rule-1',
          schedule_line_id: 'line-1',
          occurrence_date: '2026-07-20',
          start_time: '06:00:00',
        },
        {
          rule_id: 'rule-1',
          schedule_line_id: 'line-1',
          occurrence_date: '2026-07-22',
          start_time: '06:00:00',
        },
      ],
    });
    expect(revalidate_path_mock).toHaveBeenCalledWith('/staff/client-bookings');
    expect(revalidate_path_mock).toHaveBeenCalledWith('/account');
  });

  it('returns an error when no occurrences are selected', async () => {
    const result = await materialize_client_recurring_prebooks('client-1', []);

    expect(result).toEqual({
      success: false,
      error: 'Select at least one occurrence to materialize.',
    });
  });

  it('returns an error when materialization creates no bookings', async () => {
    const supabase = staff_supabase({
      rpc_name: 'staff_materialize_client_recurring_selection',
      rpc_data: {
        booking_ids: [],
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
        excluded: 0,
        window_start: '2026-07-10',
        window_end: '2026-07-24',
        failures: [],
      },
    });
    create_client_mock.mockResolvedValue(supabase);

    const result = await materialize_client_recurring_prebooks('client-1', [
      {
        rule_id: 'rule-1',
        schedule_line_id: 'line-1',
        occurrence_date: '2026-07-20',
        start_time: '06:00',
      },
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('No bookings were created');
    }
  });

  it('parses jsonb RPC responses returned as JSON strings', async () => {
    const supabase = staff_supabase({
      rpc_name: 'staff_materialize_client_recurring_selection',
      rpc_data: JSON.stringify({
        booking_ids: ['booking-1'],
        processed: 1,
        succeeded: 1,
        failed: 0,
        skipped: 0,
        excluded: 0,
        window_start: '2026-07-10',
        window_end: '2026-07-24',
        failures: [],
      }),
    });
    create_client_mock.mockResolvedValue(supabase);

    const result = await materialize_client_recurring_prebooks('client-1', [
      {
        rule_id: 'rule-1',
        schedule_line_id: 'line-1',
        occurrence_date: '2026-07-20',
        start_time: '06:00',
      },
    ]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result.booking_ids).toEqual(['booking-1']);
    }
  });

  it('surfaces token preflight failures from selection RPC', async () => {
    const supabase = staff_supabase({
      rpc_name: 'staff_materialize_client_recurring_selection',
      rpc_error: 'P0037: Not enough credits for all selected occurrences',
    });
    create_client_mock.mockResolvedValue(supabase);

    const result = await materialize_client_recurring_prebooks('client-1', [
      {
        rule_id: 'rule-1',
        schedule_line_id: 'line-1',
        occurrence_date: '2026-07-20',
        start_time: '06:00',
      },
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Not enough credits');
    }
  });

  it('surfaces list materializable RPC errors', async () => {
    const supabase = staff_supabase({
      rpc_name: 'list_client_materializable_occurrences',
      rpc_error:
        'function list_client_materializable_occurrences(uuid) does not exist',
    });
    create_client_mock.mockResolvedValue(supabase);

    const result = await list_client_materializable_occurrences('client-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('list_client_materializable_occurrences');
    }
  });

  it('surfaces retry failures from materialization status', async () => {
    const supabase = staff_supabase({
      rpc_name: 'retry_recurring_materialization',
      rpc_data: { status: 'failed', failure_message: 'Still full' },
    });
    create_client_mock.mockResolvedValue(supabase);

    const result = await retry_materialization('log-1');

    expect(result).toEqual({ success: false, error: 'Still full' });
  });

  it('loads dashboard data for a selected client', async () => {
    const supabase = staff_supabase();
    supabase.rpc = vi.fn(async (name: string) => {
      if (name === 'get_active_packages') return { data: [{ user_package_id: 'pkg-1' }], error: null };
      if (name === 'list_recurring_prebook_rules') return { data: [], error: null };
      if (name === 'list_recurring_prebook_attention') return { data: [], error: null };
      if (name === 'get_recurring_prebook_forecast') return { data: [], error: null };
      return { data: null, error: null };
    });
    create_client_mock.mockResolvedValue(supabase);

    const dashboard = await load_client_dashboard('client-1');

    expect(dashboard.packages).toHaveLength(1);
    expect(dashboard.bookings).toEqual([]);
    expect(dashboard.recurring_rules).toEqual([]);
    expect(dashboard.attention).toEqual([]);
  });
});
