'use server';

import { dedupe_packages_by_id } from '@/app/(marketing)/staff/pricing/pricing-panel-state';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type EditablePackage = {
  id: string;
  name: string;
  description: string | null;
  class_type: 'reformer' | 'mat';
  package_type: 'credit_pack' | 'monthly' | 'unlimited' | 'intro_offer' | 'drop_in';
  credits_included: number | null;
  validity_days: number | null;
  price: number;
  sort_order: number;
  is_active: boolean;
};

export type PackageInput = Omit<EditablePackage, 'id'>;

export type PackageResult = { success: true } | { success: false; error: string };

async function resolve_admin_or_owner(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  return (roles ?? []).some((row) => row.role === 'owner' || row.role === 'admin');
}

export async function list_packages_for_staff(): Promise<EditablePackage[]> {
  if (!(await resolve_admin_or_owner())) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('packages')
    .select(
      'id, name, description, class_type, package_type, credits_included, validity_days, price, sort_order, is_active',
    )
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[list_packages_for_staff] query failed:', error.message);
    return [];
  }

  return dedupe_packages_by_id(
    (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      class_type: row.class_type as 'reformer' | 'mat',
      package_type: row.package_type as EditablePackage['package_type'],
      credits_included: row.credits_included,
      validity_days: row.validity_days,
      price: Number(row.price),
      sort_order: row.sort_order,
      is_active: row.is_active,
    })),
  );
}

function validate_package(input: PackageInput): string | null {
  if (!input.name.trim()) return 'Name is required.';
  if (!['reformer', 'mat'].includes(input.class_type)) return 'Choose reformer or mat.';
  if (
    !['credit_pack', 'monthly', 'unlimited', 'intro_offer', 'drop_in'].includes(input.package_type)
  ) {
    return 'Choose a valid package type.';
  }
  if (input.price < 0) return 'Price cannot be negative.';
  if (input.sort_order < 0) return 'Sort order cannot be negative.';
  if (input.credits_included != null && input.credits_included < 0) {
    return 'Credits cannot be negative.';
  }
  if (input.validity_days != null && input.validity_days < 1) {
    return 'Validity must be at least 1 day.';
  }
  return null;
}

export async function create_package(input: PackageInput): Promise<PackageResult> {
  if (!(await resolve_admin_or_owner())) {
    return { success: false, error: 'Only owners and admins can manage package prices.' };
  }

  const validation_error = validate_package(input);
  if (validation_error) return { success: false, error: validation_error };

  const admin = createAdminClient();
  const { error } = await admin.from('packages').insert({
    name: input.name.trim(),
    description: input.description?.trim() || null,
    class_type: input.class_type,
    package_type: input.package_type,
    credits_included: input.credits_included,
    validity_days: input.validity_days,
    price: input.price,
    sort_order: input.sort_order,
    is_active: input.is_active,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function update_package(
  id: string,
  input: PackageInput,
): Promise<PackageResult> {
  if (!(await resolve_admin_or_owner())) {
    return { success: false, error: 'Only owners and admins can manage package prices.' };
  }

  const validation_error = validate_package(input);
  if (validation_error) return { success: false, error: validation_error };

  const admin = createAdminClient();
  const { error } = await admin
    .from('packages')
    .update({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      class_type: input.class_type,
      package_type: input.package_type,
      credits_included: input.credits_included,
      validity_days: input.validity_days,
      price: input.price,
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deactivate_package(id: string): Promise<PackageResult> {
  if (!(await resolve_admin_or_owner())) {
    return { success: false, error: 'Only owners and admins can manage package prices.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.from('packages').update({ is_active: false }).eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function delete_package(id: string): Promise<PackageResult> {
  if (!(await resolve_admin_or_owner())) {
    return { success: false, error: 'Only owners and admins can manage package prices.' };
  }

  const admin = createAdminClient();
  const { count, error: count_error } = await admin
    .from('user_packages')
    .select('*', { count: 'exact', head: true })
    .eq('package_id', id);

  if (count_error) return { success: false, error: count_error.message };
  if (count && count > 0) {
    return {
      success: false,
      error:
        'This package is assigned to clients and cannot be removed. Deactivate it instead to hide it from the website.',
    };
  }

  const { error } = await admin.from('packages').delete().eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
