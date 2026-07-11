import { describe, expect, it } from 'vitest';

import { map_staff_rpc_error } from '@/features/client-booking-manager/map-rpc-error';

describe('map_staff_rpc_error', () => {
  it('maps known staff booking and recurring codes', () => {
    expect(map_staff_rpc_error('P0015: session full')).toBe(
      'This session is full. Staff manual booking does not waitlist.',
    );
    expect(map_staff_rpc_error('P0019 inactive rule')).toBe(
      'That recurring rule could not be found or is inactive.',
    );
  });

  it('falls back to the raw message or a generic error', () => {
    expect(map_staff_rpc_error('Custom backend message')).toBe('Custom backend message');
    expect(map_staff_rpc_error(undefined)).toBe('Something went wrong.');
  });
});
