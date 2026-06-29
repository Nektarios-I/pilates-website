import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Guards the documented Supabase SSR sign-in flow — see docs/auth-sign-in-flow.md
 */
describe('auth sign-in policy', () => {
  it('login-form uses server actions for password and OTP verify', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/app/(marketing)/login/login-form.tsx'),
      'utf8',
    );

    expect(source).toContain('sign_in_with_password');
    expect(source).toContain('verify_sign_in_otp');
    expect(source).not.toMatch(/signInWithPassword\s*\(/);
    expect(source).not.toMatch(/complete_client_sign_in/);
    expect(source).not.toMatch(/location\.assign\s*\(/);
  });

  it('header view does not sync client session state', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/layout/site-header-view.tsx'),
      'utf8',
    );

    expect(source).not.toContain('useHeaderAuth');
  });

  it('middleware refreshes session with getClaims', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/lib/supabase/middleware.ts'),
      'utf8',
    );

    expect(source).toContain('getClaims');
  });
});
