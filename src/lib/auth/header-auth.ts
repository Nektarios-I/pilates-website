export type HeaderAuth = {
  is_signed_in: boolean;
  is_staff: boolean;
  is_admin_or_owner: boolean;
  display_name: string | null;
};

export const unsigned_header_auth: HeaderAuth = {
  is_signed_in: false,
  is_staff: false,
  is_admin_or_owner: false,
  display_name: null,
};

const STAFF_ROLES = ['owner', 'admin', 'instructor'] as const;

type RoleRow = { role: string };

export function build_header_auth(
  user: { email?: string | null } | null,
  roles: RoleRow[] | null | undefined,
  full_name: string | null | undefined,
): HeaderAuth {
  if (!user) return unsigned_header_auth;

  const role_values = (roles ?? []).map((row) => row.role);
  const is_staff = role_values.some((role) =>
    (STAFF_ROLES as readonly string[]).includes(role),
  );
  const is_admin_or_owner = role_values.some((role) => role === 'owner' || role === 'admin');

  const display_name = full_name
    ? full_name.split(' ')[0]
    : (user.email?.split('@')[0] ?? null);

  return { is_signed_in: true, is_staff, is_admin_or_owner, display_name };
}

/** Prefer server auth once it catches up; otherwise use live client session auth. */
export function merge_header_auth(
  server_auth: HeaderAuth,
  client_auth: HeaderAuth | null,
): HeaderAuth {
  if (server_auth.is_signed_in) return server_auth;
  if (client_auth?.is_signed_in) return client_auth;
  if (client_auth) return client_auth;
  return server_auth;
}
