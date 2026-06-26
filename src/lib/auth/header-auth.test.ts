import { describe, expect, it } from 'vitest';

import { build_header_auth, merge_header_auth, unsigned_header_auth } from './header-auth';

describe('build_header_auth', () => {
  it('returns unsigned auth when user is missing', () => {
    expect(build_header_auth(null, [], null)).toEqual(unsigned_header_auth);
  });

  it('derives staff and admin flags from roles', () => {
    expect(
      build_header_auth(
        { email: 'owner@example.com' },
        [{ role: 'owner' }, { role: 'instructor' }],
        'Alex Owner',
      ),
    ).toEqual({
      is_signed_in: true,
      is_staff: true,
      is_admin_or_owner: true,
      display_name: 'Alex',
    });
  });

  it('falls back to email prefix when profile name is missing', () => {
    expect(build_header_auth({ email: 'member@example.com' }, [{ role: 'member' }], null)).toEqual({
      is_signed_in: true,
      is_staff: false,
      is_admin_or_owner: false,
      display_name: 'member',
    });
  });
});

describe('merge_header_auth', () => {
  const signed_in_server = {
    is_signed_in: true,
    is_staff: true,
    is_admin_or_owner: true,
    display_name: 'Alex',
  } satisfies import('./header-auth').HeaderAuth;

  const signed_in_client = {
    is_signed_in: true,
    is_staff: false,
    is_admin_or_owner: false,
    display_name: 'member',
  } satisfies import('./header-auth').HeaderAuth;

  it('prefers server auth once the layout has refreshed', () => {
    expect(merge_header_auth(signed_in_server, signed_in_client)).toEqual(signed_in_server);
  });

  it('uses client auth while the shared layout is still stale', () => {
    expect(merge_header_auth(unsigned_header_auth, signed_in_client)).toEqual(signed_in_client);
  });
});
