import { describe, expect, it } from 'vitest';

import { safe_auth_next_path } from '@/lib/auth/safe-auth-redirect';

describe('safe_auth_next_path', () => {
  it('defaults to account when next is missing', () => {
    expect(safe_auth_next_path(undefined)).toBe('/account');
  });

  it('allows known internal paths', () => {
    expect(safe_auth_next_path('/book')).toBe('/book');
    expect(safe_auth_next_path('/staff/bookings')).toBe('/staff/bookings');
    expect(safe_auth_next_path('/staff/day-bookings')).toBe('/staff/day-bookings');
  });

  it('blocks open redirects', () => {
    expect(safe_auth_next_path('//evil.test/account')).toBe('/account');
    expect(safe_auth_next_path('https://evil.test')).toBe('/account');
  });

  it('blocks redirect loops through login', () => {
    expect(safe_auth_next_path('/login')).toBe('/account');
    expect(safe_auth_next_path('/login?x=1')).toBe('/account');
  });

  it('blocks unknown paths', () => {
    expect(safe_auth_next_path('/admin-secret')).toBe('/account');
  });
});
