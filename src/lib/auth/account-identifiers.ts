import { randomBytes } from 'node:crypto';

export const INTERNAL_AUTH_EMAIL_DOMAIN = 'accounts.corehouse.internal';

export function normalize_email(value: string): string {
  return value.trim().toLowerCase();
}

export function normalize_phone_digits(value: string): string {
  return value.replace(/\D/g, '');
}

export function is_internal_auth_email(email: string | null | undefined): boolean {
  if (!email) return false;
  return normalize_email(email).endsWith(`@${INTERNAL_AUTH_EMAIL_DOMAIN}`);
}

export function looks_like_phone_identifier(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes('@')) return false;

  const digits = normalize_phone_digits(trimmed);
  return digits.length >= 7;
}

export function phones_match(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalize_phone_digits(a ?? '');
  const right = normalize_phone_digits(b ?? '');
  if (!left || !right) return false;
  if (left === right) return true;
  return left.endsWith(right) || right.endsWith(left);
}

export function build_internal_auth_email(options: {
  phone?: string;
  full_name?: string;
}): string {
  const phone_digits = normalize_phone_digits(options.phone ?? '');
  if (phone_digits) {
    return `phone+${phone_digits}@${INTERNAL_AUTH_EMAIL_DOMAIN}`;
  }

  const slug = (options.full_name ?? 'client')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  const suffix = randomBytes(4).toString('hex');
  return `${slug || 'client'}+${suffix}@${INTERNAL_AUTH_EMAIL_DOMAIN}`;
}

export function profile_email_from_input(email: string): string | null {
  const trimmed = email.trim();
  return trimmed ? normalize_email(trimmed) : null;
}

export function resolve_auth_email_for_account(input: {
  email?: string;
  phone?: string;
  full_name?: string;
}): string {
  const profile_email = profile_email_from_input(input.email ?? '');
  if (profile_email) return profile_email;

  return build_internal_auth_email({
    phone: input.phone,
    full_name: input.full_name,
  });
}

export function display_profile_email(
  profile_email: string | null | undefined,
  auth_email: string | null | undefined,
): string | null {
  if (profile_email?.trim()) return profile_email.trim();
  if (is_internal_auth_email(auth_email)) return null;
  return auth_email?.trim() ?? null;
}

export function display_contact_label(options: {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
}): string {
  const name = options.full_name?.trim();
  const email = options.email?.trim();
  const phone = options.phone?.trim();
  const contact = email || phone;

  if (name && contact) return `${name} (${contact})`;
  if (name) return name;
  return contact ?? 'Unknown account';
}

export function matches_client_search(
  query: string,
  options: {
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
  },
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    options.full_name ?? '',
    options.email ?? '',
    options.phone ?? '',
    normalize_phone_digits(options.phone ?? ''),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalized) || haystack.includes(normalize_phone_digits(normalized));
}
