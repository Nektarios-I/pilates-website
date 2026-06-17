'use server';

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

// Which roles each acting role is allowed to create.
const ROLE_PERMISSIONS: Record<InviteRole, InviteRole[]> = {
  client: [],
  instructor: ['client'],
  owner: ['client', 'instructor'],
  admin: ['client', 'instructor', 'owner', 'admin'],
};

// The highest-privilege role wins when a user holds multiple.
const ROLE_PRIORITY: InviteRole[] = ['admin', 'owner', 'instructor', 'client'];

export async function create_staff_invite(input: InviteUserInput): Promise<InviteResult> {
  // ── 1. Verify the caller is authenticated ──────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be signed in to create invitations.' };
  }

  // ── 2. Resolve the caller's highest role ───────────────────────────────
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

  // ── 3. Verify the target role is permitted for this caller ─────────────
  const allowed = ROLE_PERMISSIONS[caller_role];
  if (!allowed.includes(input.role)) {
    return {
      success: false,
      error: `A ${caller_role} cannot create ${input.role} accounts.`,
    };
  }

  // ── 4. Create / invite the user ────────────────────────────────────────
  const admin = createAdminClient();
  const site_url = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  // /auth/invite is a client page because Supabase invite emails may redirect
  // with auth tokens in the URL fragment (#...). Server Route Handlers cannot
  // read fragments, which is why /auth/invite-callback saw "No auth params".
  const invite_redirect_to = `${site_url}/auth/invite`;
  let new_user_id: string | null = null;

  try {
    if (input.method === 'email_password') {
      // inviteUserByEmail creates the user (if they don't exist) AND sends
      // a "You've been invited" email with a link that lets them set a password.
      // For users who already exist with an UNCONFIRMED email, it resends the invite.
      const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
        data: {
          full_name: input.full_name,
          phone: input.phone,
        },
        redirectTo: invite_redirect_to,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes('already been registered') ||
          msg.includes('already exists') ||
          msg.includes('user already registered')
        ) {
          // The email is confirmed — the person clicked the invite link but was
          // sent to /account instead of /auth/reset-password (now fixed). Their
          // account exists but likely has no password. Direct staff to remove it
          // and re-invite, or use the Forgot Password flow for recovery.
          return {
            success: false,
            error:
              'An account with this email already exists and has a confirmed email address. ' +
              'If they have not yet set a password, remove their account on the Remove Accounts page and re-invite them.',
          };
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
        email: input.email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: input.full_name,
          phone: input.phone,
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes('already been registered') ||
          msg.includes('already exists') ||
          msg.includes('user already registered')
        ) {
          return {
            success: false,
            error: 'An account with this email address already exists.',
          };
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

  // ── 5. Update the auto-created profile with name, phone, status ────────
  // The on_auth_user_created trigger creates the profile row synchronously.
  // We update it here to populate the extra fields the trigger doesn't set.
  const { error: profile_error } = await admin
    .from('profiles')
    .update({
      full_name: input.full_name,
      phone: input.phone,
      status: input.method === 'manual_account' ? 'active' : 'invited',
    })
    .eq('id', new_user_id);

  if (profile_error) {
    console.error('[create_staff_invite] profile update failed:', profile_error.message);
  }

  // ── 6. Assign the role ─────────────────────────────────────────────────
  const { error: role_error } = await admin
    .from('user_roles')
    .insert({ user_id: new_user_id, role: input.role });

  if (role_error) {
    console.error('[create_staff_invite] role insert failed:', role_error.message);
  }

  return { success: true, user_id: new_user_id, method: input.method };
}
