export type CancellableOccurrenceState =
  | 'planned'
  | 'booked'
  | 'waitlisted'
  | 'cancelled'
  | 'unavailable'
  | 'past';

export type CancelRecurringOccurrenceItem = {
  occurrence_date: string;
  start_time: string;
  end_time?: string;
  session_title?: string;
  state: CancellableOccurrenceState;
  booking_id?: string | null;
};

export function is_occurrence_cancellable(item: CancelRecurringOccurrenceItem): boolean {
  if (item.state === 'past' || item.state === 'cancelled' || item.state === 'unavailable') {
    return false;
  }
  return item.state === 'planned' || item.state === 'booked' || item.state === 'waitlisted';
}

export function filter_cancellable_modal_occurrences(
  items: CancelRecurringOccurrenceItem[],
  studio_today: string,
): CancelRecurringOccurrenceItem[] {
  return items.filter((item) => item.occurrence_date >= studio_today);
}

export function default_cancel_selection_keys(): Set<string> {
  return new Set();
}

export function occurrence_selection_key(occurrence_date: string, start_time: string): string {
  return `${occurrence_date}|${start_time.slice(0, 5)}`;
}

export function cancel_selected_sessions_enabled(selected_count: number): boolean {
  return selected_count > 0;
}

export function cancel_confirmation_copy(selected_count: number): {
  title: string;
  body: string;
  confirm_label: string;
} {
  const count = selected_count;
  return {
    title: `Cancel ${count} selected recurring session${count === 1 ? '' : 's'}?`,
    body: 'This will not end the recurring rule. All unselected future sessions will remain scheduled.',
    confirm_label: 'Cancel selected sessions',
  };
}

export type CancelOccurrenceResult = {
  occurrence_date: string;
  start_time: string;
  success: boolean;
  error?: string;
  mode?: 'skip' | 'cancel_booking';
};

export function summarize_cancel_batch(results: CancelOccurrenceResult[]): {
  succeeded: number;
  failed: number;
  all_succeeded: boolean;
  message: string;
} {
  const succeeded = results.filter((row) => row.success).length;
  const failed = results.length - succeeded;
  if (failed === 0) {
    return {
      succeeded,
      failed,
      all_succeeded: true,
      message: `Cancelled ${succeeded} recurring session${succeeded === 1 ? '' : 's'}. The recurring rule remains active.`,
    };
  }
  return {
    succeeded,
    failed,
    all_succeeded: false,
    message: `Cancelled ${succeeded} of ${results.length} sessions. ${failed} could not be cancelled.`,
  };
}
