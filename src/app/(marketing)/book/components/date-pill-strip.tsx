'use client';

import {
  format_day_number,
  format_month_year,
  format_weekday_short,
  is_past_day,
  to_date_key,
} from '@/lib/schedule/studio-hours';

type DatePillStripProps = {
  dates: Date[];
  selected_date: string;
  today: Date;
  heading: string;
  on_select: (date_key: string, date: Date) => void;
};

export function DatePillStrip({
  dates,
  selected_date,
  today,
  heading,
  on_select,
}: DatePillStripProps) {
  return (
    <div>
      <p className="mb-3 font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground">
        {heading}
      </p>
      <div className="min-w-0 max-w-full overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-3 md:w-full md:flex-wrap md:justify-start">
          {dates.map((date) => {
            const date_key = to_date_key(date);
            const is_selected = date_key === selected_date;
            const is_past = is_past_day(date, today);
            const is_today = to_date_key(date) === to_date_key(today);

            return (
              <button
                key={date_key}
                aria-label={`${is_today ? 'Today' : format_weekday_short(date)} ${format_day_number(date)} ${date.toLocaleDateString('en-GB', { month: 'short' })}`}
                className={[
                  'flex min-w-[4.5rem] shrink-0 snap-start flex-col items-center justify-center rounded-full px-4 py-3 transition-colors duration-200 sm:min-w-20 sm:py-4',
                  is_past
                    ? 'pointer-events-none cursor-not-allowed bg-surface text-foreground opacity-40'
                    : is_selected
                      ? 'cursor-pointer bg-inverse text-primary-foreground shadow-md'
                      : 'cursor-pointer bg-surface text-foreground hover:bg-surface-2',
                ].join(' ')}
                disabled={is_past}
                onClick={() => on_select(date_key, date)}
                type="button"
              >
                <span className="font-sans text-[11px] font-semibold uppercase leading-none tracking-widest sm:text-[13px]">
                  {is_today ? 'Today' : format_weekday_short(date)}
                </span>
                <span className="mt-1 font-serif text-lg font-medium leading-none sm:text-xl">
                  {format_day_number(date)}
                </span>
                <span className="mt-1 font-sans text-[10px] uppercase tracking-wide opacity-70">
                  {date.toLocaleDateString('en-GB', { month: 'short' })}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DateNavigationHeading({
  anchor,
  on_prev,
  on_next,
  on_today,
}: {
  anchor: Date;
  on_prev: () => void;
  on_next: () => void;
  on_today: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap gap-2">
        <button
          className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-4 py-2 font-sans text-sm font-medium text-foreground transition-colors hover:bg-surface"
          onClick={on_today}
          type="button"
        >
          Today
        </button>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <button
          aria-label="Previous dates"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-surface"
          onClick={on_prev}
          type="button"
        >
          ‹
        </button>
        <p className="min-w-0 flex-1 text-center font-sans text-sm font-medium text-foreground sm:min-w-[10rem] sm:flex-none">
          {format_month_year(anchor)}
        </p>
        <button
          aria-label="Next dates"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-surface"
          onClick={on_next}
          type="button"
        >
          ›
        </button>
      </div>
    </div>
  );
}
