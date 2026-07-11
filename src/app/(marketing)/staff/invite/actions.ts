'use server';

import {
  is_internal_auth_email,
  normalize_email,
  normalize_phone_digits,
  phones_match,
  profile_email_from_input,
  resolve_auth_email_for_account,
} from '@/lib/auth/account-identifiers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type InviteRole = 'client' | 'instructor' | 'owner' | 'admin';

// email_password — uses Supabase's admin invite flow. Supabase creates the auth
//                   user immediately, sends the email, and the invitee sets a password.
// manual_account — creates a confirmed auth user immediately with the staff-entered
//                   temporary password. No invite or OTP email is sent.
export type InviteMethod = 'email_password' | 'manual_account';

export type InviteUserInput = {
  full_name: string;
  email: string;
  phone: string;
  role: InviteRole;
  method: InviteMethod;
  password?: string;
};

export type InviteResult =
  | { success: true; method: InviteMethod; user_id: string }
  | { success: false; error: string };

type AdminClient = ReturnType<typeof createAdminClient>;

const ROLE_PERMISSIONS: Record<InviteRole, InviteRole[]> = {
  client: [],
  instructor: ['client'],
  owner: ['client', 'instructor'],
  admin: ['client', 'instructor', 'owner', 'admin'],
};

const ROLE_PRIORITY: InviteRole[] = ['admin', 'owner', 'instructor', 'client'];

function is_email_taken_error(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes('already been registered') ||
    msg.includes('already exists') ||
    msg.includes('user already registered')
  );
}

async function find_auth_user_by_email(
  admin: AdminClient,
  email: string,
): Promise<{ id: string; email_confirmed_at?: string | null } | null> {
  const normalized = normalize_email(email);
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      console.error('[find_auth_user_by_email] listUsers failed:', error.message);
      return null;
    }

    const users = data?.users ?? [];
    const match = users.find((user) => user.email?.toLowerCase() === normalized);
    if (match) {
      return { id: match.id, email_confirmed_at: match.email_confirmed_at };
    }

    if (users.length < 200) break;
    page += 1;
  }

  return null;
}

async function find_profile_by_email(
  admin: AdminClient,
  email: string,
): Promise<{ id: string } | null> {
  const { data, error } = await admin
    .from('profiles')
    .select('id')
    .ilike('email', normalize_email(email))
    .maybeSingle();

  if (error) {
    console.error('[find_profile_by_email] query failed:', error.message);
    return null;
  }

  return data;
}

async function find_profile_by_phone(
  admin: AdminClient,
  phone: string,
): Promise<{ id: string; phone: string | null } | null> {
  const target_digits = normalize_phone_digits(phone);
  if (!target_digits) return null;

  const { data, error } = await admin.from('profiles').select('id, phone').not('phone', 'is', null);

  if (error) {
    console.error('[find_profile_by_phone] query failed:', error.message);
    return null;
  }

  return (
    (data ?? []).find((row) => phones_match(row.phone, phone)) ?? null
  );
}

async function ensure_profile_and_role(
  admin: AdminClient,
  user_id: string,
  input: InviteUserInput,
): Promise<void> {
  const profile_email = profile_email_from_input(input.email);
  const phone = input.phone.trim() || null;
  const status = input.method === 'manual_account' ? 'active' : 'invited';

  const { data: existing_profile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', user_id)
    .maybeSingle();

  if (!existing_profile) {
    const { error: insert_error } = await admin.from('profiles').insert({
      id: user_id,
      email: profile_email,
      full_name: input.full_name,
      phone,
      status,
    });

    if (insert_error) {
      console.error('[ensure_profile_and_role] profile insert failed:', insert_error.message);
    }
  } else {
    const { error: update_error } = await admin
      .from('profiles')
      .update({
        email: profile_email,
        full_name: input.full_name,
        phone,
        status,
      })
      .eq('id', user_id);

    if (update_error) {
      console.error('[ensure_profile_and_role] profile update failed:', update_error.message);
    }
  }

  const { data: existing_roles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user_id);

  const has_target_role = (existing_roles ?? []).some((row) => row.role === input.role);
  if (!has_target_role) {
    const { error: role_error } = await admin
      .from('user_roles')
      .insert({ user_id, role: input.role });

    if (role_error) {
      console.error('[ensure_profile_and_role] role insert failed:', role_error.message);
    }
  }
}

async function repair_orphan_auth_user(
  admin: AdminClient,
  auth_user_id: string,
  input: InviteUserInput,
  auth_email: string,
  invite_redirect_to: string,
  auth_user_confirmed: boolean,
): Promise<InviteResult> {
  if (input.method === 'manual_account') {
    const password = input.password ?? '';
    if (password.length < 8) {
      return {
        success: false,
        error: 'Manual account creation requires a temporary password of at least 8 characters.',
      };
    }

    const { error: update_error } = await admin.auth.admin.updateUserById(auth_user_id, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: input.full_name,
        phone: input.phone.trim() || null,
      },
    });

    if (update_error) {
      return { success: false, error: update_error.message };
    }
  } else if (!auth_user_confirmed) {
    const { error: invite_error } = await admin.auth.admin.inviteUserByEmail(auth_email, {
      data: {
        full_name: input.full_name,
        phone: input.phone.trim() || null,
      },
      redirectTo: invite_redirect_to,
    });

    if (invite_error && !is_email_taken_error(invite_error.message)) {
      return { success: false, error: invite_error.message };
    }
  }

  await ensure_profile_and_role(admin, auth_user_id, input);

  return { success: true, user_id: auth_user_id, method: input.method };
}

export async function create_staff_invite(input: InviteUserInput): Promise<InviteResult> {
  const profile_email = profile_email_from_input(input.email);
  const phone = input.phone.trim();
  const auth_email = resolve_auth_email_for_account(input);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be signed in to create invitations.' };
  }

  const { data: caller_roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const role_values = (caller_roles ?? []).map((r) => r.role as InviteRole);
  const caller_role = ROLE_PRIORITY.find((r) => role_values.includes(r)) ?? null;

  if (!caller_role || caller_role === 'client') {
    return {
      success: false,
      error: 'Your account does not have permission to create invitations.',
    };
  }

  const allowed = ROLE_PERMISSIONS[caller_role];
  if (!allowed.includes(input.role)) {
    return {
      success: false,
      error: `A ${caller_role} cannot create ${input.role} accounts.`,
    };
  }

  if (input.method === 'email_password' && !profile_email) {
    return {
      success: false,
      error: 'Email is required when using the email invite method.',
    };
  }

  const admin = createAdminClient();
  const site_url = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const invite_redirect_to = `${site_url}/auth/invite`;

  if (profile_email) {
    const existing_profile = await find_profile_by_email(admin, profile_email);
    if (existing_profile) {
      return {
        success: false,
        error: 'An account with this email address already exists.',
      };
    }
  }

  if (phone) {
    const existing_phone_profile = await find_profile_by_phone(admin, phone);
    if (existing_phone_profile) {
      return {
        success: false,
        error: 'An account with this phone number already exists.',
      };
    }
  }

  const existing_auth = await find_auth_user_by_email(admin, auth_email);
  if (existing_auth) {
    if (profile_email || is_internal_auth_email(auth_email)) {
      return repair_orphan_auth_user(
        admin,
        existing_auth.id,
        input,
        auth_email,
        invite_redirect_to,
        Boolean(existing_auth.email_confirmed_at),
      );
    }
  }

  let new_user_id: string | null = null;

  try {
    if (input.method === 'email_password') {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(auth_email, {
        data: {
          full_name: input.full_name,
          phone: phone || null,
        },
        redirectTo: invite_redirect_to,
      });

      if (error) {
        if (is_email_taken_error(error.message)) {
          const auth_user = await find_auth_user_by_email(admin, auth_email);
          if (auth_user) {
            return repair_orphan_auth_user(
              admin,
              auth_user.id,
              input,
              auth_email,
              invite_redirect_to,
              Boolean(auth_user.email_confirmed_at),
            );
          }
        }

        return { success: false, error: error.message };
      }

      new_user_id = data.user.id;
    } else {
      const password = input.password ?? '';
      if (password.length < 8) {
        return {
          success: false,
          error: 'Manual account creation requires a temporary password of at least 8 characters.',
        };
      }

      const { data, error } = await admin.auth.admin.createUser({
        email: auth_email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: input.full_name,
          phone: phone || null,
        },
      });

      if (error) {
        if (is_email_taken_error(error.message)) {
          const auth_user = await find_auth_user_by_email(admin, auth_email);
          if (auth_user) {
            return repair_orphan_auth_user(
              admin,
              auth_user.id,
              input,
              auth_email,
              invite_redirect_to,
              Boolean(auth_user.email_confirmed_at),
            );
          }
        }

        return { success: false, error: error.message };
      }

      new_user_id = data.user.id;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create user account.';
    return { success: false, error: message };
  }

  if (!new_user_id) {
    return { success: false, error: 'The invited account was not created.' };
  }

  await ensure_profile_and_role(admin, new_user_id, input);

  return { success: true, user_id: new_user_id, method: input.method };
}
