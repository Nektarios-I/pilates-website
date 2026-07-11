import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { create_staff_invite } from './actions';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const create_admin_client_mock = vi.mocked(createAdminClient);
const create_client_mock = vi.mocked(createClient);

function server_client_for_admin() {
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'admin-user' } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(async () => ({ data: [{ role: 'admin' }], error: null })),
      })),
    })),
  };
}

function admin_client(options?: {
  profile_email?: { id: string } | null;
  auth_users?: { id: string; email: string; email_confirmed_at?: string | null }[];
  create_user_error?: { message: string } | null;
}) {
  const inviteUserByEmail = vi.fn(async () => ({
    data: { user: { id: 'new-auth-user' } },
    error: null,
  }));
  const createUser = vi.fn(async () => {
    if (options?.create_user_error) {
      return { data: { user: null }, error: options.create_user_error };
    }
    return {
      data: { user: { id: 'manual-auth-user' } },
      error: null,
    };
  });
  const updateUserById = vi.fn(async () => ({ data: { user: { id: 'orphan-user' } }, error: null }));
  const listUsers = vi.fn(async () => ({
    data: {
      users: (options?.auth_users ?? []).map((user) => ({
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at ?? null,
      })),
    },
    error: null,
  }));

  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: options?.profile_email ?? null, error: null })),
          })),
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
          not: vi.fn(async () => ({ data: [], error: null })),
        })),
        insert: vi.fn(async () => ({ error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ error: null })),
        })),
      };
    }

    if (table === 'user_roles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: [], error: null })),
        })),
        insert: vi.fn(async () => ({ error: null })),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    auth: {
      admin: {
        createUser,
        inviteUserByEmail,
        listUsers,
        updateUserById,
      },
    },
    from,
  };
}

describe('create_staff_invite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    create_client_mock.mockResolvedValue(server_client_for_admin() as never);
  });

  it('email_password uses Supabase invite flow with /auth/invite redirect', async () => {
    const admin = admin_client();
    create_admin_client_mock.mockReturnValue(admin as never);

    const result = await create_staff_invite({
      full_name: 'NEW OWNER',
      email: 'owner@example.com',
      phone: '+357 97621017',
      role: 'owner',
      method: 'email_password',
    });

    expect(result).toEqual({
      success: true,
      user_id: 'new-auth-user',
      method: 'email_password',
    });
    expect(admin.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
      'owner@example.com',
      expect.objectContaining({
        redirectTo: 'http://localhost:3000/auth/invite',
      }),
    );
    expect(admin.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it('manual_account creates an auth user immediately without sending an invite email', async () => {
    const admin = admin_client();
    create_admin_client_mock.mockReturnValue(admin as never);

    const result = await create_staff_invite({
      full_name: 'MANUAL CLIENT',
      email: 'manual@example.com',
      phone: '+357 97621017',
      role: 'client',
      method: 'manual_account',
      password: 'temporary-password',
    });

    expect(result).toEqual({
      success: true,
      user_id: 'manual-auth-user',
      method: 'manual_account',
    });
    expect(admin.auth.admin.createUser).toHaveBeenCalledWith({
      email: 'manual@example.com',
      password: 'temporary-password',
      email_confirm: true,
      user_metadata: {
        full_name: 'MANUAL CLIENT',
        phone: '+357 97621017',
      },
    });
    expect(admin.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it('manual_account without email uses an internal auth email and null profile email', async () => {
    const admin = admin_client();
    create_admin_client_mock.mockReturnValue(admin as never);

    const result = await create_staff_invite({
      full_name: 'PHONE ONLY CLIENT',
      email: '',
      phone: '+357 99 123 456',
      role: 'client',
      method: 'manual_account',
      password: 'temporary-password',
    });

    expect(result.success).toBe(true);
    expect(admin.auth.admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'phone+35799123456@accounts.corehouse.internal',
        password: 'temporary-password',
        user_metadata: {
          full_name: 'PHONE ONLY CLIENT',
          phone: '+357 99 123 456',
        },
      }),
    );
  });

  it('repairs orphaned auth.users rows when profiles were cleared by a data reset', async () => {
    const admin = admin_client({
      auth_users: [{ id: 'orphan-user', email: 'orphan@example.com' }],
      create_user_error: { message: 'User already registered' },
    });
    create_admin_client_mock.mockReturnValue(admin as never);

    const result = await create_staff_invite({
      full_name: 'ORPHAN CLIENT',
      email: 'orphan@example.com',
      phone: '+357 97621017',
      role: 'client',
      method: 'manual_account',
      password: 'temporary-password',
    });

    expect(result).toEqual({
      success: true,
      user_id: 'orphan-user',
      method: 'manual_account',
    });
    expect(admin.auth.admin.updateUserById).toHaveBeenCalled();
    expect(admin.auth.admin.createUser).not.toHaveBeenCalled();
  });
});
