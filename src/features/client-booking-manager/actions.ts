'use server';

import { revalidatePath } from 'next/cache';

import { map_staff_rpc_error } from '@/features/client-booking-manager/map-rpc-error';
import {
  normalize_occurrence_date,
  normalize_occurrence_time,
} from '@/features/client-booking-manager/format';
import { TEACHING_STAFF_ROLES } from '@/features/client-booking-manager/staff-access';
import type {
  ActionResult,
  BookableSessionOption,
  ClientActivePackage,
  ClientBookingRecord,
  ClientDashboardData,
  MaterializationAttentionRow,
  MaterializableOccurrence,
  MaterializeClientResult,
  MaterializeSelectionPayload,
  RecurringForecastRow,
  RecurringPrebookRule,
  RecurringScheduleLine,
  RecurringSkip,
} from '@/features/client-booking-manager/types';
import { get_session_cards, type SessionCard } from '@/app/(marketing)/book/schedule-actions';
import {
  build_recurring_weekly_slot_options,
  is_valid_recurring_weekly_slot,
} from '@/features/bookings/recurring-weekly-slot-options';
import {
  iso_weekday_from_date_key,
  validate_first_occurrence_date,
} from '@/features/bookings/first-occurrence';
import {
  summarize_cancel_batch,
  type CancelOccurrenceResult,
  type CancelRecurringOccurrenceItem,
} from '@/features/bookings/recurring-occurrence-cancellation';
import { is_within_staff_manual_booking_window } from '@/features/bookings/staff-manual-booking-window';
import type { WeeklySlotPattern } from '@/features/bookings/weekly-slot-patterns';
import { studio_date_key } from '@/lib/schedule/studio-hours';
import {
  list_manageable_clients,
  type ManageableClient,
} from '@/app/(marketing)/staff/membership/actions';
import { createClient } from '@/lib/supabase/server';

const MANAGER_PATH = '/staff/client-bookings';

export type { WeeklySlotPattern } from '@/features/bookings/weekly-slot-patterns';

async function resolve_caller_staff(): Promise<{ user_id: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const is_staff = (roles ?? []).some((row) =>
    (TEACHING_STAFF_ROLES as readonly string[]).includes(row.role),
  );
  if (!is_staff) return null;

  return { user_id: user.id };
}

function related_row<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function map_client_booking(row: {
  id: string;
  status: string;
  booked_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  credits_used: number;
  booking_source: string;
  sessions: {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    session_type: string;
  } | {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    session_type: string;
  }[] | null;
  booking_credit_charges: { class_type: string; credits_used: number }[] | null;
}): ClientBookingRecord | null {
  const session = related_row(row.sessions);
  if (!session) return null;

  return {
    id: row.id,
    status: row.status,
    booked_at: row.booked_at,
    cancelled_at: row.cancelled_at,
    cancellation_reason: row.cancellation_reason,
    credits_used: row.credits_used,
    booking_source: row.booking_source,
    session_id: session.id,
    session_title: session.title,
    session_starts_at: session.starts_at,
    session_ends_at: session.ends_at,
    session_type: session.session_type,
    credit_charges: row.booking_credit_charges ?? [],
  };
}

export async function load_manager_clients(): Promise<ManageableClient[]> {
  return list_manageable_clients();
}

export async function load_manager_session_cards(): Promise<SessionCard[]> {
  const caller = await resolve_caller_staff();
  if (!caller) return [];
  return get_session_cards();
}

export async function load_client_dashboard(client_user_id: string): Promise<ClientDashboardData> {
  const empty: ClientDashboardData = {
    packages: [],
    bookings: [],
    recurring_rules: [],
    attention: [],
  };

  const caller = await resolve_caller_staff();
  if (!caller || !client_user_id) return empty;

  const supabase = await createClient();

  const [packages_result, bookings_result, rules_result, attention_result] = await Promise.all([
    supabase.rpc('get_active_packages', { p_user_id: client_user_id }),
    supabase
      .from('bookings')
      .select(
        `
        id,
        status,
        booked_at,
        cancelled_at,
        cancellation_reason,
        credits_used,
        booking_source,
        sessions!inner (
          id,
          title,
          starts_at,
          ends_at,
          session_type
        ),
        booking_credit_charges (
          class_type,
          credits_used
        )
      `,
      )
      .eq('user_id', client_user_id)
      .order('booked_at', { ascending: false })
      .limit(120),
    supabase.rpc('list_recurring_prebook_rules', { p_client_user_id: client_user_id }),
    supabase.rpc('list_recurring_prebook_attention', { p_client_user_id: client_user_id }),
  ]);

  const packages = ((packages_result.data ?? []) as ClientActivePackage[]).map((row) => ({
    user_package_id: row.user_package_id,
    package_name: row.package_name,
    class_type: row.class_type,
    package_type: row.package_type,
    credits_remaining: row.credits_remaining,
    expires_at: row.expires_at,
  }));

  const bookings = (bookings_result.data ?? [])
    .map((row) => map_client_booking(row))
    .filter((row): row is ClientBookingRecord => row !== null)
    .sort(
      (a, b) =>
        new Date(a.session_starts_at).getTime() - new Date(b.session_starts_at).getTime(),
    );

  const recurring_rules = await enrich_recurring_rules(
    (rules_result.data ?? []) as RecurringPrebookRule[],
  );

  const rules_with_forecast = await Promise.all(
    recurring_rules.map(async (rule) => {
      if (rule.status !== 'active') return rule;
      const forecast = await load_recurring_forecast(rule.id);
      return { ...rule, forecast };
    }),
  );

  const attention = ((attention_result.data ?? []) as MaterializationAttentionRow[]).map((row) => ({
    id: row.id,
    rule_id: row.rule_id,
    occurrence_date: row.occurrence_date,
    occurrence_starts_at: row.occurrence_starts_at,
    occurrence_ends_at: row.occurrence_ends_at,
    status: row.status,
    failure_code: row.failure_code,
    failure_message: row.failure_message,
    attempt_count: row.attempt_count,
    last_attempted_at: row.last_attempted_at,
  }));

  return { packages, bookings, recurring_rules: rules_with_forecast, attention };
}

async function enrich_recurring_rules(
  rules: RecurringPrebookRule[],
): Promise<RecurringPrebookRule[]> {
  if (rules.length === 0) return [];

  const supabase = await createClient();
  const card_ids = [...new Set(rules.map((rule) => rule.session_card_id))];
  const { data: cards } = await supabase
    .from('session_cards')
    .select('id, title')
    .in('id', card_ids);

  const title_map = Object.fromEntries((cards ?? []).map((card) => [card.id, card.title]));

  return rules.map((rule) => ({
    ...rule,
    session_card_title: title_map[rule.session_card_id] ?? 'Session card',
  }));
}

export async function list_bookable_sessions_for_staff(): Promise<BookableSessionOption[]> {
  const caller = await resolve_caller_staff();
  if (!caller) return [];

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: raw_sessions } = await supabase
    .from('sessions')
    .select(
      'id, title, starts_at, ends_at, session_type, capacity, location, reformer_credits_required, mat_credits_required',
    )
    .eq('status', 'scheduled')
    .gt('starts_at', now)
    .order('starts_at', { ascending: true })
    .limit(80);

  const session_ids = (raw_sessions ?? []).map((session) => session.id);
  const count_map: Record<string, number> = {};

  if (session_ids.length > 0) {
    const { data: booking_counts } = await supabase
      .from('bookings')
      .select('session_id')
      .in('session_id', session_ids)
      .eq('status', 'booked');

    (booking_counts ?? []).forEach((booking) => {
      count_map[booking.session_id] = (count_map[booking.session_id] ?? 0) + 1;
    });
  }

  return (raw_sessions ?? []).map((session) => ({
    id: session.id,
    title: session.title,
    starts_at: session.starts_at,
    ends_at: session.ends_at,
    session_type: session.session_type,
    capacity: session.capacity,
    confirmed_count: count_map[session.id] ?? 0,
    reformer_credits_required: session.reformer_credits_required ?? 0,
    mat_credits_required: session.mat_credits_required ?? 0,
    location: session.location ?? null,
  }));
}

/** Weekly slot patterns from default studio hours (Mon–Sun), not a specific calendar week. */
export async function list_weekly_slot_patterns_for_card(
  session_card_id: string,
): Promise<WeeklySlotPattern[]> {
  const caller = await resolve_caller_staff();
  if (!caller) return [];

  const supabase = await createClient();
  const { data: card, error } = await supabase
    .from('session_cards')
    .select('id, duration_minutes, is_active')
    .eq('id', session_card_id)
    .eq('is_active', true)
    .single();

  if (error || !card) return [];

  const day_options = build_recurring_weekly_slot_options(card.duration_minutes);
  const patterns: WeeklySlotPattern[] = [];

  for (const day of day_options) {
    for (const slot of day.slots) {
      patterns.push({
        day_of_week: day.day_of_week,
        weekday_label: day.weekday_label,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duration_minutes: card.duration_minutes,
        pattern_key: `${day.day_of_week}-${slot.start_time}`,
        label: `${day.weekday_label} ${slot.label}`,
      });
    }
  }

  return patterns;
}

export async function staff_manual_book_slot(
  client_user_id: string,
  date_key: string,
  slot_start: string,
  slot_end: string,
  session_card_id: string,
  reformer_package_id: string | null,
  mat_package_id?: string | null,
): Promise<ActionResult> {
  const caller = await resolve_caller_staff();
  if (!caller) return { success: false, error: 'You must be signed in as staff.' };

  if (!is_within_staff_manual_booking_window(date_key)) {
    return { success: false, error: 'Staff cannot manually book sessions in the past.' };
  }

  const supabase = await createClient();
  const { data: session_card, error: card_error } = await supabase
    .from('session_cards')
    .select(
      'id, title, session_type, capacity, credits_required, reformer_credits_required, mat_credits_required, is_active',
    )
    .eq('id', session_card_id)
    .eq('is_active', true)
    .single();

  if (card_error || !session_card) {
    return { success: false, error: 'Selected class is no longer available.' };
  }

  const { data: session_id, error: ensure_error } = await supabase.rpc('ensure_session_slot_at', {
    p_schedule_date: date_key,
    p_start_time: slot_start,
    p_end_time: slot_end,
    p_session_type: session_card.session_type,
    p_capacity: session_card.capacity,
    p_credits_required: session_card.credits_required,
    p_reformer_credits_required: session_card.reformer_credits_required,
    p_mat_credits_required: session_card.mat_credits_required,
  });

  if (ensure_error || !session_id) {
    return {
      success: false,
      error: ensure_error?.message ?? 'Could not reserve this time slot.',
    };
  }

  return staff_manual_book_session(
    client_user_id,
    session_id as string,
    reformer_package_id,
    mat_package_id,
  );
}

export async function staff_cancel_client_booking(booking_id: string): Promise<ActionResult> {
  const caller = await resolve_caller_staff();
  if (!caller) return { success: false, error: 'You must be signed in as staff.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('cancel_booking', {
    p_booking_id: booking_id,
    p_reason: 'Cancelled by staff',
  });

  if (error) {
    return { success: false, error: map_staff_rpc_error(error.message) };
  }

  revalidatePath(MANAGER_PATH);
  return { success: true };
}

export async function staff_manual_book_session(
  client_user_id: string,
  session_id: string,
  reformer_package_id: string | null,
  mat_package_id?: string | null,
): Promise<ActionResult> {
  const caller = await resolve_caller_staff();
  if (!caller) return { success: false, error: 'You must be signed in as staff.' };

  const supabase = await createClient();
  const use_split = mat_package_id !== undefined;

  const { error } = use_split
    ? await supabase.rpc('staff_book_session_with_credits_for_client', {
        p_client_user_id: client_user_id,
        p_session_id: session_id,
        p_reformer_user_package_id: reformer_package_id,
        p_mat_user_package_id: mat_package_id,
      })
    : await supabase.rpc('staff_book_session_for_client', {
        p_client_user_id: client_user_id,
        p_session_id: session_id,
        p_user_package_id: reformer_package_id,
      });

  if (error) {
    return { success: false, error: map_staff_rpc_error(error.message) };
  }

  revalidatePath(MANAGER_PATH);
  return { success: true };
}

export async function create_recurring_rule(
  client_user_id: string,
  session_card_id: string,
  label: string,
): Promise<ActionResult & { rule_id?: string }> {
  const caller = await resolve_caller_staff();
  if (!caller) return { success: false, error: 'You must be signed in as staff.' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_recurring_prebook_rule', {
    p_client_user_id: client_user_id,
    p_session_card_id: session_card_id,
    p_label: label || null,
  });

  if (error) {
    return { success: false, error: map_staff_rpc_error(error.message) };
  }

  revalidatePath(MANAGER_PATH);
  return { success: true, rule_id: (data as { id: string }).id };
}

export async function update_recurring_rule(
  rule_id: string,
  session_card_id: string,
  label: string,
): Promise<ActionResult> {
  const caller = await resolve_caller_staff();
  if (!caller) return { success: false, error: 'You must be signed in as staff.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('update_recurring_prebook_rule', {
    p_rule_id: rule_id,
    p_session_card_id: session_card_id,
    p_label: label || null,
  });

  if (error) {
    return { success: false, error: map_staff_rpc_error(error.message) };
  }

  revalidatePath(MANAGER_PATH);
  return { success: true };
}

export async function deactivate_recurring_rule(rule_id: string): Promise<ActionResult> {
  const caller = await resolve_caller_staff();
  if (!caller) return { success: false, error: 'You must be signed in as staff.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('deactivate_recurring_prebook_rule', {
    p_rule_id: rule_id,
  });

  if (error) {
    return { success: false, error: map_staff_rpc_error(error.message) };
  }

  revalidatePath(MANAGER_PATH);
  return { success: true };
}

export async function delete_recurring_rule(rule_id: string): Promise<ActionResult> {
  const caller = await resolve_caller_staff();
  if (!caller) return { success: false, error: 'You must be signed in as staff.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('delete_recurring_prebook_rule', {
    p_rule_id: rule_id,
  });

  if (error) {
    return { success: false, error: map_staff_rpc_error(error.message) };
  }

  revalidatePath(MANAGER_PATH);
  return { success: true };
}

export async function list_recurring_schedule_lines(
  rule_id: string,
): Promise<RecurringScheduleLine[]> {
  const caller = await resolve_caller_staff();
  if (!caller) return [];

  const supabase = await createClient();
  const { data } = await supabase.rpc('list_recurring_prebook_schedule_lines', {
    p_rule_id: rule_id,
  });

  return (data ?? []) as RecurringScheduleLine[];
}

export async function add_recurring_schedule_line(
  rule_id: string,
  day_of_week: number,
  start_time: string,
  duration_minutes: number,
  first_occurrence_date: string,
): Promise<ActionResult> {
  const caller = await resolve_caller_staff();
  if (!caller) return { success: false, error: 'You must be signed in as staff.' };

  const supabase = await createClient();
  const { data: rule, error: rule_error } = await supabase
    .from('recurring_prebook_rules')
    .select('id, session_card_id')
    .eq('id', rule_id)
    .single();

  if (rule_error || !rule) {
    return { success: false, error: 'That recurring rule could not be found or is inactive.' };
  }

  const { data: card } = await supabase
    .from('session_cards')
    .select('duration_minutes')
    .eq('id', rule.session_card_id)
    .single();

  const card_duration_minutes = card?.duration_minutes ?? duration_minutes;

  if (!is_valid_recurring_weekly_slot(day_of_week, start_time, card_duration_minutes)) {
    return {
      success: false,
      error: 'Selected weekly slot is not available in the studio default schedule for this class.',
    };
  }

  const validation = validate_first_occurrence_date({
    first_occurrence_date,
    day_of_week,
    start_time,
    duration_minutes: card_duration_minutes,
  });
  if (!validation.ok) {
    return { success: false, error: validation.error };
  }

  const { error } = await supabase.rpc('add_recurring_prebook_schedule_line', {
    p_rule_id: rule_id,
    p_day_of_week: day_of_week,
    p_start_time: start_time,
    p_first_occurrence_date: first_occurrence_date,
    p_duration_minutes: card_duration_minutes,
    p_sort_order: 0,
  });

  if (error) {
    return { success: false, error: map_staff_rpc_error(error.message) };
  }

  revalidatePath(MANAGER_PATH);
  return { success: true };
}

export async function deactivate_recurring_schedule_line(line_id: string): Promise<ActionResult> {
  const caller = await resolve_caller_staff();
  if (!caller) return { success: false, error: 'You must be signed in as staff.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('deactivate_recurring_prebook_schedule_line', {
    p_line_id: line_id,
  });

  if (error) {
    return { success: false, error: map_staff_rpc_error(error.message) };
  }

  revalidatePath(MANAGER_PATH);
  return { success: true };
}

export async function list_recurring_skips(rule_id: string): Promise<RecurringSkip[]> {
  const caller = await resolve_caller_staff();
  if (!caller) return [];

  const supabase = await createClient();
  const { data } = await supabase.rpc('list_recurring_prebook_skips', { p_rule_id: rule_id });

  return (data ?? []) as RecurringSkip[];
}

export async function add_recurring_skip(
  rule_id: string,
  occurrence_date: string,
  start_time: string,
  reason: string,
): Promise<ActionResult> {
  const caller = await resolve_caller_staff();
  if (!caller) return { success: false, error: 'You must be signed in as staff.' };

  const lines = await list_recurring_schedule_lines(rule_id);
  const normalized_time = start_time.slice(0, 5);
  const matches_line = lines.some((line) => {
    if (!line.is_active) return false;
    if (line.start_time.slice(0, 5) !== normalized_time) return false;
    if (occurrence_date < line.first_occurrence_date) return false;
    return iso_weekday_from_date_key(occurrence_date) === line.day_of_week;
  });

  if (!matches_line) {
    return {
      success: false,
      error: 'That occurrence is not part of this recurring rule schedule.',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('add_recurring_prebook_skip', {
    p_rule_id: rule_id,
    p_occurrence_date: occurrence_date,
    p_start_time: start_time,
    p_reason: reason || null,
  });

  if (error) {
    return { success: false, error: map_staff_rpc_error(error.message) };
  }

  revalidatePath(MANAGER_PATH);
  return { success: true };
}

export async function remove_recurring_skip(skip_id: string): Promise<ActionResult> {
  const caller = await resolve_caller_staff();
  if (!caller) return { success: false, error: 'You must be signed in as staff.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('remove_recurring_prebook_skip', {
    p_skip_id: skip_id,
  });

  if (error) {
    return { success: false, error: map_staff_rpc_error(error.message) };
  }

  revalidatePath(MANAGER_PATH);
  return { success: true };
}

export async function load_recurring_forecast(rule_id: string): Promise<RecurringForecastRow[]> {
  const caller = await resolve_caller_staff();
  if (!caller) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_recurring_prebook_forecast', {
    p_rule_id: rule_id,
  });

  if (error) {
    console.error('[load_recurring_forecast]', error.message);
    return [];
  }

  return (data ?? []) as RecurringForecastRow[];
}

export async function retry_materialization(log_id: string): Promise<ActionResult> {
  const caller = await resolve_caller_staff();
  if (!caller) return { success: false, error: 'You must be signed in as staff.' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('retry_recurring_materialization', {
    p_log_id: log_id,
  });

  if (error) {
    return { success: false, error: map_staff_rpc_error(error.message) };
  }

  const row = data as { status: string; failure_message: string | null };
  if (row.status === 'failed') {
    return {
      success: false,
      error: row.failure_message ?? 'Materialization still failed after retry.',
    };
  }

  revalidatePath(MANAGER_PATH);
  return { success: true };
}

export async function list_client_materializable_occurrences(
  client_user_id: string,
): Promise<
  { success: true; rows: MaterializableOccurrence[] } | { success: false; error: string }
> {
  const caller = await resolve_caller_staff();
  if (!caller) {
    return { success: false, error: 'You must be signed in as staff.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_client_materializable_occurrences', {
    p_client_user_id: client_user_id,
  });

  if (error) {
    console.error('[list_client_materializable_occurrences]', error.message);
    return {
      success: false,
      error: map_staff_rpc_error(error.message),
    };
  }

  return { success: true, rows: (data ?? []) as MaterializableOccurrence[] };
}

function extract_uuid_array(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((id) => String(id));
  }

  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((id) => String(id));
      }
    } catch {
      return [];
    }
  }

  return [];
}

function parse_materialize_client_result(data: unknown): MaterializeClientResult | null {
  let row: Record<string, unknown>;

  if (typeof data === 'string') {
    try {
      const parsed: unknown = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object') return null;
      row = parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (data && typeof data === 'object') {
    row = data as Record<string, unknown>;
  } else {
    return null;
  }

  const failures = Array.isArray(row.failures) ? row.failures : [];
  const booking_ids = extract_uuid_array(row.booking_ids);
  const succeeded = Number(row.succeeded ?? booking_ids.length);

  return {
    booking_ids,
    processed: Number(row.processed ?? booking_ids.length),
    succeeded,
    failed: Number(row.failed ?? 0),
    skipped: Number(row.skipped ?? 0),
    excluded: Number(row.excluded ?? 0),
    window_start: String(row.window_start ?? ''),
    window_end: String(row.window_end ?? ''),
    failures: failures as MaterializeClientResult['failures'],
  };
}

function normalize_materialize_selection(
  selected_occurrences: MaterializeSelectionPayload[],
): MaterializeSelectionPayload[] {
  return selected_occurrences.map((occurrence) => ({
    rule_id: occurrence.rule_id,
    schedule_line_id: occurrence.schedule_line_id,
    occurrence_date: normalize_occurrence_date(occurrence.occurrence_date),
    start_time: normalize_occurrence_time(occurrence.start_time),
  }));
}

export async function materialize_client_recurring_prebooks(
  client_user_id: string,
  selected_occurrences: MaterializeSelectionPayload[],
): Promise<{ success: true; result: MaterializeClientResult } | { success: false; error: string }> {
  const caller = await resolve_caller_staff();
  if (!caller) return { success: false, error: 'You must be signed in as staff.' };

  if (selected_occurrences.length === 0) {
    return { success: false, error: 'Select at least one occurrence to materialize.' };
  }

  const normalized_selection = normalize_materialize_selection(selected_occurrences);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('staff_materialize_client_recurring_selection', {
    p_client_user_id: client_user_id,
    p_occurrences: normalized_selection,
  });

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[materialize_client_recurring_prebooks] RPC error:', error.message);
    }

    const mapped = map_staff_rpc_error(error.message);
    if (mapped.includes('staff_materialize_client_recurring_selection')) {
      return {
        success: false,
        error:
          'Materialization RPC is missing in the database. Apply migration 31 and 32 in Supabase, then try again.',
      };
    }

    return { success: false, error: mapped };
  }

  if (process.env.NODE_ENV === 'development') {
    console.info('[materialize_client_recurring_prebooks] RPC data:', data);
  }

  const result = parse_materialize_client_result(data);
  if (!result) {
    return {
      success: false,
      error: 'Materialization returned an unexpected response. Please try again.',
    };
  }

  revalidatePath(MANAGER_PATH);
  revalidatePath('/book');
  revalidatePath('/account');
  revalidatePath('/account/bookings');

  if (result.booking_ids.length === 0 || result.succeeded === 0) {
    return {
      success: false,
      error:
        'No bookings were created. If this keeps happening, apply migration 32 in Supabase and retry.',
    };
  }

  return { success: true, result };
}

export async function cancel_selected_recurring_occurrences(
  rule_id: string,
  selected: CancelRecurringOccurrenceItem[],
): Promise<{ success: boolean; message: string; results: CancelOccurrenceResult[] }> {
  const caller = await resolve_caller_staff();
  if (!caller) {
    return {
      success: false,
      message: 'You must be signed in as staff.',
      results: [],
    };
  }

  if (selected.length === 0) {
    return {
      success: false,
      message: 'Select at least one session to cancel.',
      results: [],
    };
  }

  const today = studio_date_key();
  const results: CancelOccurrenceResult[] = [];

  for (const item of selected) {
    if (item.occurrence_date < today) {
      results.push({
        occurrence_date: item.occurrence_date,
        start_time: item.start_time,
        success: false,
        error: 'Past sessions cannot be cancelled here.',
      });
      continue;
    }

    if (item.state === 'cancelled' || item.state === 'unavailable') {
      results.push({
        occurrence_date: item.occurrence_date,
        start_time: item.start_time,
        success: false,
        error: 'That session cannot be cancelled.',
      });
      continue;
    }

    if (item.state === 'booked' || item.state === 'waitlisted' || item.booking_id) {
      let booking_id = item.booking_id;
      if (!booking_id) {
        const supabase = await createClient();
        const { data: log_row } = await supabase
          .from('recurring_prebook_materialization_log')
          .select('booking_id')
          .eq('rule_id', rule_id)
          .eq('occurrence_date', item.occurrence_date)
          .eq('status', 'succeeded')
          .not('booking_id', 'is', null)
          .maybeSingle();
        booking_id = log_row?.booking_id ?? null;
      }

      if (booking_id) {
        const cancel_result = await staff_cancel_client_booking(booking_id);
        results.push({
          occurrence_date: item.occurrence_date,
          start_time: item.start_time,
          success: cancel_result.success,
          error: cancel_result.success ? undefined : cancel_result.error,
          mode: 'cancel_booking',
        });
        continue;
      }
    }

    const skip_result = await add_recurring_skip(
      rule_id,
      item.occurrence_date,
      item.start_time,
      'Cancelled via recurring sessions modal',
    );
    results.push({
      occurrence_date: item.occurrence_date,
      start_time: item.start_time,
      success: skip_result.success,
      error: skip_result.success ? undefined : skip_result.error,
      mode: 'skip',
    });
  }

  const summary = summarize_cancel_batch(results);
  revalidatePath(MANAGER_PATH);
  return {
    success: summary.all_succeeded,
    message: summary.message,
    results,
  };
}

