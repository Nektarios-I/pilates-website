'use server';

import { createClient } from '@/lib/supabase/server';
import {
  normalize_contact_input,
  validate_contact_input,
  type ContactFormInput,
} from '@/lib/contact/validation';

export type ContactSubmitResult =
  | { success: true }
  | { success: false; error: string };

export async function submit_contact_message(
  input: ContactFormInput,
): Promise<ContactSubmitResult> {
  const validation_error = validate_contact_input(input);
  if (validation_error) {
    return { success: false, error: validation_error };
  }

  const values = normalize_contact_input(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('contact_messages').insert({
    name: values.name,
    email: values.email,
    phone: values.phone,
    message: values.message,
    submitted_by_user_id: user?.id ?? null,
  });

  if (error) {
    console.error('[submit_contact_message] insert failed:', error.message);
    return {
      success: false,
      error: 'We could not send your message right now. Please try again in a moment.',
    };
  }

  return { success: true };
}
