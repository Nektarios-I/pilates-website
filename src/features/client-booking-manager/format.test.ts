import { describe, expect, it } from 'vitest';

import {
  booking_state_label,
  format_client_label,
  health_status_label,
  materializable_occurrence_key,
  token_health_label,
} from '@/features/client-booking-manager/format';

describe('client booking manager format', () => {
  it('labels booking and slot states for staff UI', () => {
    expect(booking_state_label('planned')).toBe('Planned');
    expect(booking_state_label('booked')).toBe('Booked');
    expect(token_health_label('insufficient_tokens')).toBe('Not enough credits');
    expect(token_health_label('package_expires_before')).toBe('Package expires before class');
    expect(token_health_label('ok')).toBe('Credits OK');
    expect(booking_state_label('failed')).toBe('Needs attention');
    expect(health_status_label('insufficient_tokens')).toBe('Not enough slots');
    expect(materializable_occurrence_key('rule-1', '2026-07-13', '06:00')).toBe(
      'rule-1|2026-07-13|06:00:00',
    );
    expect(materializable_occurrence_key('rule-1', '2026-07-13T00:00:00.000Z', '09:00:00')).toBe(
      'rule-1|2026-07-13|09:00:00',
    );
    expect(format_client_label('MARIA PAPADOPOULOU', null, '+357 99 123 456')).toBe(
      'MARIA PAPADOPOULOU (+357 99 123 456)',
    );
  });
});
