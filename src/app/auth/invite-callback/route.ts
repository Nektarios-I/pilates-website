import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { authDebugError, authDebugLog } from '@/lib/auth/debug';
import {
  decideInviteCallback,
  readInviteCallbackPayload,
} from '@/lib/auth/invite-callback';

// Dedicated callback for admin-initiated invites sent via inviteUserByEmail.
//
// Why a separate route?
// The general /auth/callback uses a `?next=` query param to decide where to
// redirect after processing the token. Supabase does NOT reliably forward
// query params from `redirectTo` into the actual email link — so `next` is
// silently dropped and the invitee lands on /account instead of /auth/reset-password.
//
// Current invite emails should point to /auth/invite instead of this route,
// because Supabase may place auth tokens in the URL fragment (#...) and fragments
// are invisible to server Route Handlers. This route remains for query-param
// based invite links and for diagnostics when older links hit it.

function error_redirect(origin: string, reason: string) {
  return NextResponse.redirect(`${origin}/auth/invite-error?reason=${reason}`);
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const origin = url.origin;
  const payload = readInviteCallbackPayload(url);

  authDebugLog('invite-callback: request received', {
    full_url: payload.full_url,
    pathname: payload.pathname,
    search_params: payload.search_params,
    has_code: Boolean(payload.code),
    has_token_hash: Boolean(payload.token_hash),
    has_type: Boolean(payload.type),
    has_hash_payload: payload.has_hash_payload,
    hash_params_server_note:
      'URL fragments are not sent to server Route Handlers. If this is false while the browser URL contains #access_token, use /auth/invite or /auth/debug-fragment.',
  });

  // Supabase error (e.g. link already used, expired)
  const auth_error = url.searchParams.get('error');
  const error_code = url.searchParams.get('error_code');
  if (auth_error || error_code) {
    authDebugError('invite-callback: Supabase error params', { auth_error, error_code });
    return error_redirect(origin, error_code === 'otp_expired' ? 'link_expired' : 'exchange_failed');
  }

  const destination = `${origin}/auth/reset-password`;
  const response = NextResponse.redirect(destination);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
    },
  );

  const before_user = await supabase.auth.getUser();
  const before_session = await supabase.auth.getSession();
  authDebugLog('invite-callback: session before processing', {
    has_user: Boolean(before_user.data.user),
    user_id: before_user.data.user?.id ?? null,
    user_error: before_user.error?.message ?? null,
    has_session: Boolean(before_session.data.session),
    session_error: before_session.error?.message ?? null,
  });

  const decision = decideInviteCallback(payload);
  authDebugLog('invite-callback: processing decision', decision);

  if (decision.kind === 'missing') {
    authDebugError('invite-callback: missing auth payload', {
      reason: decision.reason,
      note:
        'If Supabase sent #access_token in the browser URL, this server route cannot read it. Point invite redirectTo to /auth/invite.',
    });
    return error_redirect(origin, decision.reason);
  }

  if (decision.kind === 'invalid') {
    authDebugError('invite-callback: invalid auth payload', decision);
    return error_redirect(origin, decision.reason);
  }

  if (decision.kind === 'hash_session') {
    authDebugError('invite-callback: hash session reached server unexpectedly', {
      note:
        'URL fragments should not reach the server. Use /auth/invite for fragment-based invite links.',
    });
    return error_redirect(origin, 'no_auth_payload');
  }

  if (decision.kind === 'code') {
    const { error } = await supabase.auth.exchangeCodeForSession(decision.code);
    authDebugLog('invite-callback: exchangeCodeForSession result', {
      success: !error,
      error: error?.message ?? null,
    });
    if (error) return error_redirect(origin, 'exchange_failed');
  }

  if (decision.kind === 'token_hash') {
    const { error } = await supabase.auth.verifyOtp({
      type: decision.type,
      token_hash: decision.token_hash,
    });
    authDebugLog('invite-callback: verifyOtp result', {
      success: !error,
      type: decision.type,
      error: error?.message ?? null,
    });
    if (error) return error_redirect(origin, 'exchange_failed');
  }

  const after_user = await supabase.auth.getUser();
  const after_session = await supabase.auth.getSession();
  authDebugLog('invite-callback: session after processing', {
    has_user: Boolean(after_user.data.user),
    user_id: after_user.data.user?.id ?? null,
    user_error: after_user.error?.message ?? null,
    has_session: Boolean(after_session.data.session),
    session_error: after_session.error?.message ?? null,
  });

  if (!after_session.data.session) {
    authDebugError('invite-callback: no session after successful exchange');
    return error_redirect(origin, 'session_missing');
  }

  authDebugLog('invite-callback: redirecting', {
    destination,
    reason: 'invite_session_established',
  });
  return response;
}
