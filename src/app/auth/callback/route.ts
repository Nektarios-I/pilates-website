import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { authDebugError, authDebugLog } from '@/lib/auth/debug';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env';

// Supabase can redirect to this callback in two different ways:
//
//   PKCE flow:
//     ?code=xxx  → exchange code for session (requires PKCE verifier cookie from sign-in)
//
//   Token-hash flow:
//     ?token_hash=xxx&type=magiclink  → verify OTP directly (no verifier needed)
//
// Supabase may also redirect with error params when the link is invalid:
//     ?error=access_denied&error_code=otp_expired

type OtpType =
  | 'email'
  | 'signup'
  | 'invite'
  | 'magiclink'
  | 'recovery'
  | 'email_change'
  | 'phone_change';

const VALID_OTP_TYPES: OtpType[] = [
  'email',
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'phone_change',
];

function login_error_redirect(origin: string, hint: string) {
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error&hint=${hint}`);
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const origin = url.origin;
  const next = url.searchParams.get('next') ?? '/account';

  authDebugLog('auth-callback: request received', {
    full_url: url.toString(),
    pathname: url.pathname,
    search_params: Object.fromEntries(url.searchParams.entries()),
    has_code: Boolean(url.searchParams.get('code')),
    has_token_hash: Boolean(url.searchParams.get('token_hash')),
    has_type: Boolean(url.searchParams.get('type')),
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    redirect_destination: `${origin}${next}`,
    note:
      'If OAuth provider config is disabled in Supabase, the callback may never be reached.',
  });

  // ── Supabase error redirect (expired / already-used link) ───────────────
  const auth_error = url.searchParams.get('error');
  const error_code = url.searchParams.get('error_code');

  if (auth_error || error_code) {
    authDebugError('auth-callback: Supabase error redirect', { auth_error, error_code });
    const hint = error_code === 'otp_expired' ? 'link_expired' : 'auth_failed';
    return login_error_redirect(origin, hint);
  }

  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as OtpType | null;

  if (!code && !token_hash) {
    authDebugError('auth-callback: no auth params received');
    return login_error_redirect(origin, 'link_expired_or_invalid');
  }

  // Session cookies must be written onto the redirect response itself.
  // Using cookies() from next/headers alone does not attach them to this response.
  const redirect_url = `${origin}${next}`;
  const response = NextResponse.redirect(redirect_url);

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies_to_set) {
        cookies_to_set.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // ── PKCE flow ────────────────────────────────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authDebugLog('auth-callback: exchangeCodeForSession result', {
      success: !error,
      error: error?.message ?? null,
    });
    if (!error) {
      return response;
    }

    // PKCE verifier missing usually means the link was opened in a different
    // browser than the one that requested the email.
    if (error.message.includes('PKCE code verifier not found')) {
      return login_error_redirect(origin, 'pkce_browser_mismatch');
    }
  }

  // ── Token-hash / OTP verify flow ─────────────────────────────────────────
  if (token_hash && type && VALID_OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    authDebugLog('auth-callback: verifyOtp result', {
      success: !error,
      type,
      error: error?.message ?? null,
    });
    if (!error) {
      return response;
    }
  }

  const received = `code=${code ?? 'none'} token_hash=${token_hash ?? 'none'} type=${type ?? 'none'}`;
  authDebugError('auth-callback: auth failed', { received });

  return login_error_redirect(origin, 'link_expired_or_invalid');
}
