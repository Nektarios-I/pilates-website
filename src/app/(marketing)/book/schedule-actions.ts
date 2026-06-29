'use server';

import { createClient } from '@/lib/supabase/server';
import type { DaySchedule, TimeRange } from '@/lib/schedule/studio-hours';
import { get_default_weekly_ranges } from '@/lib/schedule/studio-hours';

import type { SessionItem } from './booking-panel';
import { book_session_action } from './actions';

export type SlotSession = {
  slot_start: string;
  slot_end: string;
  session_id: string | null;
  confirmed_count: number;
  capacity: number;
};

export type SessionCard = {
  id: string;
  title: string;
  description: string;
  session_type: 'reformer' | 'mat' | 'private' | 'intro';
  duration_minutes: number;
  instructor_name: string | null;
  image_src: string | null;
  capacity: number;
  credits_required: number;
  reformer_credits_required: number;
  mat_credits_required: number;
};

export type BookSlotResult =
  | { success: true; booking_id: string; status: string; session_title: string }
  | { success: false; error: string };

function parse_time_ranges(value: unknown): TimeRange[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const row = entry as { start?: unknown; end?: unknown };
      if (typeof row.start !== 'string' || typeof row.end !== 'string') return null;
      return { start: row.start, end: row.end };
    })
    .filter((entry): entry is TimeRange => entry !== null);
}

export async function get_day_schedule(date_key: string): Promise<DaySchedule> {
  const supabase = await createClient();
  const date = new Date(date_key);

  const { data, error } = await supabase.rpc('get_studio_hours_for_date', {
    p_date: date_key,
  });

  if (error || !data || !Array.isArray(data) || data.length === 0) {
    const fallback = get_default_weekly_ranges(date);
    return {
      date: date_key,
      is_closed: fallback.length === 0,
      time_ranges: fallback,
      is_override: false,
    };
  }

  const row = data[0] as {
    is_closed: boolean;
    time_ranges: unknown;
    is_override: boolean;
  };

  const ranges = parse_time_ranges(row.time_ranges);

  return {
    date: date_key,
    is_closed: row.is_closed || ranges.length === 0,
    time_ranges: ranges,
    is_override: row.is_override,
  };
}

function studio_time_from_iso(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Nicosia',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));

  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

export async function get_session_cards(include_inactive = false): Promise<SessionCard[]> {
  const supabase = await createClient();
  let query = supabase
    .from('session_cards')
    .select(
      'id, title, description, session_type, duration_minutes, instructor_name, image_src, capacity, credits_required, reformer_credits_required, mat_credits_required',
    )
    .order('sort_order', { ascending: true });

  if (!include_inactive) {
    query = query.eq('is_active', true);
  }

  const { data } = await query;
  return (data ?? []) as SessionCard[];
}

export async function get_slots_for_day(
  date_key: string,
  session_type = 'reformer',
  duration_minutes = 60,
): Promise<SlotSession[]> {
  const schedule = await get_day_schedule(date_key);
  if (schedule.is_closed) return [];

  const supabase = await createClient();
  const day_start = `${date_key}T00:00:00`;
  const day_end = `${date_key}T23:59:59`;

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, starts_at, ends_at, capacity, session_type, status')
    .eq('status', 'scheduled')
    .gte('starts_at', day_start)
    .lte('starts_at', day_end);

  const session_ids = (sessions ?? []).map((s) => s.id);
  const count_map: Record<string, number> = {};

  if (session_ids.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('session_id')
      .in('session_id', session_ids)
      .eq('status', 'booked');

    (bookings ?? []).forEach((booking) => {
      count_map[booking.session_id] = (count_map[booking.session_id] ?? 0) + 1;
    });
  }

  const { generate_hourly_slots } = await import('@/lib/schedule/studio-hours');
  const slots = generate_hourly_slots(schedule.time_ranges, duration_minutes);

  return slots.map((slot) => {
    const match = (sessions ?? []).find((session) => {
      const local_start = studio_time_from_iso(session.starts_at);
      return local_start === slot.start && session.session_type === session_type;
    });

    return {
      slot_start: slot.start,
      slot_end: slot.end,
      session_id: match?.id ?? null,
      confirmed_count: match ? (count_map[match.id] ?? 0) : 0,
      capacity: match?.capacity ?? 6,
    };
  });
}

export async function book_slot_action(
  date_key: string,
  slot_start: string,
  slot_end: string,
  reformer_package_id: string | null,
  mat_package_id: string | null,
  session_card_id: string,
): Promise<BookSlotResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be signed in to book.' };
  }

  const schedule = await get_day_schedule(date_key);
  if (schedule.is_closed) {
    return { success: false, error: 'The studio is closed on this day.' };
  }

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
    return { success: false, error: ensure_error?.message ?? 'Could not reserve this time slot.' };
  }

  const requires_reformer = (session_card.reformer_credits_required ?? 0) > 0;
  const requires_mat = (session_card.mat_credits_required ?? 0) > 0;

  const result = await book_session_action(
    session_id as string,
    requires_reformer ? reformer_package_id : null,
    requires_mat ? (mat_package_id ?? undefined) : undefined,
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const { data: session_row } = await supabase
    .from('sessions')
    .select('title')
    .eq('id', session_id)
    .single();

  return {
    success: true,
    booking_id: result.booking.id,
    status: result.status,
    session_title: session_row?.title ?? session_card.title,
  };
}

export async function get_week_schedule_summaries(dates: string[]): Promise<Record<string, DaySchedule>> {
  const entries = await Promise.all(dates.map(async (date) => [date, await get_day_schedule(date)] as const));
  return Object.fromEntries(entries);
}

export async function list_sessions_for_booking(): Promise<SessionItem[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: raw_sessions } = await supabase
    .from('sessions')
    .select(
      'id, title, description, session_type, starts_at, ends_at, capacity, credits_required, location, instructor_id',
    )
    .eq('status', 'scheduled')
    .gt('starts_at', now)
    .order('starts_at', { ascending: true })
    .limit(60);

  const instructor_ids = [
    ...new Set((raw_sessions ?? []).map((s) => s.instructor_id).filter(Boolean) as string[]),
  ];

  const instructor_map: Record<string, string> = {};
  if (instructor_ids.length > 0) {
    const { data: instructors } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', instructor_ids);

    (instructors ?? []).forEach((profile) => {
      if (profile.full_name) instructor_map[profile.id] = profile.full_name;
    });
  }

  const session_ids = (raw_sessions ?? []).map((s) => s.id);
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
    description: session.description ?? null,
    session_type: session.session_type,
    starts_at: session.starts_at,
    ends_at: session.ends_at,
    capacity: session.capacity,
    credits_required: session.credits_required,
    location: session.location ?? null,
    instructor_name: session.instructor_id ? (instructor_map[session.instructor_id] ?? null) : null,
    confirmed_count: count_map[session.id] ?? 0,
  }));
}
