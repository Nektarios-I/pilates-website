import {
  CLIENT_BOOKING_MANAGER_TABS,
  type ClientBookingManagerTab,
} from '@/features/client-booking-manager/format';

const TAB_LABELS: Record<ClientBookingManagerTab, string> = {
  overview: 'Overview',
  bookings: 'Client Bookings',
  manual: 'Manual Booking',
  recurring: 'Recurring Prebooks',
  attention: 'Failed / Attention',
};

type ManagerTabNavProps = {
  active_tab: ClientBookingManagerTab;
  on_change: (tab: ClientBookingManagerTab) => void;
  attention_count?: number;
};

export function ManagerTabNav({ active_tab, on_change, attention_count = 0 }: ManagerTabNavProps) {
  return (
    <nav aria-label="Client booking manager sections" className="flex flex-wrap gap-2">
      {CLIENT_BOOKING_MANAGER_TABS.map((tab) => {
        const is_active = tab === active_tab;
        const label =
          tab === 'attention' && attention_count > 0
            ? `${TAB_LABELS[tab]} (${attention_count})`
            : TAB_LABELS[tab];

        return (
          <button
            key={tab}
            aria-current={is_active ? 'page' : undefined}
            className={[
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              is_active
                ? 'bg-foreground text-background'
                : 'border border-border bg-background text-foreground/80 hover:text-foreground',
            ].join(' ')}
            onClick={() => on_change(tab)}
            type="button"
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
