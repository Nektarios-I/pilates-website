import { matches_client_search } from '@/features/client-booking-manager/format';
import type {
  ActiveRecurringClientOverview,
  ActiveRecurringRuleOverview,
  ActiveRecurringScheduleLineOverview,
} from '@/features/client-booking-manager/types';

export type RawActiveRecurringScheduleLine = {
  id: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  first_occurrence_date: string;
  is_active: boolean;
};

export type RawActiveRecurringRuleRow = {
  id: string;
  client_user_id: string;
  label: string | null;
  status: string;
  session_card_id: string;
  session_cards:
    | { title: string; session_type: string }
    | { title: string; session_type: string }[]
    | null;
  profiles:
    | { full_name: string | null; email?: string | null; phone?: string | null }
    | { full_name: string | null; email?: string | null; phone?: string | null }[]
    | null;
  recurring_prebook_schedule_lines: RawActiveRecurringScheduleLine[] | null;
};

function related_row<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function map_active_lines(
  lines: RawActiveRecurringScheduleLine[] | null | undefined,
): ActiveRecurringScheduleLineOverview[] {
  return (lines ?? [])
    .filter((line) => line.is_active)
    .map((line) => ({
      id: line.id,
      day_of_week: line.day_of_week,
      start_time: line.start_time,
      duration_minutes: line.duration_minutes,
      first_occurrence_date: line.first_occurrence_date,
    }))
    .sort((a, b) =>
      a.day_of_week === b.day_of_week
        ? a.start_time.localeCompare(b.start_time)
        : a.day_of_week - b.day_of_week,
    );
}

export function group_active_recurring_overview(
  rows: readonly RawActiveRecurringRuleRow[],
): ActiveRecurringClientOverview[] {
  const by_client = new Map<string, ActiveRecurringClientOverview>();

  for (const row of rows) {
    if (row.status !== 'active') continue;

    const card = related_row(row.session_cards);
    const profile = related_row(row.profiles);
    const lines = map_active_lines(row.recurring_prebook_schedule_lines);

    const rule: ActiveRecurringRuleOverview = {
      id: row.id,
      label: row.label,
      session_card_title: card?.title ?? 'Session',
      session_type: card?.session_type ?? 'reformer',
      lines,
    };

    const existing = by_client.get(row.client_user_id);
    if (existing) {
      existing.rules.push(rule);
      existing.active_rule_count += 1;
      continue;
    }

    by_client.set(row.client_user_id, {
      client_user_id: row.client_user_id,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      active_rule_count: 1,
      rules: [rule],
    });
  }

  for (const client of by_client.values()) {
    client.rules.sort((a, b) => {
      const label_a = (a.label || a.session_card_title).toLowerCase();
      const label_b = (b.label || b.session_card_title).toLowerCase();
      return label_a.localeCompare(label_b);
    });
  }

  return [...by_client.values()].sort((a, b) => {
    const name_a = (a.full_name || a.email || a.client_user_id).toLowerCase();
    const name_b = (b.full_name || b.email || b.client_user_id).toLowerCase();
    return name_a.localeCompare(name_b);
  });
}

export function filter_recurring_overview_clients(
  clients: readonly ActiveRecurringClientOverview[],
  query: string,
): ActiveRecurringClientOverview[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...clients];

  return clients.filter((client) =>
    matches_client_search(normalized, {
      full_name: client.full_name,
      email: client.email,
      phone: client.phone,
    }),
  );
}
