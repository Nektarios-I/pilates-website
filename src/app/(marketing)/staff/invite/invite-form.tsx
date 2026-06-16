'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';

// ─────────────────────────────────────────────────────────────────────────────
// Mock configuration
// TODO: Replace MOCK_CURRENT_ROLE with real session role from Supabase auth context
// TODO: Replace MOCK_SIMULATE_ERROR with real error handling
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_CURRENT_ROLE: 'user' | 'instructor' | 'owner' | 'admin' = 'admin';

// Set to true to test the server-error state during development
const MOCK_SIMULATE_ERROR = false;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Role = 'user' | 'instructor' | 'owner' | 'admin';
type InviteMethod = 'magic_link' | 'email_otp' | 'manual';

type InviteFormData = {
  full_name: string;
  email: string;
  phone: string;
  role: Role | '';
  method: InviteMethod | '';
};

type InviteFormErrors = Partial<Record<keyof InviteFormData, string>>;

// ─────────────────────────────────────────────────────────────────────────────
// Permissions and display data
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<Role, Role[]> = {
  user: [],
  instructor: ['user'],
  owner: ['user', 'instructor'],
  admin: ['user', 'instructor', 'owner', 'admin'],
};

const ROLE_LABELS: Record<Role, string> = {
  user: 'Client',
  instructor: 'Instructor',
  owner: 'Owner',
  admin: 'Admin',
};

const PERMISSION_DESCRIPTIONS: Record<Role, string> = {
  user: 'Clients do not have permission to create account invitations.',
  instructor: 'Instructors can invite clients only.',
  owner: 'Owners can invite clients and instructors.',
  admin: 'Admins can invite all account types, including other admins.',
};

const INVITE_METHODS: { value: InviteMethod; label: string; description: string }[] = [
  {
    value: 'magic_link',
    label: 'Magic link',
    description:
      'The invitee receives an email with a secure sign-in link. No password required.',
  },
  {
    value: 'email_otp',
    label: 'Email OTP',
    description: 'The invitee receives a one-time passcode by email to complete sign-in.',
  },
  {
    value: 'manual',
    label: 'Manual registration',
    description:
      'Staff creates the account record now. The invitee completes their profile setup later.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function validate_full_name(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Full name is required.';
  if (trimmed.length < 2) return 'Full name must be at least 2 characters.';
  return undefined;
}

function validate_email(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Email address is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter a valid email address.';
  return undefined;
}

function validate_phone(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Phone number is required.';
  if (!/^[+\d\s\-().]+$/.test(trimmed)) return 'Phone number contains invalid characters.';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7) return 'Please enter a valid phone number.';
  if (digits.length > 15) return 'Phone number is too long.';
  return undefined;
}

function validate_role(value: string, allowed_roles: Role[]): string | undefined {
  if (!value) return 'Please select a role.';
  if (!allowed_roles.includes(value as Role))
    return 'That role is not permitted for your account type.';
  return undefined;
}

function validate_method(value: string): string | undefined {
  if (!value) return 'Please select an invitation method.';
  return undefined;
}

function validate_single_field(
  field: keyof InviteFormData,
  value: string,
  allowed_roles: Role[],
): string | undefined {
  switch (field) {
    case 'full_name':
      return validate_full_name(value);
    case 'email':
      return validate_email(value);
    case 'phone':
      return validate_phone(value);
    case 'role':
      return validate_role(value, allowed_roles);
    case 'method':
      return validate_method(value);
  }
}

function validate_all(data: InviteFormData, allowed_roles: Role[]): InviteFormErrors {
  return {
    full_name: validate_full_name(data.full_name),
    email: validate_email(data.email),
    phone: validate_phone(data.phone),
    role: validate_role(data.role, allowed_roles),
    method: validate_method(data.method),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock submit
// TODO: Replace with Supabase admin.inviteUserByEmail or admin.createUser
// Expected data shape: { full_name, email, phone, role, method }
// ─────────────────────────────────────────────────────────────────────────────

async function mock_submit(
  // TODO: Pass data to Supabase admin.inviteUserByEmail or admin.createUser
  data: InviteFormData,
): Promise<{ success: boolean; error?: string }> {
  void data;
  const delay = 800 + Math.random() * 400;
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (MOCK_SIMULATE_ERROR) {
    return {
      success: false,
      error: 'The server could not process this invitation. Please try again.',
    };
  }

  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared style helper
// ─────────────────────────────────────────────────────────────────────────────

function input_classes(error?: string, disabled?: boolean): string {
  return [
    'block w-full rounded-md border px-4 py-3 text-base text-stone-950 placeholder-stone-400 shadow-sm transition-colors focus:outline-none focus:ring-1',
    error
      ? 'border-red-300 bg-white focus:border-red-500 focus:ring-red-500'
      : 'border-stone-300 bg-white focus:border-stone-950 focus:ring-stone-950',
    disabled ? 'cursor-not-allowed bg-stone-50 text-stone-500' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function PermissionBadge({ role }: { role: Role }) {
  const badge_styles: Record<Role, string> = {
    user: 'bg-stone-100 text-stone-600',
    instructor: 'bg-blue-50 text-blue-700 border border-blue-100',
    owner: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    admin: 'bg-amber-50 text-amber-700 border border-amber-100',
  };

  return (
    <div className="mb-6 rounded-md border border-border bg-muted p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-stone-950">Acting as</p>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge_styles[role]}`}
            >
              {ROLE_LABELS[role]}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-600">{PERMISSION_DESCRIPTIONS[role]}</p>
        </div>
      </div>
    </div>
  );
}

function AccessDeniedState() {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
        <svg
          aria-hidden="true"
          className="h-6 w-6 text-stone-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-stone-950">Access restricted</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Your account does not have permission to create invitations. Contact your studio admin if
        you need access.
      </p>
      <div className="mt-6">
        <Link
          className="text-sm font-medium text-stone-700 underline underline-offset-4 hover:text-stone-950"
          href="/account"
        >
          Return to account
        </Link>
      </div>
    </div>
  );
}

function SuccessBanner({
  data,
  on_create_another,
}: {
  data: InviteFormData;
  on_create_another: () => void;
}) {
  const method_label = INVITE_METHODS.find((m) => m.value === data.method)?.label ?? data.method;
  const role_label = data.role ? ROLE_LABELS[data.role] : '';

  return (
    <div
      aria-live="polite"
      className="rounded-md border border-emerald-200 bg-emerald-50 p-6"
      role="status"
    >
      <div className="flex items-start gap-3">
        <svg
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-800">Invitation created successfully</p>
          <p className="mt-1 text-sm text-emerald-700">
            {data.method === 'manual'
              ? 'The account record has been created. Staff can complete setup at any time.'
              : `An invitation has been queued for ${data.email.trim()}.`}
          </p>

          <div className="mt-4 rounded-md border border-emerald-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Invitation summary
            </p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-stone-700">Full name</dt>
                <dd className="mt-0.5 text-stone-950">{data.full_name.trim()}</dd>
              </div>
              <div>
                <dt className="font-medium text-stone-700">Email</dt>
                <dd className="mt-0.5 text-stone-950 break-all">{data.email.trim()}</dd>
              </div>
              <div>
                <dt className="font-medium text-stone-700">Phone</dt>
                <dd className="mt-0.5 text-stone-950">{data.phone.trim()}</dd>
              </div>
              <div>
                <dt className="font-medium text-stone-700">Role</dt>
                <dd className="mt-0.5 text-stone-950">{role_label}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium text-stone-700">Invitation method</dt>
                <dd className="mt-0.5 text-stone-950">{method_label}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-5">
            <button
              className="text-sm font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-900"
              onClick={on_create_another}
              type="button"
            >
              Create another invitation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main form component
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM: InviteFormData = {
  full_name: '',
  email: '',
  phone: '',
  role: '',
  method: '',
};

export function InviteForm() {
  const current_role = MOCK_CURRENT_ROLE;
  const allowed_roles = ROLE_PERMISSIONS[current_role];

  const [form_data, set_form_data] = useState<InviteFormData>(EMPTY_FORM);
  const [errors, set_errors] = useState<InviteFormErrors>({});
  const [touched, set_touched] = useState<Partial<Record<keyof InviteFormData, boolean>>>({});
  const [is_submitting, set_is_submitting] = useState(false);
  const [submit_error, set_submit_error] = useState<string | undefined>();
  const [success_data, set_success_data] = useState<InviteFormData | null>(null);

  function handle_change(field: keyof InviteFormData, value: string) {
    const updated = { ...form_data, [field]: value };
    set_form_data(updated);
    if (touched[field]) {
      const field_error = validate_single_field(field, value, allowed_roles);
      set_errors((prev) => ({ ...prev, [field]: field_error }));
    }
  }

  function handle_blur(field: keyof InviteFormData) {
    set_touched((prev) => ({ ...prev, [field]: true }));
    const field_error = validate_single_field(field, form_data[field], allowed_roles);
    set_errors((prev) => ({ ...prev, [field]: field_error }));
  }

  async function handle_submit(e: React.FormEvent) {
    e.preventDefault();

    const all_touched = Object.fromEntries(
      Object.keys(form_data).map((k) => [k, true]),
    ) as Record<keyof InviteFormData, boolean>;
    set_touched(all_touched);

    const all_errors = validate_all(form_data, allowed_roles);
    set_errors(all_errors);

    const has_errors = Object.values(all_errors).some(Boolean);
    if (has_errors) return;

    // Final guard: role must be allowed for current acting role
    if (!form_data.role || !allowed_roles.includes(form_data.role)) return;

    set_is_submitting(true);
    set_submit_error(undefined);

    try {
      const result = await mock_submit(form_data);
      if (result.success) {
        set_success_data(form_data);
      } else {
        set_submit_error(result.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      set_submit_error('An unexpected error occurred. Please try again.');
    } finally {
      set_is_submitting(false);
    }
  }

  function handle_create_another() {
    set_success_data(null);
    set_form_data(EMPTY_FORM);
    set_errors({});
    set_touched({});
    set_submit_error(undefined);
  }

  // ── Access denied state ──────────────────────────────────────────────────
  if (current_role === 'user') {
    return <AccessDeniedState />;
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (success_data !== null) {
    return <SuccessBanner data={success_data} on_create_another={handle_create_another} />;
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  const is_disabled = is_submitting;

  return (
    <>
      <PermissionBadge role={current_role} />

      {submit_error && (
        <div
          aria-live="polite"
          className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {submit_error}
        </div>
      )}

      <form noValidate onSubmit={handle_submit}>
        <div className="space-y-6">
          {/* Full name */}
          <FormField error={errors.full_name} id="full_name" label="Full name" required>
            <input
              aria-describedby={errors.full_name ? 'full_name-error' : undefined}
              aria-invalid={!!errors.full_name}
              autoComplete="name"
              className={input_classes(errors.full_name, is_disabled)}
              disabled={is_disabled}
              id="full_name"
              name="full_name"
              placeholder="Jane Smith"
              type="text"
              value={form_data.full_name}
              onBlur={() => handle_blur('full_name')}
              onChange={(e) => handle_change('full_name', e.target.value)}
            />
          </FormField>

          {/* Email */}
          <FormField error={errors.email} id="email" label="Email address" required>
            <input
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
              autoComplete="email"
              className={input_classes(errors.email, is_disabled)}
              disabled={is_disabled}
              id="email"
              name="email"
              placeholder="jane@example.com"
              type="email"
              value={form_data.email}
              onBlur={() => handle_blur('email')}
              onChange={(e) => handle_change('email', e.target.value)}
            />
          </FormField>

          {/* Phone */}
          <FormField
            error={errors.phone}
            hint="Include country code for international numbers, e.g. +44 7700 900000"
            id="phone"
            label="Phone number"
            required
          >
            <input
              aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
              aria-invalid={!!errors.phone}
              autoComplete="tel"
              className={input_classes(errors.phone, is_disabled)}
              disabled={is_disabled}
              id="phone"
              name="phone"
              placeholder="+1 555 000 0000"
              type="tel"
              value={form_data.phone}
              onBlur={() => handle_blur('phone')}
              onChange={(e) => handle_change('phone', e.target.value)}
            />
          </FormField>

          {/* Role */}
          <FormField error={errors.role} id="role" label="Account role" required>
            <select
              aria-describedby={errors.role ? 'role-error' : undefined}
              aria-invalid={!!errors.role}
              className={input_classes(errors.role, is_disabled)}
              disabled={is_disabled}
              id="role"
              name="role"
              value={form_data.role}
              onBlur={() => handle_blur('role')}
              onChange={(e) => handle_change('role', e.target.value)}
            >
              <option disabled value="">
                Select a role…
              </option>
              {allowed_roles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </FormField>

          {/* Invitation method */}
          <div>
            <p
              className="block text-sm font-medium text-stone-950"
              id="method-label"
            >
              Invitation method
              <span aria-hidden="true" className="ml-1 text-red-500">
                *
              </span>
            </p>
            <div
              aria-labelledby="method-label"
              className="mt-2 space-y-3"
              role="radiogroup"
            >
              {INVITE_METHODS.map((m) => {
                const is_checked = form_data.method === m.value;
                return (
                  <label
                    key={m.value}
                    className={[
                      'flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors',
                      is_checked
                        ? 'border-stone-950 bg-stone-50'
                        : 'border-stone-200 bg-white hover:border-stone-400',
                      is_disabled ? 'cursor-not-allowed opacity-60' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <input
                      checked={is_checked}
                      className="mt-0.5 h-4 w-4 cursor-pointer accent-stone-950"
                      disabled={is_disabled}
                      name="method"
                      type="radio"
                      value={m.value}
                      onBlur={() => handle_blur('method')}
                      onChange={() => handle_change('method', m.value)}
                    />
                    <div>
                      <p className="text-sm font-medium text-stone-950">{m.label}</p>
                      <p className="mt-0.5 text-sm leading-5 text-stone-500">{m.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.method && (
              <p className="mt-1.5 text-xs leading-5 text-red-600" id="method-error" role="alert">
                {errors.method}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col-reverse items-start gap-3 border-t border-stone-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="text-sm font-medium text-stone-600 underline underline-offset-4 hover:text-stone-950"
            href="/account"
          >
            Cancel
          </Link>
          <Button
            className="w-full sm:w-auto"
            disabled={is_disabled}
            size="lg"
            type="submit"
          >
            {is_submitting ? 'Creating invitation…' : 'Create invitation'}
          </Button>
        </div>
      </form>
    </>
  );
}
