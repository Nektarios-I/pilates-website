import { describe, expect, it } from 'vitest';

import {
  availability_accessible_label,
  build_session_availability,
  count_occupying_bookings,
  format_availability_label,
  format_occupancy_label,
  format_remaining_spots_label,
  resolve_slot_capacity,
} from './session-availability';

describe('resolve_slot_capacity', () => {
  it('prefers materialized session capacity over the card', () => {
    expect(resolve_slot_capacity(4, 6)).toBe(4);
  });

  it('uses session-card capacity when no session exists yet', () => {
    expect(resolve_slot_capacity(null, 4)).toBe(4);
    expect(resolve_slot_capacity(undefined, 4)).toBe(4);
  });

  it('does not invent a hardcoded capacity when both are missing', () => {
    expect(resolve_slot_capacity(null, null)).toBe(0);
    expect(resolve_slot_capacity(0, 0)).toBe(0);
  });
});

describe('build_session_availability', () => {
  it('computes remaining spots for an ordinary session', () => {
    expect(build_session_availability(6, 2)).toEqual({
      capacity: 6,
      confirmed_count: 2,
      spots_left: 4,
      is_full: false,
      should_display: true,
    });
  });

  it('handles one spot remaining', () => {
    const availability = build_session_availability(6, 5);
    expect(availability.spots_left).toBe(1);
    expect(availability.is_full).toBe(false);
    expect(format_remaining_spots_label(availability)).toBe('1 spot left');
  });

  it('marks a full session', () => {
    const availability = build_session_availability(6, 6);
    expect(availability.is_full).toBe(true);
    expect(availability.spots_left).toBe(0);
    expect(format_remaining_spots_label(availability)).toBe('Full');
  });

  it('never reports negative spots when booked exceeds capacity', () => {
    const availability = build_session_availability(4, 7);
    expect(availability.spots_left).toBe(0);
    expect(availability.is_full).toBe(true);
    expect(availability.should_display).toBe(true);
  });

  it('hides availability when capacity is missing or invalid', () => {
    expect(build_session_availability(null, 2).should_display).toBe(false);
    expect(build_session_availability(0, 0).should_display).toBe(false);
    expect(format_remaining_spots_label(build_session_availability(0, 0))).toBeNull();
  });
});

describe('count_occupying_bookings', () => {
  it('counts only booked for live capacity', () => {
    expect(
      count_occupying_bookings(
        ['booked', 'booked', 'cancelled', 'finished', 'waitlisted', 'attended'],
        'live',
      ),
    ).toBe(2);
  });

  it('counts booked/finished/attended for roster occupancy', () => {
    expect(
      count_occupying_bookings(
        ['booked', 'finished', 'attended', 'cancelled', 'no_show', 'waitlisted'],
        'occupancy',
      ),
    ).toBe(3);
  });
});

describe('availability labels', () => {
  it('uses plural remaining copy', () => {
    expect(format_remaining_spots_label(build_session_availability(6, 3))).toBe('3 spots left');
  });

  it('formats staff occupancy ratios', () => {
    expect(format_occupancy_label(build_session_availability(6, 3))).toBe('3 / 6 booked');
    expect(format_availability_label(build_session_availability(6, 6), 'occupancy')).toBe('Full');
  });

  it('provides accessible labels', () => {
    expect(availability_accessible_label(build_session_availability(6, 4))).toBe(
      '2 of 6 places remaining',
    );
    expect(availability_accessible_label(build_session_availability(6, 3), 'occupancy')).toBe(
      '3 of 6 places booked',
    );
  });
});
