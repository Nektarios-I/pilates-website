'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  authDebugError,
  authDebugLog,
  setClientAuthDebugEnabled,
} from '@/lib/auth/debug';
import {
  decideInviteCallback,
  readInviteCallbackPayload,
} from '@/lib/auth/invite-callback';
import { createClient } from '@/lib/supabase/client';

type InviteClientProps = {
  debugEnabled: boolean;
};

type Status = 'processing' | 'error';

export function InviteClient({ debugEnabled }: InviteClientProps) {
  const router = useRouter();
  const [status, set_status] = useState<Status>('processing');
  const [message, set_message] = useState('Preparing your account setup...');

  useEffect(() => {
    setClientAuthDebugEnabled(debugEnabled);

    async function complete_invite() {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const payload = readInviteCallbackPayload(url);
      const decision = decideInviteCallback(payload);

      authDebugLog('invite-client: received URL payload', {
        full_url: payload.full_url,
        pathname: payload.pathname,
        search_params: payload.search_params,
        hash_param_keys: Object.keys(payload.hash_params),
        has_code: Boolean(payload.code),
        has_token_hash: Boolean(payload.token_hash),
        has_type: Boolean(payload.type),
        has_access_token: Boolean(payload.access_token),
        has_refresh_token: Boolean(payload.refresh_token),
        decision,
      });

      const before_session = await supabase.auth.getSession();
      authDebugLog('invite-client: session before processing', {
        has_session: Boolean(before_session.data.session),
        user_id: before_session.data.session?.user.id ?? null,
        error: before_session.error?.message ?? null,
      });

      let error_message: string | null = null;

      if (decision.kind === 'code') {
        const { error } = await supabase.auth.exchangeCodeForSession(decision.code);
        error_message = error?.message ?? null;
        authDebugLog('invite-client: exchangeCodeForSession result', {
          success: !error,
          error: error?.message ?? null,
        });
      } else if (decision.kind === 'token_hash') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: decision.token_hash,
          type: decision.type,
        });
        error_message = error?.message ?? null;
        authDebugLog('invite-client: verifyOtp result', {
          success: !error,
          type: decision.type,
          error: error?.message ?? null,
        });
      } else if (decision.kind === 'hash_session') {
        const { error } = await supabase.auth.setSession({
          access_token: decision.access_token,
          refresh_token: decision.refresh_token,
        });
        error_message = error?.message ?? null;
        authDebugLog('invite-client: setSession from hash result', {
          success: !error,
          error: error?.message ?? null,
        });
      } else {
        error_message =
          decision.kind === 'missing'
            ? 'No invite token was found in the link.'
            : `Invite link payload is invalid: ${decision.reason}.`;
        authDebugError('invite-client: cannot process invite payload', { decision, payload });
      }

      const after_session = await supabase.auth.getSession();
      authDebugLog('invite-client: session after processing', {
        has_session: Boolean(after_session.data.session),
        user_id: after_session.data.session?.user.id ?? null,
        error: after_session.error?.message ?? null,
      });

      if (!error_message && after_session.data.session) {
        authDebugLog('invite-client: redirecting to reset password', {
          reason: 'invite_session_established',
        });
        router.replace('/auth/reset-password');
        router.refresh();
        return;
      }

      authDebugError('invite-client: invite failed', {
        reason: error_message ?? 'session_missing_after_successful_exchange',
      });
      set_message(
        error_message ??
          'The invite link was recognized, but no invited-user session was established.',
      );
      set_status('error');
    }

    complete_invite().catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'The invite link could not be processed.';
      authDebugError('invite-client: unexpected failure', { message });
      set_message(message);
      set_status('error');
    });
  }, [debugEnabled, router]);

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-md rounded-md border border-red-200 bg-red-50 p-6 text-center">
        <h1 className="text-xl font-semibold text-red-950">Invite link could not be completed</h1>
        <p className="mt-3 text-sm leading-6 text-red-800">{message}</p>
        <p className="mt-3 text-sm leading-6 text-red-800">
          Ask the studio to send a fresh invite. If this was opened from a phone email app, try
          opening the link in the same browser where you plan to use the website.
        </p>
        <Link
          className="mt-5 inline-flex text-sm font-medium text-red-900 underline underline-offset-4"
          href="/login"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-md border border-border bg-surface p-6 text-center">
      <h1 className="text-xl font-semibold text-stone-950">Opening your invite</h1>
      <p className="mt-3 text-sm leading-6 text-stone-600">{message}</p>
    </div>
  );
}
