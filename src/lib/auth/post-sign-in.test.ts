import { describe, expect, it } from 'vitest';

import { map_auth_network_error } from '@/lib/auth/post-sign-in';

describe('post-sign-in helpers', () => {
  it('maps fetch failures to a friendly message', () => {
    expect(map_auth_network_error('fetch failed')).toBe(
      'Could not reach the authentication service. Check your internet connection and try again.',
    );
  });

  it('passes through unrelated auth errors', () => {
    expect(map_auth_network_error('Invalid login credentials')).toBe('Invalid login credentials');
  });
});
