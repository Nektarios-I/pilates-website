'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { TimeRange } from '@/lib/schedule/studio-hours';

export type ScheduleSaveResult = { success: true } | { success: false; error: string };

export type DayScheduleInput = {
  date: string;
  is_closed: boolean;
  time_ranges: TimeRange[];
  notes?: string;
};

async function resolve_admin_or_owner(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  return (roles ?? []).some((row) => row.role === 'owner' || row.role === 'admin');
}

export async function get_day_schedule_for_staff(date: string): Promise<{
  is_closed: boolean;
  time_ranges: TimeRange[];
  is_override: boolean;
  notes: string | null;
}> {
  const allowed = await resolve_admin_or_owner();
  if (!allowed) {
    return { is_closed: true, time_ranges: [], is_override: false, notes: null };
  }

  const supabase = await createClient();
  const { data: hours } = await supabase.rpc('get_studio_hours_for_date', { p_date: date });

  const hour_row = Array.isArray(hours) ? hours[0] : null;
  const ranges = parse_ranges(hour_row?.time_ranges);

  const { data: override } = await supabase
    .from('studio_day_schedule')
    .select('notes')
    .eq('schedule_date', date)
    .maybeSingle();

  return {
    is_closed: Boolean(hour_row?.is_closed),
    time_ranges: ranges,
    is_override: Boolean(hour_row?.is_override),
    notes: override?.notes ?? null,
  };
}

function parse_ranges(value: unknown): TimeRange[] {
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

export async function save_day_schedule(input: DayScheduleInput): Promise<ScheduleSaveResult> {
  const allowed = await resolve_admin_or_owner();
  if (!allowed) {
    return { success: false, error: 'Only owners and admins can edit studio hours.' };
  }

  for (const range of input.time_ranges) {
    if (range.start >= range.end) {
      return { success: false, error: 'Each working period must end after it starts.' };
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.from('studio_day_schedule').upsert(
    {
      schedule_date: input.date,
      is_closed: input.is_closed,
      time_ranges: input.is_closed ? [] : input.time_ranges,
      notes: input.notes ?? null,
    },
    { onConflict: 'schedule_date' },
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function delete_day_schedule_override(date: string): Promise<ScheduleSaveResult> {
  const allowed = await resolve_admin_or_owner();
  if (!allowed) {
    return { success: false, error: 'Only owners and admins can edit studio hours.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.from('studio_day_schedule').delete().eq('schedule_date', date);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
