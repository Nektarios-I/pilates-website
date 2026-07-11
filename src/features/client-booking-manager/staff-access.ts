export const TEACHING_STAFF_ROLES = ['instructor', 'owner', 'admin'] as const;

export type TeachingStaffRole = (typeof TEACHING_STAFF_ROLES)[number];

export function caller_has_staff_access(roles: string[]): boolean {
  return roles.some((role) => (TEACHING_STAFF_ROLES as readonly string[]).includes(role));
}
