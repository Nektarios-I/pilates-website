import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock_getUser = vi.fn();
const mock_from = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mock_getUser },
    from: mock_from,
  })),
}));

describe('staff-page-access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when unauthenticated', async () => {
    mock_getUser.mockResolvedValue({ data: { user: null } });

    const { resolve_caller_has_staff_access } = await import('./staff-page-access');
    await expect(resolve_caller_has_staff_access()).resolves.toBe(false);
  });

  it('returns true for teaching staff roles', async () => {
    mock_getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mock_from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [{ role: 'instructor' }] }),
      }),
    });

    const { resolve_caller_has_staff_access } = await import('./staff-page-access');
    await expect(resolve_caller_has_staff_access()).resolves.toBe(true);
  });

  it('returns false for client-only accounts', async () => {
    mock_getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mock_from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [{ role: 'client' }] }),
      }),
    });

    const { resolve_caller_has_staff_access } = await import('./staff-page-access');
    await expect(resolve_caller_has_staff_access()).resolves.toBe(false);
  });
});
