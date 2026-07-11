import { beforeEach, describe, expect, it, vi } from 'vitest';

const { create_client_mock } = vi.hoisted(() => ({
  create_client_mock: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: create_client_mock,
}));

import { book_session_action, cancel_booking_action } from '@/app/(marketing)/book/actions';

describe('book_session_action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps slot conflict errors from the booking RPC', async () => {
    create_client_mock.mockResolvedValue({
      rpc: vi.fn(async () => ({
        data: null,
        error: { message: 'P0013 slot conflict' },
      })),
    });

    const result = await book_session_action('session-1', 'pkg-1');

    expect(result).toEqual({
      success: false,
      error:
        'You already have a booking at this time. You can book other sessions the same day, but not two classes at the same time.',
      code: 'P0013',
    });
  });

  it('maps full-capacity errors from the booking RPC', async () => {
    create_client_mock.mockResolvedValue({
      rpc: vi.fn(async () => ({
        data: null,
        error: { message: 'P0015 session full' },
      })),
    });

    const result = await book_session_action('session-1', 'pkg-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('This session is full and cannot be booked.');
      expect(result.code).toBe('P0015');
    }
  });

  it('rejects non-booked outcomes defensively', async () => {
    create_client_mock.mockResolvedValue({
      rpc: vi.fn(async () => ({
        data: { id: 'booking-1', status: 'waitlisted' },
        error: null,
      })),
    });

    const result = await book_session_action('session-1', 'pkg-1');

    expect(result).toEqual({
      success: false,
      error: 'This session is full and cannot be booked.',
      code: 'P0015',
    });
  });

  it('maps insufficient-credit errors from the booking RPC', async () => {
    create_client_mock.mockResolvedValue({
      rpc: vi.fn(async () => ({
        data: null,
        error: { message: 'P0008 insufficient credits' },
      })),
    });

    const result = await book_session_action('session-1', 'pkg-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('You do not have enough credits in this package for this session.');
      expect(result.code).toBe('P0008');
    }
  });

  it('returns booked status from a successful RPC', async () => {
    create_client_mock.mockResolvedValue({
      rpc: vi.fn(async () => ({
        data: { id: 'booking-1', status: 'booked' },
        error: null,
      })),
    });

    const result = await book_session_action('session-1', 'pkg-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.status).toBe('booked');
    }
  });
});

describe('cancel_booking_action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps the 4-hour cancellation cutoff error', async () => {
    create_client_mock.mockResolvedValue({
      rpc: vi.fn(async () => ({
        data: null,
        error: { message: 'P0029 cutoff' },
      })),
    });

    const result = await cancel_booking_action('booking-1');

    expect(result).toEqual({
      success: false,
      error:
        'Online cancellation closes 4 hours before class. Your session credit is kept for this booking.',
    });
  });
});
