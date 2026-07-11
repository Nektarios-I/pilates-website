import { caller_has_staff_access } from '@/features/client-booking-manager/staff-access';
import { createClient } from '@/lib/supabase/server';

/** True when the current session belongs to instructor, owner, or admin. */
export async function resolve_caller_has_staff_access(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const role_values = (roles ?? []).map((row) => row.role);
  return caller_has_staff_access(role_values);
}
