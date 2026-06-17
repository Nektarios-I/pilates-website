export type InviteCallbackPayload = {
  full_url: string;
  pathname: string;
  search_params: Record<string, string>;
  hash_params: Record<string, string>;
  code: string | null;
  token_hash: string | null;
  type: string | null;
  access_token: string | null;
  refresh_token: string | null;
  has_query_payload: boolean;
  has_hash_payload: boolean;
};

export type InviteCallbackDecision =
  | { kind: 'code'; code: string }
  | { kind: 'token_hash'; token_hash: string; type: 'invite' | 'signup' | 'recovery' }
  | { kind: 'hash_session'; access_token: string; refresh_token: string }
  | { kind: 'missing'; reason: 'no_auth_payload' }
  | { kind: 'invalid'; reason: 'unsupported_token_type' | 'partial_hash_session' };

const SUPPORTED_TOKEN_HASH_TYPES = ['invite', 'signup', 'recovery'] as const;

function params_to_record(params: URLSearchParams) {
  return Object.fromEntries(params.entries());
}

function parse_hash_params(hash: string) {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(normalized);
}

export function readInviteCallbackPayload(url: URL): InviteCallbackPayload {
  const hash_params = parse_hash_params(url.hash);

  const code = url.searchParams.get('code') ?? hash_params.get('code');
  const token_hash = url.searchParams.get('token_hash') ?? hash_params.get('token_hash');
  const type = url.searchParams.get('type') ?? hash_params.get('type');
  const access_token = hash_params.get('access_token');
  const refresh_token = hash_params.get('refresh_token');

  return {
    full_url: url.toString(),
    pathname: url.pathname,
    search_params: params_to_record(url.searchParams),
    hash_params: params_to_record(hash_params),
    code,
    token_hash,
    type,
    access_token,
    refresh_token,
    has_query_payload: Boolean(url.searchParams.get('code') || url.searchParams.get('token_hash')),
    has_hash_payload: Boolean(code || token_hash || access_token || refresh_token),
  };
}

export function decideInviteCallback(payload: InviteCallbackPayload): InviteCallbackDecision {
  if (payload.code) {
    return { kind: 'code', code: payload.code };
  }

  if (payload.token_hash) {
    if (
      payload.type === 'invite' ||
      payload.type === 'signup' ||
      payload.type === 'recovery'
    ) {
      return { kind: 'token_hash', token_hash: payload.token_hash, type: payload.type };
    }

    return { kind: 'invalid', reason: 'unsupported_token_type' };
  }

  if (payload.access_token || payload.refresh_token) {
    if (payload.access_token && payload.refresh_token) {
      return {
        kind: 'hash_session',
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      };
    }

    return { kind: 'invalid', reason: 'partial_hash_session' };
  }

  return { kind: 'missing', reason: 'no_auth_payload' };
}

export function isSupportedTokenHashType(type: string | null) {
  return SUPPORTED_TOKEN_HASH_TYPES.some((supported_type) => supported_type === type);
}
