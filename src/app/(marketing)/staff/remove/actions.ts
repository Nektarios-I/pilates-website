'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type RemovableRole = 'client' | 'instructor' | 'owner' | 'admin';

export type RemovableUser = {
  id: string;
  full_name: string | null;
  email: string;
  role: RemovableRole;
};

export type RemoveResult = { success: true } | { success: false; error: string };

// Which roles each acting role is permitted to remove.
const REMOVAL_PERMISSIONS: Record<RemovableRole, RemovableRole[]> = {
  client: [],
  instructor: ['client'],
  owner: ['client', 'instructor'],
  admin: ['client', 'instructor', 'owner', 'admin'],
};

const ROLE_PRIORITY: RemovableRole[] = ['admin', 'owner', 'instructor', 'client'];

async function resolve_caller_role(): Promise<{
  user_id: string;
  role: RemovableRole;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const role_values = (roles ?? []).map((r) => r.role as RemovableRole);
  const caller_role = ROLE_PRIORITY.find((r) => role_values.includes(r)) ?? null;
  if (!caller_role || caller_role === 'client') return null;

  return { user_id: user.id, role: caller_role };
}

// Returns the list of users the caller is allowed to remove.
// Uses the admin client so all profiles are visible regardless of RLS.
export async function list_removable_users(): Promise<RemovableUser[]> {
  const caller = await resolve_caller_role();
  if (!caller) return [];

  const allowed_roles = REMOVAL_PERMISSIONS[caller.role];
  if (allowed_roles.length === 0) return [];

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, email, user_roles(role)')
    .neq('id', caller.user_id);

  if (error) {
    console.error('[list_removable_users] query failed:', error.message);
    return [];
  }

  const result: RemovableUser[] = [];

  for (const row of data ?? []) {
    const roles_arr = (row.user_roles as { role: string }[] | null) ?? [];
    const highest_role = ROLE_PRIORITY.find((r) =>
      roles_arr.some((ur) => ur.role === r),
    ) as RemovableRole | undefined;

    if (!highest_role) continue;
    if (!allowed_roles.includes(highest_role)) continue;

    result.push({
      id: row.id,
      full_name: row.full_name ?? null,
      email: row.email,
      role: highest_role,
    });
  }

  result.sort((a, b) => {
    const role_order = ROLE_PRIORITY.indexOf(a.role) - ROLE_PRIORITY.indexOf(b.role);
    if (role_order !== 0) return role_order;
    return (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email);
  });

  return result;
}

// Permanently deletes a user account. Cascade on auth.users removes the
// matching profiles and user_roles rows automatically.
export async function remove_user(target_user_id: string): Promise<RemoveResult> {
  const caller = await resolve_caller_role();
  if (!caller) {
    return { success: false, error: 'You must be signed in as staff to remove accounts.' };
  }

  if (target_user_id === caller.user_id) {
    return { success: false, error: 'You cannot remove your own account.' };
  }

  // Re-check that the target role is within the caller's allowed removal scope.
  const admin = createAdminClient();

  const { data: target_roles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', target_user_id);

  const target_role_values = (target_roles ?? []).map((r) => r.role as RemovableRole);
  const target_role = ROLE_PRIORITY.find((r) => target_role_values.includes(r)) ?? null;

  if (!target_role) {
    return {
      success: false,
      error: 'Target account has no role assigned — cannot verify removal permission.',
    };
  }

  const allowed = REMOVAL_PERMISSIONS[caller.role];
  if (!allowed.includes(target_role)) {
    return {
      success: false,
      error: `A ${caller.role} cannot remove ${target_role} accounts.`,
    };
  }

  const { error } = await admin.auth.admin.deleteUser(target_user_id);
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
