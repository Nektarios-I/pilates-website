import { describe, expect, it } from 'vitest';

import {
  accessible_day_label,
  build_day_hour_slots,
  build_month_calendar_days,
  classify_session_type,
  empty_type_counts,
  format_compact_client_name,
  format_compact_type_counts_label,
  format_hour_clock_label,
  format_slot_counts_label,
  format_type_counts_label,
  grade_session_density,
  map_month_calendar_booking,
  shift_year_month,
  studio_month_grid_window_bounds,
  year_dropdown_options,
  type MonthCalendarBooking,
} from './month-calendar';

function booking(
  partial: Partial<MonthCalendarBooking> & Pick<MonthCalendarBooking, 'id' | 'starts_at'>,
): MonthCalendarBooking {
  return {
    user_id: 'user-1',
    client_name: 'Maria Papadou',
    session_type: 'reformer',
    kind: 'reformer',
    date_key: '2026-09-05',
    hour: 6,
    ...partial,
  };
}

describe('format_compact_client_name', () => {
  it('keeps the first name and truncates the last name to three letters', () => {
    expect(format_compact_client_name('Maria Papadou')).toBe('Maria Pap');
  });

  it('uses the first and last tokens when there are middle names', () => {
    expect(format_compact_client_name('Maria Anna Papadou')).toBe('Maria Pap');
  });

  it('returns a single token unchanged', () => {
    expect(format_compact_client_name('Maria')).toBe('Maria');
  });

  it('falls back when the name is missing', () => {
    expect(format_compact_client_name(null)).toBe('Unnamed client');
    expect(format_compact_client_name('   ')).toBe('Unnamed client');
  });
});

describe('classify_session_type', () => {
  it('maps known class types', () => {
    expect(classify_session_type('reformer')).toBe('reformer');
    expect(classify_session_type('mat')).toBe('mat');
    expect(classify_session_type('private')).toBe('private');
    expect(classify_session_type('intro')).toBe('intro');
  });

  it('classifies unknown types as other', () => {
    expect(classify_session_type('workshop')).toBe('other');
  });
});

describe('format_type_counts_label', () => {
  it('returns No sessions when every type is zero', () => {
    expect(format_type_counts_label(empty_type_counts())).toBe('No sessions');
  });

  it('always shows Reformer and Mat counts when there is activity', () => {
    expect(
      format_type_counts_label({
        ...empty_type_counts(),
        reformer: 3,
        mat: 1,
      }),
    ).toBe('3 Reformer, 1 Mat');
  });

  it('appends Private and Intro after Reformer and Mat', () => {
    expect(
      format_type_counts_label({
        ...empty_type_counts(),
        reformer: 0,
        mat: 0,
        private: 2,
        intro: 1,
      }),
    ).toBe('0 Reformer, 0 Mat, 2 Private, 1 Intro');
  });
});

describe('format_slot_counts_label', () => {
  it('keeps zero Reformer/Mat counts visible on empty hour rows', () => {
    expect(format_slot_counts_label(empty_type_counts())).toBe('0 Reformer, 0 Mat');
  });
});

describe('format_compact_type_counts_label', () => {
  it('uses a short Reformer/Mat form for narrow day cells', () => {
    expect(
      format_compact_type_counts_label({
        ...empty_type_counts(),
        reformer: 3,
        mat: 1,
      }),
    ).toBe('3R 1M');
    expect(format_compact_type_counts_label(empty_type_counts())).toBe('None');
  });
});

describe('format_hour_clock_label', () => {
  it('renders 24-hour clock times with minutes', () => {
    expect(format_hour_clock_label(0)).toBe('0:00');
    expect(format_hour_clock_label(6)).toBe('6:00');
    expect(format_hour_clock_label(7)).toBe('7:00');
    expect(format_hour_clock_label(23)).toBe('23:00');
  });
});

describe('grade_session_density', () => {
  it('grades empty and increasing active-booking totals', () => {
    expect(grade_session_density(0)).toBe(0);
    expect(grade_session_density(1)).toBe(1);
    expect(grade_session_density(2)).toBe(1);
    expect(grade_session_density(3)).toBe(2);
    expect(grade_session_density(5)).toBe(2);
    expect(grade_session_density(6)).toBe(3);
    expect(grade_session_density(9)).toBe(3);
    expect(grade_session_density(10)).toBe(4);
    expect(grade_session_density(40)).toBe(4);
  });
});

describe('shift_year_month', () => {
  it('wraps December to January of the next year', () => {
    expect(shift_year_month(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it('wraps January to December of the previous year', () => {
    expect(shift_year_month(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
});

describe('studio_month_grid_window_bounds', () => {
  it('covers the Monday-start 42-day grid for September 2026', () => {
    expect(studio_month_grid_window_bounds(2026, 9)).toEqual({
      range_start: '2026-08-31T00:00:00',
      range_end: '2026-10-11T23:59:59',
    });
  });
});

describe('year_dropdown_options', () => {
  it('includes far-away selected years without a hard cap', () => {
    const options = year_dropdown_options(1999, 2026);
    expect(options[0]).toBe(1999);
    expect(options).toContain(2026);
    expect(year_dropdown_options(2099, 2026)).toContain(2099);
  });
});

describe('map_month_calendar_booking', () => {
  it('keeps active bookings and studio-local hour/date', () => {
    const mapped = map_month_calendar_booking({
      id: 'b1',
      user_id: 'user-maria',
      status: 'booked',
      profiles: { full_name: 'Maria Papadou', email: 'maria@example.com', phone: null },
      sessions: {
        starts_at: '2026-09-05T03:00:00.000Z',
        session_type: 'reformer',
      },
    });

    expect(mapped).toMatchObject({
      id: 'b1',
      user_id: 'user-maria',
      client_name: 'Maria Papadou',
      kind: 'reformer',
      date_key: '2026-09-05',
      hour: 6,
    });
  });

  it('drops cancelled bookings', () => {
    expect(
      map_month_calendar_booking({
        id: 'b2',
        user_id: 'user-2',
        status: 'cancelled',
        profiles: { full_name: 'Alex', email: 'a@example.com', phone: null },
        sessions: {
          starts_at: '2026-09-05T03:00:00.000Z',
          session_type: 'mat',
        },
      }),
    ).toBeNull();
  });
});

describe('build_month_calendar_days', () => {
  it('builds a 42-day Mon-Sun grid with Reformer/Mat counts, today, and empty days', () => {
    const days = build_month_calendar_days({
      year: 2026,
      month: 9,
      today_key: '2026-09-05',
      bookings: [
        booking({
          id: 'r1',
          starts_at: '2026-09-05T03:00:00.000Z',
          date_key: '2026-09-05',
          hour: 6,
          kind: 'reformer',
          session_type: 'reformer',
        }),
        booking({
          id: 'r2',
          starts_at: '2026-09-05T04:00:00.000Z',
          date_key: '2026-09-05',
          hour: 7,
          kind: 'reformer',
          session_type: 'reformer',
        }),
        booking({
          id: 'm1',
          starts_at: '2026-09-05T03:00:00.000Z',
          date_key: '2026-09-05',
          hour: 6,
          kind: 'mat',
          session_type: 'mat',
          client_name: 'Elena Matou',
        }),
        booking({
          id: 'p1',
          starts_at: '2026-09-08T03:00:00.000Z',
          date_key: '2026-09-08',
          hour: 6,
          kind: 'private',
          session_type: 'private',
        }),
      ],
    });

    expect(days).toHaveLength(42);
    expect(days[0]?.date_key).toBe('2026-08-31');
    expect(days[0]?.is_current_month).toBe(false);
    expect(days[0]?.weekday_short).toBe('Mon');

    const saturday = days.find((day) => day.date_key === '2026-09-05');
    expect(saturday).toMatchObject({
      day_number: 5,
      weekday_short: 'Sat',
      is_today: true,
      is_current_month: true,
      counts: {
        reformer: 2,
        mat: 1,
        private: 0,
        intro: 0,
        other: 0,
      },
      total_active: 3,
      grade: 2,
    });
    expect(format_type_counts_label(saturday!.counts)).toBe('2 Reformer, 1 Mat');
    expect(accessible_day_label(saturday!)).toBe('5 September, 2 Reformer, 1 Mat');

    const empty = days.find((day) => day.date_key === '2026-09-06');
    expect(empty?.total_active).toBe(0);
    expect(empty?.grade).toBe(0);
    expect(format_type_counts_label(empty!.counts)).toBe('No sessions');

    const private_day = days.find((day) => day.date_key === '2026-09-08');
    expect(private_day?.counts.private).toBe(1);
    expect(private_day?.total_active).toBe(1);
    expect(format_type_counts_label(private_day!.counts)).toBe(
      '0 Reformer, 0 Mat, 1 Private',
    );
  });
});

describe('build_day_hour_slots', () => {
  it('renders all 24 hours and orders Reformer, then Mat, then other types', () => {
    const slots = build_day_hour_slots({
      date_key: '2026-09-05',
      bookings: [
        booking({
          id: 'mat-1',
          starts_at: '2026-09-05T03:00:00.000Z',
          hour: 6,
          kind: 'mat',
          session_type: 'mat',
          client_name: 'Elena Matou',
        }),
        booking({
          id: 'ref-1',
          starts_at: '2026-09-05T03:10:00.000Z',
          hour: 6,
          kind: 'reformer',
          session_type: 'reformer',
          client_name: 'Maria Papadou',
        }),
        booking({
          id: 'intro-1',
          starts_at: '2026-09-05T03:15:00.000Z',
          hour: 6,
          kind: 'intro',
          session_type: 'intro',
          client_name: 'Intro Guest',
        }),
        booking({
          id: 'priv-1',
          starts_at: '2026-09-05T03:20:00.000Z',
          hour: 6,
          kind: 'private',
          session_type: 'private',
          client_name: 'Nikos Private',
        }),
        booking({
          id: 'other-day',
          starts_at: '2026-09-06T03:00:00.000Z',
          date_key: '2026-09-06',
          hour: 6,
          kind: 'reformer',
        }),
      ],
    });

    expect(slots).toHaveLength(24);
    expect(slots[0]?.time_label).toBe('0:00');
    expect(slots[23]?.time_label).toBe('23:00');
    expect(slots[0]?.counts).toEqual(empty_type_counts());
    expect(format_slot_counts_label(slots[0]!.counts)).toBe('0 Reformer, 0 Mat');

    const six = slots[6];
    expect(six?.time_label).toBe('6:00');
    expect(six?.counts).toEqual({
      reformer: 1,
      mat: 1,
      private: 1,
      intro: 1,
      other: 0,
    });
    expect(six?.reformer.map((item) => item.id)).toEqual(['ref-1']);
    expect(six?.mat.map((item) => item.id)).toEqual(['mat-1']);
    expect(six?.other.map((item) => item.id)).toEqual(['priv-1', 'intro-1']);
    expect(six?.reformer[0]?.compact_name).toBe('Maria Pap');
    expect(six?.mat[0]?.session_type_label).toBe('Mat');
    expect(six?.other[0]?.session_type_label).toBe('Private');
    expect(six?.other[1]?.session_type_label).toBe('Intro');
  });
});
