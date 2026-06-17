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

function admin_client() {
  const inviteUserByEmail = vi.fn(async () => ({
    data: { user: { id: 'new-auth-user' } },
    error: null,
  }));
  const createUser = vi.fn(async () => ({
    data: { user: { id: 'manual-auth-user' } },
    error: null,
  }));

  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ error: null })),
        })),
      };
    }

    if (table === 'user_roles') {
      return {
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
      full_name: 'New Owner',
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
      full_name: 'Manual Client',
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
        full_name: 'Manual Client',
        phone: '+357 97621017',
      },
    });
    expect(admin.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
  });
});
