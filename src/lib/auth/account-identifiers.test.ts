import { describe, expect, it } from 'vitest';

import {
  build_internal_auth_email,
  display_contact_label,
  display_profile_email,
  is_internal_auth_email,
  looks_like_phone_identifier,
  matches_client_search,
  normalize_phone_digits,
  phones_match,
  profile_email_from_input,
  resolve_auth_email_for_account,
} from '@/lib/auth/account-identifiers';

describe('account-identifiers', () => {
  it('builds internal auth emails from phone or name', () => {
    expect(build_internal_auth_email({ phone: '+357 99 123 456' })).toBe(
      'phone+35799123456@accounts.corehouse.internal',
    );
    expect(build_internal_auth_email({ full_name: 'MARIA PAPADOPOULOU' })).toMatch(
      /^maria-papadopoulou\+[a-f0-9]{8}@accounts\.corehouse\.internal$/,
    );
  });

  it('detects internal auth emails', () => {
    expect(is_internal_auth_email('phone+35799123456@accounts.corehouse.internal')).toBe(true);
    expect(is_internal_auth_email('client@example.com')).toBe(false);
  });

  it('stores only real profile emails', () => {
    expect(profile_email_from_input('')).toBeNull();
    expect(profile_email_from_input(' Client@Example.com ')).toBe('client@example.com');
  });

  it('resolves auth email for account creation', () => {
    expect(
      resolve_auth_email_for_account({
        email: 'client@example.com',
        phone: '+357 99 123 456',
      }),
    ).toBe('client@example.com');

    expect(
      resolve_auth_email_for_account({
        full_name: 'MARIA PAPADOPOULOU',
        phone: '+357 99 123 456',
      }),
    ).toBe('phone+35799123456@accounts.corehouse.internal');
  });

  it('matches phone identifiers and search haystacks', () => {
    expect(looks_like_phone_identifier('+35799123456')).toBe(true);
    expect(looks_like_phone_identifier('MARIA PAPADOPOULOU')).toBe(false);
    expect(phones_match('+357 99 123 456', '99123456')).toBe(true);
    expect(
      matches_client_search('99123456', {
        full_name: 'MARIA PAPADOPOULOU',
        phone: '+357 99 123 456',
      }),
    ).toBe(true);
  });

  it('formats contact labels and hides internal auth emails', () => {
    expect(
      display_contact_label({
        full_name: 'MARIA PAPADOPOULOU',
        phone: '+357 99 123 456',
      }),
    ).toBe('MARIA PAPADOPOULOU (+357 99 123 456)');

    expect(
      display_profile_email(null, 'phone+35799123456@accounts.corehouse.internal'),
    ).toBeNull();
    expect(display_profile_email('client@example.com', 'client@example.com')).toBe(
      'client@example.com',
    );
  });

  it('normalizes phone digits', () => {
    expect(normalize_phone_digits('+357 99-123-456')).toBe('35799123456');
  });
});
