const DEFAULT_SIGNED_IN_PATH = '/account';

/** Allowed post-login destinations (extend when adding new landing pages). */
const ALLOWED_NEXT_PATHS = new Set([
  '/account',
  '/book',
  '/staff/invite',
  '/staff/day-bookings',
  '/staff/bookings',
  '/staff/pricing',
  '/staff/messages',
  '/staff/schedule',
  '/staff/session-cards',
  '/staff/membership',
  '/staff/remove',
  '/staff/client-bookings',
]);

/**
 * Validates `next` from the login handoff query string.
 * Rejects open redirects and auth loops.
 */
export function safe_auth_next_path(next: string | undefined): string {
  if (!next) return DEFAULT_SIGNED_IN_PATH;
  if (!next.startsWith('/') || next.startsWith('//')) return DEFAULT_SIGNED_IN_PATH;
  if (next.startsWith('/login')) return DEFAULT_SIGNED_IN_PATH;

  const path_only = next.split('?')[0]?.split('#')[0] ?? '';
  if (!ALLOWED_NEXT_PATHS.has(path_only)) return DEFAULT_SIGNED_IN_PATH;

  return next;
}

export { DEFAULT_SIGNED_IN_PATH };
