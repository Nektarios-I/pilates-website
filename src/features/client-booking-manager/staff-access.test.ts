import { describe, expect, it } from 'vitest';

import { parse_manager_tab } from '@/features/client-booking-manager/format';
import { caller_has_staff_access, TEACHING_STAFF_ROLES } from '@/features/client-booking-manager/staff-access';

describe('caller_has_staff_access', () => {
  it('allows instructor, admin, and owner roles', () => {
    expect(caller_has_staff_access(['client'])).toBe(false);
    expect(caller_has_staff_access(['instructor'])).toBe(true);
    expect(caller_has_staff_access(['admin'])).toBe(true);
    expect(caller_has_staff_access(['owner'])).toBe(true);
  });

  it('exposes the teaching staff role list used by the route guard', () => {
    expect(TEACHING_STAFF_ROLES).toEqual(['instructor', 'owner', 'admin']);
  });
});

describe('parse_manager_tab', () => {
  it('defaults to overview for unknown tabs', () => {
    expect(parse_manager_tab(undefined)).toBe('overview');
    expect(parse_manager_tab('unknown')).toBe('overview');
  });

  it('accepts valid tab values', () => {
    expect(parse_manager_tab('recurring')).toBe('recurring');
    expect(parse_manager_tab('attention')).toBe('attention');
  });
});
