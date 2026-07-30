import { describe, expect, it } from 'vitest';

import {
  planned_slot_detail_label,
  planned_slot_needs_attention,
  planned_slot_status_label,
} from './planned-recurring-slots';

describe('planned recurring slot labels', () => {
  it('labels booked and planned calmly', () => {
    expect(planned_slot_status_label('booked', 'ok')).toBe('Booked');
    expect(planned_slot_status_label('planned', 'ok')).toBe('Planned');
    expect(planned_slot_detail_label('planned', 'ok', null)).toMatch(/two weeks/i);
  });

  it('surfaces credit and expiry problems as needs attention', () => {
    expect(planned_slot_status_label('planned', 'insufficient_tokens')).toBe('Needs attention');
    expect(planned_slot_status_label('planned', 'package_expires_before')).toBe('Needs attention');
    expect(planned_slot_status_label('failed', null)).toBe('Needs attention');
    expect(planned_slot_needs_attention('planned', 'package_expires_before')).toBe(true);
    expect(planned_slot_detail_label('planned', 'package_expires_before', null)).toMatch(
      /expires before/i,
    );
  });

  it('labels skipped occurrences', () => {
    expect(planned_slot_status_label('skipped', null)).toBe('Skipped');
    expect(planned_slot_detail_label('skipped', null, 'Cancelled by staff')).toBe(
      'Cancelled by staff',
    );
  });
});
