import { createClient } from '@/lib/supabase/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { delete_contact_message, list_contact_messages } from './actions';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const create_client_mock = vi.mocked(createClient);

function admin_client() {
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
      if (table === 'contact_messages') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(async () => ({
              data: [
                {
                  id: 'msg-1',
                  created_at: '2026-06-26T10:00:00.000Z',
                  name: 'Maria',
                  email: 'maria@example.com',
                  phone: '+357 99 954286',
                  message: 'Hello studio',
                },
              ],
              error: null,
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe('staff contact messages actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list_contact_messages returns rows for admin users', async () => {
    create_client_mock.mockResolvedValue(admin_client() as never);

    const rows = await list_contact_messages();

    expect(rows).toHaveLength(1);
    expect(rows[0]?.email).toBe('maria@example.com');
  });

  it('delete_contact_message removes a message for admin users', async () => {
    create_client_mock.mockResolvedValue(admin_client() as never);

    const result = await delete_contact_message('msg-1');

    expect(result).toEqual({ success: true });
  });
});
