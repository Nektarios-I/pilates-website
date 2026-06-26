import { createClient } from '@/lib/supabase/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { submit_contact_message } from './actions';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const create_client_mock = vi.mocked(createClient);

describe('submit_contact_message', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns validation errors without calling Supabase', async () => {
    const result = await submit_contact_message({
      name: '',
      email: 'bad',
      phone: '1',
      message: 'short',
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/name/i);
    expect(create_client_mock).not.toHaveBeenCalled();
  });

  it('inserts a normalized message', async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const from = vi.fn(() => ({ insert }));
    create_client_mock.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } } })) },
      from,
    } as never);

    const result = await submit_contact_message({
      name: '  Maria  ',
      email: ' MARIA@Example.COM ',
      phone: '+357 99 954286',
      message: 'I would like to book a reformer intro class.',
    });

    expect(result).toEqual({ success: true });
    expect(from).toHaveBeenCalledWith('contact_messages');
    expect(insert).toHaveBeenCalledWith({
      name: 'Maria',
      email: 'maria@example.com',
      phone: '+357 99 954286',
      message: 'I would like to book a reformer intro class.',
      submitted_by_user_id: 'user-1',
    });
  });
});
