'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import {
  INVITE_PERMISSION_BADGE_CLASS,
  marketingEmptyStateClass,
  marketingInputClass,
  marketingTextLinkClass,
} from '@/components/ui/marketing-field-styles';

import { create_staff_invite } from './actions';
import type { InviteMethod, InviteRole } from './actions';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Role = InviteRole;

type InviteFormData = {
  full_name: string;
  email: string;
  phone: string;
  role: Role | '';
  method: InviteMethod | '';
  password: string;
};

type InviteFormErrors = Partial<Record<keyof InviteFormData, string>>;

// ─────────────────────────────────────────────────────────────────────────────
// Display constants
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<Role, Role[]> = {
  client: [],
  instructor: ['client'],
  owner: ['client', 'instructor'],
  admin: ['client', 'instructor', 'owner', 'admin'],
};

const ROLE_LABELS: Record<Role, string> = {
  client: 'Client',
  instructor: 'Instructor',
  owner: 'Owner',
  admin: 'Admin',
};

const PERMISSION_DESCRIPTIONS: Record<Role, string> = {
  client: 'Clients do not have permission to create account invitations.',
  instructor: 'Instructors can invite clients only.',
  owner: 'Owners can invite clients and instructors.',
  admin: 'Admins can invite all account types, including other admins.',
};

const MANUAL_ACCOUNT_METHOD: InviteMethod = 'manual_account';

const MANUAL_ACCOUNT_DESCRIPTION =
  'Creates the account immediately with a temporary password. No invite email or OTP email is sent.';

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function validate_full_name(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Full name is required.';
  if (trimmed.length < 2) return 'Full name must be at least 2 characters.';
  if (!/^[A-Z]+(?: [A-Z]+)+$/.test(trimmed)) {
    return 'Use ALL CAPS in the format NAME SURNAME (e.g. MARIA PAPADOPOULOU).';
  }
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
  if (!/^[+\d\s\-(). ]+$/.test(trimmed)) return 'Phone number contains invalid characters.';
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
  if (!value || value !== MANUAL_ACCOUNT_METHOD) {
    return 'Manual account creation is required.';
  }
  return undefined;
}

function validate_password(value: string, method: string): string | undefined {
  if (method !== 'manual_account') return undefined;
  if (!value) return 'Temporary password is required for manual accounts.';
  if (value.length < 8) return 'Temporary password must be at least 8 characters.';
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
    case 'password':
      return undefined;
  }
}

function validate_all(data: InviteFormData, allowed_roles: Role[]): InviteFormErrors {
  return {
    full_name: validate_full_name(data.full_name),
    email: validate_email(data.email),
    phone: validate_phone(data.phone),
    role: validate_role(data.role, allowed_roles),
    method: validate_method(data.method),
    password: validate_password(data.password, data.method),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Style helper
// ─────────────────────────────────────────────────────────────────────────────

function input_classes(error?: string, disabled?: boolean): string {
  return [
    marketingInputClass(!!error),
    disabled ? 'cursor-not-allowed bg-muted text-foreground/60' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function PermissionBadge({ role }: { role: Role }) {
  return (
    <div className="mb-6 rounded-md border border-border bg-muted p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">Acting as</p>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${INVITE_PERMISSION_BADGE_CLASS[role]}`}
            >
              {ROLE_LABELS[role]}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground/70">{PERMISSION_DESCRIPTIONS[role]}</p>
        </div>
      </div>
    </div>
  );
}

function AccessDeniedState() {
  return (
    <div className={marketingEmptyStateClass}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <svg
          aria-hidden="true"
          className="h-6 w-6 text-foreground/60"
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
      <h2 className="text-base font-semibold text-foreground">Access restricted</h2>
      <p className="mt-2 text-sm leading-6 text-foreground/70">
        Your account does not have permission to create invitations. Contact your studio admin if
        you need access.
      </p>
      <div className="mt-6">
        <Link
          className="inline-flex min-h-11 items-center text-sm font-medium text-foreground/80 underline underline-offset-4 hover:text-foreground"
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
  method: InviteMethod;
  on_create_another: () => void;
}) {
  const role_label = data.role ? ROLE_LABELS[data.role as Role] : '';

  return (
    <div
      aria-live="polite"
      className="rounded-md border border-success-border bg-success-surface p-6"
      role="status"
    >
      <div className="flex items-start gap-3">
        <svg
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-success"
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
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-success">Account created</p>
          <p className="mt-1 text-sm text-success">
            The account for {data.email.trim()} was created immediately. Share the temporary
            password securely and ask them to change it after signing in.
          </p>

          <div className="mt-4 rounded-md border border-success-border bg-success-surface p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-success">
              Account summary
            </p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-foreground/80">Full name</dt>
                <dd className="mt-0.5 text-foreground">{data.full_name.trim()}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground/80">Email</dt>
                <dd className="mt-0.5 break-all text-foreground">{data.email.trim()}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground/80">Phone</dt>
                <dd className="mt-0.5 text-foreground">{data.phone.trim()}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground/80">Role</dt>
                <dd className="mt-0.5 text-foreground">{role_label}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium text-foreground/80">Temporary password</dt>
                <dd className="mt-0.5 text-foreground">
                  Created by staff. Share it privately with the user.
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-5">
            <button
              className={`${marketingTextLinkClass} text-success hover:text-success/80`}
              onClick={on_create_another}
              type="button"
            >
              Create another account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main form
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM: InviteFormData = {
  full_name: '',
  email: '',
  phone: '',
  role: '',
  method: MANUAL_ACCOUNT_METHOD,
  password: '',
};

type InviteFormProps = {
  currentRole: Role | null;
};

export function InviteForm({ currentRole }: InviteFormProps) {
  const current_role = currentRole;
  const allowed_roles: Role[] = current_role ? (ROLE_PERMISSIONS[current_role] ?? []) : [];

  const [form_data, set_form_data] = useState<InviteFormData>(EMPTY_FORM);
  const [errors, set_errors] = useState<InviteFormErrors>({});
  const [touched, set_touched] = useState<Partial<Record<keyof InviteFormData, boolean>>>({});
  const [is_submitting, set_is_submitting] = useState(false);
  const [submit_error, set_submit_error] = useState<string | undefined>();
  const [success_data, set_success_data] = useState<{
    data: InviteFormData;
    method: InviteMethod;
  } | null>(null);

  function handle_change(field: keyof InviteFormData, value: string) {
    const updated = { ...form_data, [field]: value };
    set_form_data(updated);
    if (touched[field]) {
      const field_error =
        field === 'password'
          ? validate_password(value, updated.method)
          : field === 'method'
            ? validate_method(value)
            : validate_single_field(field, value, allowed_roles);
      set_errors((prev) => ({
        ...prev,
        [field]: field_error,
        ...(field === 'method' ? { password: validate_password(updated.password, value) } : {}),
      }));
    }
  }

  function handle_blur(field: keyof InviteFormData) {
    set_touched((prev) => ({ ...prev, [field]: true }));
    const field_error =
      field === 'password'
        ? validate_password(form_data.password, form_data.method)
        : validate_single_field(field, form_data[field], allowed_roles);
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

    if (Object.values(all_errors).some(Boolean)) return;
    if (!form_data.role || !allowed_roles.includes(form_data.role)) return;
    if (!form_data.method) return;

    set_is_submitting(true);
    set_submit_error(undefined);

    try {
      const result = await create_staff_invite({
        full_name: form_data.full_name.trim(),
        email: form_data.email.trim(),
        phone: form_data.phone.trim(),
        role: form_data.role as Role,
        method: MANUAL_ACCOUNT_METHOD,
        password: form_data.password,
      });

      if (result.success) {
        set_success_data({ data: form_data, method: form_data.method as InviteMethod });
      } else {
        set_submit_error(result.error);
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

  if (!current_role || current_role === 'client') {
    return <AccessDeniedState />;
  }

  if (success_data !== null) {
    return (
      <SuccessBanner
        data={success_data.data}
        method={success_data.method}
        on_create_another={handle_create_another}
      />
    );
  }

  const is_disabled = is_submitting;

  return (
    <>
      <PermissionBadge role={current_role} />

      {submit_error && (
        <div
          aria-live="polite"
          className="mb-6 rounded-md border border-destructive-border bg-destructive-surface p-4 text-sm text-destructive"
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
              aria-describedby="full_name-hint"
              aria-invalid={!!errors.full_name}
              autoComplete="name"
              className={input_classes(errors.full_name, is_disabled)}
              disabled={is_disabled}
              id="full_name"
              name="full_name"
              placeholder="MARIA PAPADOPOULOU"
              type="text"
              value={form_data.full_name}
              onBlur={() => handle_blur('full_name')}
              onChange={(e) => handle_change('full_name', e.target.value.toUpperCase())}
            />
            <p className="mt-2 text-xs text-foreground/60" id="full_name-hint">
              Enter ALL CAPS as NAME SURNAME. Clients can sign in with this name or their email.
            </p>
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
            hint="Include country code, e.g. +357 97621017"
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
              placeholder="+357 99 000 000"
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

          <p className="rounded-md border border-border bg-muted px-4 py-3 text-sm leading-6 text-foreground/70">
            {MANUAL_ACCOUNT_DESCRIPTION}
          </p>

          <FormField
              error={errors.password}
              hint="Use at least 8 characters. Share this privately and ask the user to change it after first sign-in."
              id="password"
              label="Temporary password"
              required
            >
              <input
                aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                aria-invalid={!!errors.password}
                autoComplete="new-password"
                className={input_classes(errors.password, is_disabled)}
                disabled={is_disabled}
                id="password"
                name="password"
                placeholder="Temporary password"
                type="password"
                value={form_data.password}
                onBlur={() => handle_blur('password')}
                onChange={(e) => handle_change('password', e.target.value)}
            />
          </FormField>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col-reverse items-start gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex min-h-11 items-center text-sm font-medium text-foreground/70 underline underline-offset-4 hover:text-foreground"
            href="/account"
          >
            Cancel
          </Link>
          <Button className="w-full sm:w-auto" disabled={is_disabled} size="lg" type="submit">
            {is_submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </div>
      </form>
    </>
  );
}
