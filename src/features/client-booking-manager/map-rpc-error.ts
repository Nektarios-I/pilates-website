const STAFF_BOOKING_MSG_MAP: Record<string, string> = {
  P0001: 'You must be signed in.',
  P0002: 'That session could not be found.',
  P0003: 'This session is no longer available for booking.',
  P0004: 'This session has already started.',
  P0005: 'The selected package could not be found for this client.',
  P0006: 'The selected package is not active.',
  P0007: 'The selected package has expired.',
  P0008: 'The client does not have enough credits for this session.',
  P0009: 'The selected package does not match this session type.',
  P0011: 'You are not authorised to perform this action.',
  P0013: 'The client already has a booking at this time slot.',
  P0014: 'Bookings are limited to the next 14 days.',
  P0015: 'This session is full. Staff manual booking does not waitlist.',
  P0017: 'Bookings can only be created for client accounts.',
  P0018: 'The selected session card is not available.',
  P0019: 'That recurring rule could not be found or is inactive.',
  P0023: 'An active schedule line already exists for that weekday and time.',
  P0024: 'That schedule line could not be found.',
  P0025: 'That occurrence is already skipped.',
  P0026: 'That skipped occurrence could not be found.',
  P0027: 'That materialization record could not be found.',
  P0028: 'Only failed or pending materializations can be retried.',
  P0031: 'That skip does not match an active weekly slot for this recurring rule.',
  P0032: 'This time is reserved until recurring prebookings are processed for this date.',
  P0034: 'Select at least one occurrence to materialize.',
  P0035: 'One or more selected occurrences are invalid or no longer available.',
  P0036: 'Materialization failed for one or more selected occurrences.',
  P0037:
    'Not enough credits for all selected occurrences. Uncheck classes marked insufficient slots or add credits.',
};

export function map_staff_rpc_error(message: string | undefined): string {
  const raw = message ?? '';
  const matched_code = Object.keys(STAFF_BOOKING_MSG_MAP).find((code) => raw.includes(code));
  return matched_code ? STAFF_BOOKING_MSG_MAP[matched_code] : raw || 'Something went wrong.';
}
