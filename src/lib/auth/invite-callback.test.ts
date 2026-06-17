import { describe, expect, it } from 'vitest';

import {
  decideInviteCallback,
  readInviteCallbackPayload,
} from './invite-callback';

describe('invite callback payload parsing', () => {
  it('detects a fresh invite callback with code', () => {
    const payload = readInviteCallbackPayload(
      new URL('http://localhost:3000/auth/invite-callback?code=abc'),
    );

    expect(decideInviteCallback(payload)).toEqual({ kind: 'code', code: 'abc' });
  });

  it('detects token_hash invite callbacks', () => {
    const payload = readInviteCallbackPayload(
      new URL('http://localhost:3000/auth/invite-callback?token_hash=hash&type=invite'),
    );

    expect(decideInviteCallback(payload)).toEqual({
      kind: 'token_hash',
      token_hash: 'hash',
      type: 'invite',
    });
  });

  it('detects missing auth params', () => {
    const payload = readInviteCallbackPayload(
      new URL('http://localhost:3000/auth/invite-callback'),
    );

    expect(decideInviteCallback(payload)).toEqual({
      kind: 'missing',
      reason: 'no_auth_payload',
    });
  });

  it('detects invalid token types', () => {
    const payload = readInviteCallbackPayload(
      new URL('http://localhost:3000/auth/invite-callback?token_hash=hash&type=email'),
    );

    expect(decideInviteCallback(payload)).toEqual({
      kind: 'invalid',
      reason: 'unsupported_token_type',
    });
  });

  it('detects browser hash session payloads for client-side handling', () => {
    const payload = readInviteCallbackPayload(
      new URL(
        'http://localhost:3000/auth/invite#access_token=access&refresh_token=refresh&type=invite',
      ),
    );

    expect(decideInviteCallback(payload)).toEqual({
      kind: 'hash_session',
      access_token: 'access',
      refresh_token: 'refresh',
    });
  });
});
