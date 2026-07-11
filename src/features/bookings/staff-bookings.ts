export const BOOKING_STATUSES = [
  'booked',
  'waitlisted',
  'cancelled',
  'attended',
  'no_show',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STAFF_BOOKING_HISTORY_STATUSES = [
  'all',
  'booked',
  'cancelled',
  'finished',
] as const;

export type StaffBookingHistoryStatus = (typeof STAFF_BOOKING_HISTORY_STATUSES)[number];

export type StaffBookingFilters = {
  status: StaffBookingHistoryStatus;
  search: string;
  /** YYYY-MM-DD; empty string = not applied */
  session_start_date: string;
  /** YYYY-MM-DD; empty string = not applied */
  session_end_date: string;
};

export const DEFAULT_STAFF_BOOKING_FILTERS: StaffBookingFilters = {
  status: 'all',
  search: '',
  session_start_date: '',
  session_end_date: '',
};

/** Cap for owner/admin booking history queries (newest sessions first). */
export const STAFF_BOOKINGS_LIMIT = 250;

export type StaffBookingRecord = {
  id: string;
  status: BookingStatus;
  booked_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  credits_used: number;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  session_title: string;
  session_starts_at: string;
  session_ends_at: string;
  session_type: string;
  session_location: string | null;
  credit_charges: { class_type: string; credits_used: number }[];
};

type RelatedRow<T> = T | T[] | null;

export function related_booking_row<T>(value: RelatedRow<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type RawStaffBookingRow = {
  id: string;
  status: string;
  booked_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  credits_used: number;
  profiles: RelatedRow<{ full_name: string | null; email: string | null; phone: string | null }>;
  sessions: RelatedRow<{
    title: string;
    starts_at: string;
    ends_at: string;
    session_type: string;
    location: string | null;
    credits_required: number;
    reformer_credits_required: number;
    mat_credits_required: number;
  }>;
  booking_credit_charges: { class_type: string; credits_used: number }[] | null;
};

export function map_staff_booking(row: RawStaffBookingRow): StaffBookingRecord | null {
  const session = related_booking_row(row.sessions);
  const profile = related_booking_row(row.profiles);
  if (!session || !profile) return null;

  if (!BOOKING_STATUSES.includes(row.status as BookingStatus)) return null;

  return {
    id: row.id,
    status: row.status as BookingStatus,
    booked_at: row.booked_at,
    cancelled_at: row.cancelled_at,
    cancellation_reason: row.cancellation_reason,
    credits_used: row.credits_used,
    client_name: profile.full_name,
    client_email: profile.email,
    client_phone: profile.phone,
    session_title: session.title,
    session_starts_at: session.starts_at,
    session_ends_at: session.ends_at,
    session_type: session.session_type,
    session_location: session.location,
    credit_charges: row.booking_credit_charges ?? [],
  };
}

export function sort_staff_bookings_by_session_start(
  bookings: StaffBookingRecord[],
  ascending = false,
): StaffBookingRecord[] {
  return [...bookings].sort(
    (a, b) =>
      (ascending ? 1 : -1) *
      (new Date(a.session_starts_at).getTime() - new Date(b.session_starts_at).getTime()),
  );
}

export function filter_staff_bookings_by_search(
  bookings: StaffBookingRecord[],
  search: string,
): StaffBookingRecord[] {
  const query = search.trim().toLowerCase();
  if (!query) return bookings;

  return bookings.filter((booking) => {
    const name = booking.client_name?.toLowerCase() ?? '';
    const email = booking.client_email?.toLowerCase() ?? '';
    const phone = booking.client_phone?.toLowerCase() ?? '';
    const phone_digits = phone.replace(/\D/g, '');
    const query_digits = query.replace(/\D/g, '');

    return (
      name.includes(query) ||
      email.includes(query) ||
      phone.includes(query) ||
      (query_digits.length >= 3 && phone_digits.includes(query_digits))
    );
  });
}

export function format_booking_client_contact(
  booking: Pick<StaffBookingRecord, 'client_email' | 'client_phone'>,
): string {
  return booking.client_email ?? booking.client_phone ?? 'Contact details not provided';
}

export function format_booking_status(status: BookingStatus): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function format_staff_booking_history_status(status: StaffBookingHistoryStatus): string {
  if (status === 'all') return 'All statuses';
  if (status === 'finished') return 'Finished';
  return format_booking_status(status as BookingStatus);
}

export function is_valid_session_date_range(start_date: string, end_date: string): boolean {
  if (!start_date || !end_date) return true;
  return start_date <= end_date;
}

export function format_session_type(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function format_booking_date(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function format_booking_time(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function credit_summary_for_staff_booking(booking: StaffBookingRecord): string {
  if (booking.credit_charges.length > 0) {
    return booking.credit_charges
      .map((charge) => `${charge.credits_used} ${charge.class_type}`)
      .join(' + ');
  }

  return `${booking.credits_used} credit${booking.credits_used === 1 ? '' : 's'}`;
}
