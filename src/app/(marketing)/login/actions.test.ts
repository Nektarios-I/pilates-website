import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock_signInWithPassword = vi.fn();
const mock_verifyOtp = vi.fn();
const mock_signOut = vi.fn();
const mock_from = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn((destination: string) => {
  throw new Error(`REDIRECT:${destination}`);
});

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock('next/navigation', () => ({
  redirect: (destination: string) => redirect(destination),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mock_signInWithPassword,
      verifyOtp: mock_verifyOtp,
      signOut: mock_signOut,
    },
    from: mock_from,
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mock_from,
  })),
}));

describe('login actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sign_in_with_password redirects to account on success', async () => {
    mock_signInWithPassword.mockResolvedValue({ error: null });

    const { sign_in_with_password } = await import('./actions');

    await expect(sign_in_with_password('user@example.com', 'secret')).rejects.toThrow(
      'REDIRECT:/account',
    );
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('sign_in_with_password maps invalid credentials', async () => {
    mock_signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });

    const { sign_in_with_password } = await import('./actions');
    const result = await sign_in_with_password('user@example.com', 'wrong');

    expect(result).toEqual({
      success: false,
      error: 'Incorrect email/name or password. Check your details and try again.',
    });
  });

  it('verify_sign_in_otp redirects to account on success', async () => {
    mock_verifyOtp.mockResolvedValue({ error: null });

    const { verify_sign_in_otp } = await import('./actions');

    await expect(verify_sign_in_otp('user@example.com', '123456')).rejects.toThrow(
      'REDIRECT:/account',
    );
  });
});
