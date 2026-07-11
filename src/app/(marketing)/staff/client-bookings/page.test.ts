import { describe, expect, it } from 'vitest';

import { metadata } from '@/app/(marketing)/staff/client-bookings/page';

describe('StaffClientBookingsPage metadata', () => {
  it('exposes the client booking manager route metadata', () => {
    expect(metadata.title).toContain('Client Booking Manager');
    expect(metadata.description).toMatch(/manual bookings/i);
  });
});
