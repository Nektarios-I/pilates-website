'use client';

import { useState } from 'react';

import {
  decideInviteCallback,
  readInviteCallbackPayload,
} from '@/lib/auth/invite-callback';

type FragmentSnapshot = {
  full_url: string;
  pathname: string;
  search_params: Record<string, string>;
  hash_param_keys: string[];
  decision_kind: string;
};

export function DebugFragmentClient() {
  const [snapshot] = useState<FragmentSnapshot | null>(() => {
    if (typeof window === 'undefined') return null;

    const payload = readInviteCallbackPayload(new URL(window.location.href));
    const decision = decideInviteCallback(payload);

    return {
      full_url: payload.full_url,
      pathname: payload.pathname,
      search_params: payload.search_params,
      hash_param_keys: Object.keys(payload.hash_params),
      decision_kind: decision.kind,
    };
  });

  if (!snapshot) {
    return <p className="text-sm text-stone-600">Reading browser-visible URL payload...</p>;
  }

  return (
    <pre className="overflow-auto rounded-md border border-border bg-stone-950 p-4 text-left text-xs leading-5 text-stone-50">
      {JSON.stringify(snapshot, null, 2)}
    </pre>
  );
}
