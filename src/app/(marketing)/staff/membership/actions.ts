'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type ManageableClient = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

export type MembershipPackage = {
  id: string;
  name: string;
  class_type: 'reformer' | 'mat';
  package_type: string;
  credits_included: number | null;
  validity_days: number | null;
  price: number;
};

export type UserMembership = {
  id: string;
  package_id: string;
  package_name: string;
  class_type: 'reformer' | 'mat';
  status: string;
  credits_remaining: number | null;
  expires_at: string | null;
  purchased_at: string;
};

export type MembershipResult = { success: true } | { success: false; error: string };
type PackageSummary = { name: string; class_type: 'reformer' | 'mat' };

const STAFF_ROLES = ['instructor', 'owner', 'admin'] as const;

async function resolve_caller_staff(): Promise<{ user_id: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const is_staff = (roles ?? []).some((row) =>
    (STAFF_ROLES as readonly string[]).includes(row.role),
  );
  if (!is_staff) return null;

  return { user_id: user.id };
}

export async function list_manageable_clients(): Promise<ManageableClient[]> {
  const caller = await resolve_caller_staff();
  if (!caller) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, user_roles(role)')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('[list_manageable_clients] query failed:', error.message);
    return [];
  }

  const clients: ManageableClient[] = [];

  for (const row of data ?? []) {
    const roles = (row.user_roles as { role: string }[] | null) ?? [];
    if (!roles.some((entry) => entry.role === 'client')) continue;

    clients.push({
      id: row.id,
      full_name: row.full_name ?? null,
      email: row.email ?? null,
      phone: row.phone ?? null,
    });
  }

  clients.sort((a, b) =>
    (a.full_name ?? a.email ?? a.phone ?? '').localeCompare(b.full_name ?? b.email ?? b.phone ?? ''),
  );

  return clients;
}

export async function list_membership_packages(): Promise<MembershipPackage[]> {
  const caller = await resolve_caller_staff();
  if (!caller) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('packages')
    .select('id, name, class_type, package_type, credits_included, validity_days, price')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[list_membership_packages] query failed:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    class_type: row.class_type,
    package_type: row.package_type,
    credits_included: row.credits_included,
    validity_days: row.validity_days,
    price: Number(row.price),
  }));
}

export async function list_user_memberships(user_id: string): Promise<UserMembership[]> {
  const caller = await resolve_caller_staff();
  if (!caller) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('user_packages')
    .select('id, package_id, status, credits_remaining, expires_at, purchased_at, packages(name, class_type)')
    .eq('user_id', user_id)
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('[list_user_memberships] query failed:', error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const package_row = row.packages as PackageSummary | PackageSummary[] | null;
    const package_name = Array.isArray(package_row)
      ? (package_row[0]?.name ?? 'Package')
      : (package_row?.name ?? 'Package');
    const class_type = Array.isArray(package_row)
      ? (package_row[0]?.class_type ?? 'reformer')
      : (package_row?.class_type ?? 'reformer');

    return {
      id: row.id,
      package_id: row.package_id,
      package_name,
      class_type,
      status: row.status,
      credits_remaining: row.credits_remaining,
      expires_at: row.expires_at,
      purchased_at: row.purchased_at,
    };
  });
}

export async function apply_membership(
  user_id: string,
  package_id: string,
): Promise<MembershipResult> {
  const caller = await resolve_caller_staff();
  if (!caller) {
    return { success: false, error: 'You must be signed in as staff to manage memberships.' };
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('id, user_roles(role)')
    .eq('id', user_id)
    .single();

  const roles = (profile?.user_roles as { role: string }[] | null) ?? [];
  if (!roles.some((entry) => entry.role === 'client')) {
    return { success: false, error: 'Memberships can only be applied to client accounts.' };
  }

  const { data: package_row, error: package_error } = await admin
    .from('packages')
    .select('id')
    .eq('id', package_id)
    .eq('is_active', true)
    .single();

  if (package_error || !package_row) {
    return { success: false, error: 'Selected package is not available.' };
  }

  const { error } = await admin.from('user_packages').insert({
    user_id,
    package_id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deactivate_membership(user_package_id: string): Promise<MembershipResult> {
  const caller = await resolve_caller_staff();
  if (!caller) {
    return { success: false, error: 'You must be signed in as staff to manage memberships.' };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('user_packages')
    .update({ status: 'cancelled' })
    .eq('id', user_package_id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function remove_membership(user_package_id: string): Promise<MembershipResult> {
  const caller = await resolve_caller_staff();
  if (!caller) {
    return { success: false, error: 'You must be signed in as staff to manage memberships.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.from('user_packages').delete().eq('id', user_package_id);

  if (error) {
    if (error.code === '23503') {
      return {
        success: false,
        error:
          'This membership is linked to existing bookings and cannot be removed. Deactivate it instead.',
      };
    }

    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function update_membership_credits(
  user_package_id: string,
  credits_remaining: number | null,
): Promise<MembershipResult> {
  const caller = await resolve_caller_staff();
  if (!caller) {
    return { success: false, error: 'You must be signed in as staff to manage memberships.' };
  }

  if (credits_remaining !== null && credits_remaining < 0) {
    return { success: false, error: 'Credits cannot be negative.' };
  }

  const admin = createAdminClient();
  const next_status =
    credits_remaining !== null && credits_remaining <= 0 ? 'used_up' : 'active';

  const { error } = await admin
    .from('user_packages')
    .update({
      credits_remaining,
      status: next_status,
    })
    .eq('id', user_package_id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
