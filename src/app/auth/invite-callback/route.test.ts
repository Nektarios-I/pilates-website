import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

const create_server_client_mock = vi.mocked(createServerClient);

function auth_client({
  exchange_error,
  verify_error,
  session_after = true,
}: {
  exchange_error?: Error;
  verify_error?: Error;
  session_after?: boolean;
} = {}) {
  let processed = false;

  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: processed ? 'invited-user' : 'admin-user' } },
        error: null,
      })),
      getSession: vi.fn(async () => ({
        data: {
          session:
            processed && session_after
              ? { user: { id: 'invited-user' } }
              : { user: { id: 'admin-user' } },
        },
        error: null,
      })),
      exchangeCodeForSession: vi.fn(async () => {
        processed = !exchange_error;
        return { error: exchange_error ?? null };
      }),
      verifyOtp: vi.fn(async () => {
        processed = !verify_error;
        return { error: verify_error ?? null };
      }),
    },
  };
}

describe('/auth/invite-callback route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://supabase.test';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable';
  });

  it('exchanges code and redirects to reset password on success', async () => {
    create_server_client_mock.mockReturnValue(auth_client() as never);

    const response = await GET(
      new NextRequest('http://localhost:3000/auth/invite-callback?code=fresh-code'),
    );

    expect(response.headers.get('location')).toBe('http://localhost:3000/auth/reset-password');
  });

  it('verifies token_hash/type=invite and redirects to reset password on success', async () => {
    create_server_client_mock.mockReturnValue(auth_client() as never);

    const response = await GET(
      new NextRequest(
        'http://localhost:3000/auth/invite-callback?token_hash=fresh&type=invite',
      ),
    );

    expect(response.headers.get('location')).toBe('http://localhost:3000/auth/reset-password');
  });

  it('missing params lands on explicit invite error, not unrelated /account', async () => {
    create_server_client_mock.mockReturnValue(auth_client() as never);

    const response = await GET(
      new NextRequest('http://localhost:3000/auth/invite-callback'),
    );

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/auth/invite-error?reason=no_auth_payload',
    );
  });

  it('invalid or expired invite lands on explicit invite error', async () => {
    create_server_client_mock.mockReturnValue(
      auth_client({ verify_error: new Error('Token has expired') }) as never,
    );

    const response = await GET(
      new NextRequest(
        'http://localhost:3000/auth/invite-callback?token_hash=used&type=invite',
      ),
    );

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/auth/invite-error?reason=exchange_failed',
    );
  });
});
