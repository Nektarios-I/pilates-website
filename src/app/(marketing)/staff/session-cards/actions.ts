'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type EditableSessionCard = {
  id: string;
  title: string;
  description: string;
  session_type: 'reformer' | 'mat' | 'private' | 'intro';
  duration_minutes: number;
  instructor_name: string | null;
  image_src: string | null;
  capacity: number;
  credits_required: number;
  reformer_credits_required: number;
  mat_credits_required: number;
  sort_order: number;
  is_active: boolean;
};

export type SessionCardInput = Omit<EditableSessionCard, 'id'>;
export type SessionCardResult = { success: true } | { success: false; error: string };

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

export async function list_session_cards_for_staff(): Promise<EditableSessionCard[]> {
  if (!(await resolve_admin_or_owner())) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('session_cards')
    .select(
      'id, title, description, session_type, duration_minutes, instructor_name, image_src, capacity, credits_required, reformer_credits_required, mat_credits_required, sort_order, is_active',
    )
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[list_session_cards_for_staff] query failed:', error.message);
    return [];
  }

  return (data ?? []) as EditableSessionCard[];
}

function validate_card(input: SessionCardInput): string | null {
  if (!input.title.trim()) return 'Title is required.';
  if (!input.description.trim()) return 'Description is required.';
  if (!['reformer', 'mat', 'private', 'intro'].includes(input.session_type)) {
    return 'Choose a valid class type.';
  }
  if (input.duration_minutes < 15 || input.duration_minutes > 180) {
    return 'Duration must be between 15 and 180 minutes.';
  }
  if (input.capacity <= 0) return 'Capacity must be positive.';
  if (input.reformer_credits_required < 0 || input.mat_credits_required < 0) {
    return 'Credit requirements cannot be negative.';
  }
  if (input.reformer_credits_required === 0 && input.mat_credits_required === 0) {
    return 'At least one reformer or mat credit is required.';
  }
  return null;
}

export async function create_session_card(input: SessionCardInput): Promise<SessionCardResult> {
  if (!(await resolve_admin_or_owner())) {
    return { success: false, error: 'Only owners and admins can manage session cards.' };
  }

  const validation_error = validate_card(input);
  if (validation_error) return { success: false, error: validation_error };

  const admin = createAdminClient();
  const { error } = await admin.from('session_cards').insert({
    ...input,
    credits_required: input.reformer_credits_required + input.mat_credits_required,
    title: input.title.trim(),
    description: input.description.trim(),
    instructor_name: input.instructor_name?.trim() || null,
    image_src: input.image_src?.trim() || null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function update_session_card(
  id: string,
  input: SessionCardInput,
): Promise<SessionCardResult> {
  if (!(await resolve_admin_or_owner())) {
    return { success: false, error: 'Only owners and admins can manage session cards.' };
  }

  const validation_error = validate_card(input);
  if (validation_error) return { success: false, error: validation_error };

  const admin = createAdminClient();
  const { error } = await admin
    .from('session_cards')
    .update({
      ...input,
      credits_required: input.reformer_credits_required + input.mat_credits_required,
      title: input.title.trim(),
      description: input.description.trim(),
      instructor_name: input.instructor_name?.trim() || null,
      image_src: input.image_src?.trim() || null,
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function delete_session_card(id: string): Promise<SessionCardResult> {
  if (!(await resolve_admin_or_owner())) {
    return { success: false, error: 'Only owners and admins can manage session cards.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.from('session_cards').delete().eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
