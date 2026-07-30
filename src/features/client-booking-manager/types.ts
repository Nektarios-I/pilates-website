export type RecurringHealthStatus = 'ready' | 'insufficient_tokens' | 'failed';

export type RecurringBookingState = 'planned' | 'booked' | 'failed' | 'skipped';

export type RecurringTokenHealth = 'ok' | 'insufficient_tokens' | 'package_expires_before';

export type ClientBookingRecord = {
  id: string;
  status: string;
  booked_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  credits_used: number;
  booking_source: string;
  session_id: string;
  session_title: string;
  session_starts_at: string;
  session_ends_at: string;
  session_type: string;
  credit_charges: { class_type: string; credits_used: number }[];
};

export type ClientActivePackage = {
  user_package_id: string;
  package_name: string;
  class_type: string;
  package_type: string;
  credits_remaining: number | null;
  expires_at: string | null;
};

export type BookableSessionOption = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  session_type: string;
  capacity: number;
  confirmed_count: number;
  reformer_credits_required: number;
  mat_credits_required: number;
  location: string | null;
};

export type RecurringPrebookRule = {
  id: string;
  client_user_id: string;
  session_card_id: string;
  label: string | null;
  status: string;
  created_at: string;
  session_card_title?: string;
  forecast?: RecurringForecastRow[];
};

export type RecurringScheduleLine = {
  id: string;
  rule_id: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  is_active: boolean;
  sort_order: number;
};

export type RecurringSkip = {
  id: string;
  rule_id: string;
  occurrence_date: string;
  start_time: string;
  reason: string | null;
};

export type RecurringForecastRow = {
  rule_id: string;
  schedule_line_id: string;
  occurrence_date: string;
  start_time: string;
  occurrence_starts_at: string;
  occurrence_ends_at: string;
  booking_state: RecurringBookingState | null;
  token_health: RecurringTokenHealth | null;
  health_status: RecurringHealthStatus | null;
  log_status: string | null;
  failure_code: string | null;
  failure_message: string | null;
};

export type MaterializationAttentionRow = {
  id: string;
  rule_id: string;
  occurrence_date: string;
  occurrence_starts_at: string;
  occurrence_ends_at: string;
  status: string;
  failure_code: string | null;
  failure_message: string | null;
  attempt_count: number;
  last_attempted_at: string | null;
};

export type ClientDashboardData = {
  packages: ClientActivePackage[];
  bookings: ClientBookingRecord[];
  recurring_rules: RecurringPrebookRule[];
  attention: MaterializationAttentionRow[];
};

export type MaterializableOccurrence = {
  rule_id: string;
  rule_label: string;
  session_card_title: string;
  schedule_line_id: string;
  occurrence_date: string;
  start_time: string;
  occurrence_starts_at: string;
  booking_state: string;
  token_health: RecurringTokenHealth | null;
  failure_message: string | null;
};

export type MaterializeClientFailure = {
  rule_id: string;
  occurrence_date: string;
  start_time: string;
  occurrence_starts_at: string;
  failure_message: string | null;
};

export type MaterializeSelectionPayload = {
  rule_id: string;
  schedule_line_id: string;
  occurrence_date: string;
  start_time: string;
};

export type MaterializeClientResult = {
  booking_ids: string[];
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  excluded: number;
  window_start: string;
  window_end: string;
  failures: MaterializeClientFailure[];
};

export type ActionResult = { success: true } | { success: false; error: string };
