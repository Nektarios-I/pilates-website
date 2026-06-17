let client_auth_debug_override = false;

export function setClientAuthDebugEnabled(enabled: boolean) {
  client_auth_debug_override = enabled;
}

export function authDebugEnabled() {
  return process.env.AUTH_DEBUG === 'true' || client_auth_debug_override;
}

export function authDebugLog(message: string, details?: unknown) {
  if (!authDebugEnabled()) return;

  if (details === undefined) {
    console.info(`[auth-debug] ${message}`);
    return;
  }

  console.info(`[auth-debug] ${message}`, details);
}

export function authDebugError(message: string, details?: unknown) {
  if (!authDebugEnabled()) return;

  if (details === undefined) {
    console.error(`[auth-debug] ${message}`);
    return;
  }

  console.error(`[auth-debug] ${message}`, details);
}
