import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAdminClient } from './admin';
import { getSupabaseServiceRoleKey } from './env';

describe('createAdminClient', () => {
  const original_url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const original_service_key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = original_url;
    process.env.SUPABASE_SERVICE_ROLE_KEY = original_service_key;
    vi.resetModules();
  });

  it('throws when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => createAdminClient()).toThrow('SUPABASE_SERVICE_ROLE_KEY must be set.');
  });

  it('accepts a trimmed service role key from env', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '  service-role-key  ';

    expect(getSupabaseServiceRoleKey()).toBe('service-role-key');
    expect(() => createAdminClient()).not.toThrow();
  });
});
