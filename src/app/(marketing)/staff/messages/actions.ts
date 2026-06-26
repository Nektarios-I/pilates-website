'use server';

import { createClient } from '@/lib/supabase/server';

export type ContactMessage = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  message: string;
};

export type MessageActionResult = { success: true } | { success: false; error: string };

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

export async function list_contact_messages(): Promise<ContactMessage[]> {
  if (!(await resolve_admin_or_owner())) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contact_messages')
    .select('id, created_at, name, email, phone, message')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[list_contact_messages] query failed:', error.message);
    return [];
  }

  return (data ?? []) as ContactMessage[];
}

export async function delete_contact_message(message_id: string): Promise<MessageActionResult> {
  if (!(await resolve_admin_or_owner())) {
    return { success: false, error: 'You must be signed in as admin or owner to delete messages.' };
  }

  const trimmed_id = message_id.trim();
  if (!trimmed_id) {
    return { success: false, error: 'Message id is required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('contact_messages').delete().eq('id', trimmed_id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
