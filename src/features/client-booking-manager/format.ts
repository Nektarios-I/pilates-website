import { display_contact_label, matches_client_search } from '@/lib/auth/account-identifiers';
import type {
  RecurringBookingState,
  RecurringHealthStatus,
  RecurringTokenHealth,
} from './types';

export const ISO_WEEKDAY_OPTIONS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
] as const;

export const CLIENT_BOOKING_MANAGER_TABS = [
  'overview',
  'bookings',
  'manual',
  'recurring',
  'attention',
] as const;

export type ClientBookingManagerTab = (typeof CLIENT_BOOKING_MANAGER_TABS)[number];

export function parse_manager_tab(value: string | null | undefined): ClientBookingManagerTab {
  if (value && (CLIENT_BOOKING_MANAGER_TABS as readonly string[]).includes(value)) {
    return value as ClientBookingManagerTab;
  }
  return 'overview';
}

export function format_client_label(
  full_name: string | null,
  email: string | null,
  phone?: string | null,
): string {
  return display_contact_label({ full_name, email, phone });
}

export { matches_client_search };

export function format_session_datetime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function format_session_date(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function format_session_time(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function format_time_value(value: string): string {
  return value.slice(0, 5);
}

export function format_booking_source(source: string): string {
  if (source === 'staff_manual') return 'Staff manual';
  if (source === 'recurring') return 'Recurring';
  return 'Client';
}

export function normalize_occurrence_date(value: string): string {
  return value.slice(0, 10);
}

export function normalize_occurrence_time(value: string): string {
  const match = value.match(/(\d{2}:\d{2})(?::(\d{2}))?/);
  if (!match) return value;
  const [, hours_minutes, seconds = '00'] = match;
  return `${hours_minutes}:${seconds}`;
}

export function materializable_occurrence_key(
  rule_id: string,
  occurrence_date: string,
  start_time: string,
): string {
  return `${rule_id}|${normalize_occurrence_date(occurrence_date)}|${normalize_occurrence_time(start_time)}`;
}

export function health_status_label(status: RecurringHealthStatus | null | undefined): string {
  if (status === 'ready') return 'Ready';
  if (status === 'insufficient_tokens') return 'Not enough slots';
  if (status === 'failed') return 'Failed';
  return 'Unknown';
}

export function booking_state_label(state: RecurringBookingState | null | undefined): string {
  if (state === 'booked') return 'Booked';
  if (state === 'planned') return 'Planned';
  if (state === 'failed') return 'Needs attention';
  if (state === 'skipped') return 'Skipped';
  return 'Unknown';
}

export function booking_state_badge_class(state: RecurringBookingState | null | undefined): string {
  if (state === 'booked') {
    return 'rounded-full bg-success-surface px-2.5 py-0.5 text-xs font-medium text-success ring-1 ring-success-border';
  }
  if (state === 'planned') {
    return 'rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground/80 ring-1 ring-border';
  }
  if (state === 'failed') {
    return 'rounded-full bg-danger-surface px-2.5 py-0.5 text-xs font-medium text-danger-foreground ring-1 ring-danger-border';
  }
  if (state === 'skipped') {
    return 'rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground/70 ring-1 ring-border';
  }
  return 'rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground/70';
}

export function token_health_label(health: RecurringTokenHealth | null | undefined): string {
  if (health === 'ok') return 'Credits OK';
  if (health === 'insufficient_tokens') return 'Not enough credits';
  if (health === 'package_expires_before') return 'Package expires before class';
  return '';
}

export function token_health_badge_class(health: RecurringTokenHealth | null | undefined): string {
  if (health === 'ok') {
    return 'rounded-full bg-success-surface/60 px-2.5 py-0.5 text-xs font-medium text-success ring-1 ring-success-border';
  }
  if (health === 'insufficient_tokens' || health === 'package_expires_before') {
    return 'rounded-full bg-warning-surface px-2.5 py-0.5 text-xs font-medium text-warning-foreground ring-1 ring-warning-border';
  }
  return '';
}

export function health_status_badge_class(status: RecurringHealthStatus | null | undefined): string {
  if (status === 'ready') {
    return 'rounded-full bg-success-surface px-2.5 py-0.5 text-xs font-medium text-success ring-1 ring-success-border';
  }
  if (status === 'insufficient_tokens') {
    return 'rounded-full bg-warning-surface px-2.5 py-0.5 text-xs font-medium text-warning-foreground ring-1 ring-warning-border';
  }
  if (status === 'failed') {
    return 'rounded-full bg-danger-surface px-2.5 py-0.5 text-xs font-medium text-danger-foreground ring-1 ring-danger-border';
  }
  return 'rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground/70';
}

export function failure_code_label(code: string | null | undefined): string {
  if (!code) return 'Unknown';
  return code.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
