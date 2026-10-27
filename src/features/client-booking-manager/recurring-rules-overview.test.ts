import { describe, expect, it } from 'vitest';

import {
  filter_recurring_overview_clients,
  group_active_recurring_overview,
  type RawActiveRecurringRuleRow,
} from '@/features/client-booking-manager/recurring-rules-overview';

const raw_rows: RawActiveRecurringRuleRow[] = [
  {
    id: 'rule-1',
    client_user_id: 'client-b',
    label: 'Tuesday reformer',
    status: 'active',
    session_card_id: 'card-1',
    session_cards: { title: 'Morning Reformer', session_type: 'reformer' },
    profiles: { full_name: 'Sam Client', email: 'sam@example.com', phone: null },
    recurring_prebook_schedule_lines: [
      {
        id: 'line-1',
        day_of_week: 2,
        start_time: '09:00:00',
        duration_minutes: 55,
        first_occurrence_date: '2026-08-04',
        is_active: true,
      },
      {
        id: 'line-inactive',
        day_of_week: 4,
        start_time: '10:00:00',
        duration_minutes: 55,
        first_occurrence_date: '2026-08-06',
        is_active: false,
      },
    ],
  },
  {
    id: 'rule-2',
    client_user_id: 'client-a',
    label: null,
    status: 'active',
    session_card_id: 'card-2',
    session_cards: { title: 'Mat Flow', session_type: 'mat' },
    profiles: { full_name: 'Alex Client', email: 'alex@example.com', phone: '+357' },
    recurring_prebook_schedule_lines: [
      {
        id: 'line-2',
        day_of_week: 1,
        start_time: '08:00:00',
        duration_minutes: 55,
        first_occurrence_date: '2026-08-03',
        is_active: true,
      },
    ],
  },
  {
    id: 'rule-empty',
    client_user_id: 'client-c',
    label: 'Empty rule',
    status: 'active',
    session_card_id: 'card-1',
    session_cards: { title: 'Morning Reformer', session_type: 'reformer' },
    profiles: { full_name: 'No Slots', email: null, phone: null },
    recurring_prebook_schedule_lines: [],
  },
];

describe('recurring-rules-overview grouping', () => {
  it('groups by client, keeps only active lines, and sorts clients by name', () => {
    const grouped = group_active_recurring_overview(raw_rows);

    // Sorted by display name: Alex, No Slots, Sam
    expect(grouped.map((row) => row.client_user_id)).toEqual([
      'client-a',
      'client-c',
      'client-b',
    ]);
    expect(grouped[0]?.active_rule_count).toBe(1);
    expect(grouped[0]?.rules[0]?.lines).toHaveLength(1);
    expect(grouped[2]?.rules[0]?.lines).toHaveLength(1);
    expect(grouped[2]?.rules[0]?.lines[0]?.id).toBe('line-1');
    expect(grouped[1]?.rules[0]?.lines).toHaveLength(0);
  });

  it('filters overview clients by searchable name without selecting anyone', () => {
    const grouped = group_active_recurring_overview(raw_rows);
    const filtered = filter_recurring_overview_clients(grouped, 'alex');
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.client_user_id).toBe('client-a');
  });
});
