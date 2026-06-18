'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import type { TimeRange } from '@/lib/schedule/studio-hours';
import {
  add_days,
  format_day_number,
  format_month_year,
  format_weekday_short,
  get_month_grid,
  is_same_day,
  parse_date_key,
  start_of_week_monday,
  to_date_key,
} from '@/lib/schedule/studio-hours';

import {
  delete_day_schedule_override,
  get_day_schedule_for_staff,
  save_day_schedule,
} from './actions';

const EMPTY_RANGE = (): TimeRange => ({ start: '06:00', end: '12:00' });

export function ScheduleEditorPanel() {
  const router = useRouter();
  const today = new Date();
  const [anchor, set_anchor] = useState(today);
  const [selected_date, set_selected_date] = useState(to_date_key(today));
  const [is_closed, set_is_closed] = useState(false);
  const [time_ranges, set_time_ranges] = useState<TimeRange[]>([EMPTY_RANGE()]);
  const [is_override, set_is_override] = useState(false);
  const [error, set_error] = useState('');
  const [success, set_success] = useState('');
  const [is_pending, start_transition] = useTransition();

  const week_days = Array.from({ length: 7 }, (_, index) =>
    add_days(start_of_week_monday(anchor), index),
  );
  const month_days = get_month_grid(anchor);

  useEffect(() => {
    void get_day_schedule_for_staff(selected_date).then((schedule) => {
      set_is_closed(schedule.is_closed);
      set_time_ranges(schedule.time_ranges.length > 0 ? schedule.time_ranges : [EMPTY_RANGE()]);
      set_is_override(schedule.is_override);
    });
  }, [selected_date]);

  function update_range(index: number, field: keyof TimeRange, value: string) {
    set_time_ranges((prev) =>
      prev.map((range, range_index) =>
        range_index === index ? { ...range, [field]: value } : range,
      ),
    );
  }

  function add_range() {
    set_time_ranges((prev) => [...prev, { start: '15:00', end: '18:00' }]);
  }

  function remove_range(index: number) {
    set_time_ranges((prev) => prev.filter((_, range_index) => range_index !== index));
  }

  function handle_save() {
    start_transition(async () => {
      set_error('');
      set_success('');
      const result = await save_day_schedule({
        date: selected_date,
        is_closed,
        time_ranges: is_closed ? [] : time_ranges,
      });

      if (!result.success) {
        set_error(result.error);
        return;
      }

      set_success('Schedule saved.');
      set_is_override(true);
      router.refresh();
    });
  }

  function handle_reset_defaults() {
    start_transition(async () => {
      set_error('');
      set_success('');
      const result = await delete_day_schedule_override(selected_date);
      if (!result.success) {
        set_error(result.error);
        return;
      }

      const schedule = await get_day_schedule_for_staff(selected_date);
      set_is_closed(schedule.is_closed);
      set_time_ranges(schedule.time_ranges.length > 0 ? schedule.time_ranges : [EMPTY_RANGE()]);
      set_is_override(false);
      set_success('Reverted to default weekly hours.');
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">{format_month_year(anchor)}</p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              const prev = new Date(anchor);
              prev.setMonth(prev.getMonth() - 1);
              set_anchor(prev);
            }}
            size="sm"
            type="button"
            variant="secondary"
          >
            Prev
          </Button>
          <Button
            onClick={() => {
              set_anchor(today);
              set_selected_date(to_date_key(today));
            }}
            size="sm"
            type="button"
            variant="secondary"
          >
            Today
          </Button>
          <Button
            onClick={() => {
              const next = new Date(anchor);
              next.setMonth(next.getMonth() + 1);
              set_anchor(next);
            }}
            size="sm"
            type="button"
            variant="secondary"
          >
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {month_days.map((date) => {
          const date_key = to_date_key(date);
          const is_selected = date_key === selected_date;
          const is_today = is_same_day(date, today);
          const in_month = date.getMonth() === anchor.getMonth();

          return (
            <button
              key={date_key}
              className={[
                'rounded-md border px-2 py-2 text-sm transition-colors',
                !in_month ? 'opacity-40' : '',
                is_selected ? 'border-stone-900 bg-stone-900 text-white' : 'border-border bg-surface',
                is_today && !is_selected ? 'ring-2 ring-stone-950 ring-offset-1' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => set_selected_date(date_key)}
              type="button"
            >
              {format_day_number(date)}
            </button>
          );
        })}
      </div>

      <div className="rounded-md border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-950">
              {parse_date_key(selected_date).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {is_override ? 'Custom hours saved for this day.' : 'Using default weekly hours.'}
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-stone-700">
            <input
              checked={is_closed}
              onChange={(event) => set_is_closed(event.target.checked)}
              type="checkbox"
            />
            Closed all day
          </label>
        </div>

        {!is_closed ? (
          <div className="mt-6 space-y-4">
            {time_ranges.map((range, index) => (
              <div key={index} className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600">Opens</label>
                  <input
                    className="mt-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
                    onChange={(event) => update_range(index, 'start', event.target.value)}
                    type="time"
                    value={range.start}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600">Closes</label>
                  <input
                    className="mt-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
                    onChange={(event) => update_range(index, 'end', event.target.value)}
                    type="time"
                    value={range.end}
                  />
                </div>
                {time_ranges.length > 1 ? (
                  <Button onClick={() => remove_range(index)} size="sm" type="button" variant="secondary">
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}

            <Button onClick={add_range} size="sm" type="button" variant="secondary">
              Add break / second period
            </Button>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button disabled={is_pending} onClick={handle_save} type="button">
            Save day
          </Button>
          {is_override ? (
            <Button disabled={is_pending} onClick={handle_reset_defaults} type="button" variant="secondary">
              Use default hours
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted p-4">
        <p className="text-sm font-medium text-stone-950">This week</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-7">
          {week_days.map((date) => (
            <button
              key={to_date_key(date)}
              className="rounded-md border border-border bg-surface px-2 py-2 text-left text-xs"
              onClick={() => set_selected_date(to_date_key(date))}
              type="button"
            >
              <span className="font-medium">{format_weekday_short(date)}</span>
              <span className="mt-1 block text-stone-500">{format_day_number(date)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
