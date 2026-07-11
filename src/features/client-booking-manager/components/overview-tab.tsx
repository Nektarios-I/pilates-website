import {
  failure_code_label,
  format_booking_source,
  format_session_datetime,
  health_status_badge_class,
  health_status_label,
} from '@/features/client-booking-manager/format';
import {
  filter_client_bookings,
  summarize_recurring_health,
} from '@/features/client-booking-manager/booking-filters';
import type { ClientDashboardData } from '@/features/client-booking-manager/types';

type OverviewTabProps = {
  dashboard: ClientDashboardData;
  on_open_attention: () => void;
};

export function OverviewTab({ dashboard, on_open_attention }: OverviewTabProps) {
  const upcoming = filter_client_bookings(dashboard.bookings, 'upcoming');
  const active_rules = dashboard.recurring_rules.filter((rule) => rule.status === 'active');
  const health = summarize_recurring_health(
    active_rules.flatMap((rule) => rule.forecast ?? []),
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming bookings" value={String(upcoming.length)} />
        <StatCard label="Active packages" value={String(dashboard.packages.length)} />
        <StatCard label="Active recurring rules" value={String(active_rules.length)} />
        <StatCard
          label="Attention items"
          value={String(dashboard.attention.length)}
          on_click={dashboard.attention.length > 0 ? on_open_attention : undefined}
        />
      </section>

      <section className="rounded-md border border-border bg-background p-5">
        <h2 className="text-sm font-semibold text-foreground">Active packages</h2>
        {dashboard.packages.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">No active packages for this client.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {dashboard.packages.map((pkg) => (
              <li
                key={pkg.user_package_id}
                className="flex flex-col gap-1 rounded-md border border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{pkg.package_name}</p>
                  <p className="text-xs text-foreground/60">
                    {pkg.class_type} · {pkg.package_type}
                  </p>
                </div>
                <p className="text-sm text-foreground/80">
                  {pkg.credits_remaining === null ? 'Unlimited' : `${pkg.credits_remaining} credits`}
                  {pkg.expires_at
                    ? ` · expires ${new Date(pkg.expires_at).toLocaleDateString('en-GB')}`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-md border border-border bg-background p-5">
        <h2 className="text-sm font-semibold text-foreground">Recurring health</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <HealthPill count={health.ready} status="ready" />
          <HealthPill count={health.insufficient_tokens} status="insufficient_tokens" />
          <HealthPill count={health.failed} status="failed" />
        </div>
      </section>

      <section className="rounded-md border border-border bg-background p-5">
        <h2 className="text-sm font-semibold text-foreground">Next bookings</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">No upcoming bookings.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {upcoming.slice(0, 5).map((booking) => (
              <li
                key={booking.id}
                className="rounded-md border border-border/70 px-4 py-3 text-sm text-foreground/80"
              >
                <p className="font-medium text-foreground">{booking.session_title}</p>
                <p className="mt-1">{format_session_datetime(booking.session_starts_at)}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-foreground/60">
                  {booking.status} · {format_booking_source(booking.booking_source)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {dashboard.attention.length > 0 ? (
        <section className="rounded-md border border-danger-border bg-danger-surface/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Needs attention</h2>
            <button
              className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
              onClick={on_open_attention}
              type="button"
            >
              View all
            </button>
          </div>
          <ul className="mt-4 space-y-3">
            {dashboard.attention.slice(0, 3).map((item) => (
              <li key={item.id} className="text-sm text-foreground/80">
                <p className="font-medium text-foreground">
                  {format_session_datetime(item.occurrence_starts_at)}
                </p>
                <p className="mt-1">
                  {failure_code_label(item.failure_code)}
                  {item.failure_message ? ` — ${item.failure_message}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  on_click,
}: {
  label: string;
  value: string;
  on_click?: () => void;
}) {
  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </>
  );

  if (on_click) {
    return (
      <button
        className="rounded-md border border-border bg-background p-4 text-left transition-colors hover:bg-surface"
        onClick={on_click}
        type="button"
      >
        {content}
      </button>
    );
  }

  return <div className="rounded-md border border-border bg-background p-4">{content}</div>;
}

function HealthPill({
  count,
  status,
}: {
  count: number;
  status: 'ready' | 'insufficient_tokens' | 'failed';
}) {
  return (
    <span className={health_status_badge_class(status)}>
      {count} {health_status_label(status)}
    </span>
  );
}
