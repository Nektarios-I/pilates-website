import { describe, expect, it } from 'vitest';

import {
  booking_state_label,
  health_status_label,
  materializable_occurrence_key,
  token_health_label,
} from '@/features/client-booking-manager/format';

describe('client booking manager format', () => {
  it('labels booking and token states for staff UI', () => {
    expect(booking_state_label('planned')).toBe('Planned');
    expect(booking_state_label('booked')).toBe('Booked');
    expect(token_health_label('insufficient_tokens')).toBe('Not enough tokens');
    expect(health_status_label('insufficient_tokens')).toBe('Not enough tokens');
    expect(materializable_occurrence_key('rule-1', '2026-07-13', '06:00')).toBe(
      'rule-1|2026-07-13|06:00:00',
    );
    expect(materializable_occurrence_key('rule-1', '2026-07-13T00:00:00.000Z', '09:00:00')).toBe(
      'rule-1|2026-07-13|09:00:00',
    );
  });
});
