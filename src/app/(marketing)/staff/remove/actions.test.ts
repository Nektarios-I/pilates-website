import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { list_manageable_clients } from '../membership/actions';
import { list_removable_users } from './actions';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const create_admin_client_mock = vi.mocked(createAdminClient);
const create_client_mock = vi.mocked(createClient);

function staff_server_client(role: string) {
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'staff-user' } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(async () => ({ data: [{ role }], error: null })),
      })),
    })),
  };
}

function admin_profiles_client(rows: unknown[]) {
  const admin_from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          neq: vi.fn(async () => ({ data: rows, error: null })),
          order: vi.fn(async () => ({ data: rows, error: null })),
        })),
      };
    }

    if (table === 'user_roles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: [], error: null })),
        })),
      };
    }

    throw new Error(`Unexpected admin table: ${table}`);
  });

  return { from: admin_from };
}

describe('staff remove admin queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list_removable_users fetches profiles via the admin client', async () => {
    create_client_mock.mockResolvedValue(staff_server_client('admin') as never);
    const admin = admin_profiles_client([
      {
        id: 'target-user',
        full_name: 'Test Client',
        email: 'client@example.com',
        user_roles: [{ role: 'client' }],
      },
    ]);
    create_admin_client_mock.mockReturnValue(admin as never);

    const users = await list_removable_users();

    expect(create_admin_client_mock).toHaveBeenCalled();
    expect(admin.from).toHaveBeenCalledWith('profiles');
    expect(users).toEqual([
      {
        id: 'target-user',
        full_name: 'Test Client',
        email: 'client@example.com',
        role: 'client',
      },
    ]);
  });
});

describe('staff membership admin queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list_manageable_clients fetches profiles via the admin client', async () => {
    create_client_mock.mockResolvedValue(staff_server_client('instructor') as never);
    const admin = admin_profiles_client([
      {
        id: 'client-user',
        full_name: 'Studio Client',
        email: 'studio@example.com',
        user_roles: [{ role: 'client' }],
      },
    ]);
    create_admin_client_mock.mockReturnValue(admin as never);

    const clients = await list_manageable_clients();

    expect(create_admin_client_mock).toHaveBeenCalled();
    expect(admin.from).toHaveBeenCalledWith('profiles');
    expect(clients).toEqual([
      {
        id: 'client-user',
        full_name: 'Studio Client',
        email: 'studio@example.com',
      },
    ]);
  });
});
