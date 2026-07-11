'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState, useTransition } from 'react';

import type { SessionCard } from '@/app/(marketing)/book/schedule-actions';
import type { ManageableClient } from '@/app/(marketing)/staff/membership/actions';
import { load_client_dashboard } from '@/features/client-booking-manager/actions';
import { AttentionTab } from '@/features/client-booking-manager/components/attention-tab';
import { BookingsTab } from '@/features/client-booking-manager/components/bookings-tab';
import { ClientSelector } from '@/features/client-booking-manager/components/client-selector';
import { ManualBookingTab } from '@/features/client-booking-manager/components/manual-booking-tab';
import { ManagerTabNav } from '@/features/client-booking-manager/components/manager-tab-nav';
import { OverviewTab } from '@/features/client-booking-manager/components/overview-tab';
import { RecurringTab } from '@/features/client-booking-manager/components/recurring-tab';
import {
  parse_manager_tab,
  type ClientBookingManagerTab,
} from '@/features/client-booking-manager/format';
import type { ClientDashboardData } from '@/features/client-booking-manager/types';

const EMPTY_DASHBOARD: ClientDashboardData = {
  packages: [],
  bookings: [],
  recurring_rules: [],
  attention: [],
};

type ClientBookingManagerPanelProps = {
  clients: ManageableClient[];
  session_cards: SessionCard[];
  initial_client_id?: string;
  initial_dashboard?: ClientDashboardData | null;
  initial_tab?: ClientBookingManagerTab;
};

export function ClientBookingManagerPanel(props: ClientBookingManagerPanelProps) {
  return (
    <Suspense fallback={<PanelLoadingState />}>
      <ClientBookingManagerPanelInner {...props} />
    </Suspense>
  );
}

function ClientBookingManagerPanelInner({
  clients,
  session_cards,
  initial_client_id = '',
  initial_dashboard = null,
  initial_tab = 'overview',
}: ClientBookingManagerPanelProps) {
  const router = useRouter();
  const search_params = useSearchParams();
  const [selected_client_id, set_selected_client_id] = useState(
    search_params.get('client') ?? initial_client_id,
  );
  const [active_tab, set_active_tab] = useState<ClientBookingManagerTab>(
    parse_manager_tab(search_params.get('tab') ?? initial_tab),
  );
  const [dashboard, set_dashboard] = useState<ClientDashboardData>(
    initial_dashboard ?? EMPTY_DASHBOARD,
  );
  const [loading_dashboard, set_loading_dashboard] = useState(false);
  const [dashboard_error, set_dashboard_error] = useState('');
  const [operation_feedback, set_operation_feedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [, start_transition] = useTransition();

  const sync_url = useCallback(
    (client_id: string, tab: ClientBookingManagerTab) => {
      const params = new URLSearchParams();
      if (client_id) params.set('client', client_id);
      if (tab !== 'overview') params.set('tab', tab);
      const query = params.toString();
      router.replace(query ? `/staff/client-bookings?${query}` : '/staff/client-bookings', {
        scroll: false,
      });
    },
    [router],
  );

  const refresh_dashboard = useCallback(
    async (client_id: string, options?: { silent?: boolean }) => {
      if (!client_id) {
        set_dashboard(EMPTY_DASHBOARD);
        set_dashboard_error('');
        return;
      }

      if (!options?.silent) {
        set_loading_dashboard(true);
      }
      set_dashboard_error('');

      try {
        const data = await load_client_dashboard(client_id);
        set_dashboard(data);
      } catch {
        set_dashboard(EMPTY_DASHBOARD);
        set_dashboard_error('Could not load client booking data. Please try again.');
      } finally {
        if (!options?.silent) {
          set_loading_dashboard(false);
        }
      }
    },
    [],
  );

  function handle_client_select(client_id: string) {
    set_selected_client_id(client_id);
    sync_url(client_id, active_tab);
    void refresh_dashboard(client_id);
  }

  function handle_tab_change(tab: ClientBookingManagerTab) {
    set_active_tab(tab);
    sync_url(selected_client_id, tab);
  }

  function handle_operation_feedback(feedback: { type: 'success' | 'error'; message: string }) {
    set_operation_feedback(feedback);
  }

  function handle_refresh(options?: { silent?: boolean }) {
    start_transition(async () => {
      await refresh_dashboard(selected_client_id, options);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <ClientSelector
        clients={clients}
        on_select={handle_client_select}
        selected_client_id={selected_client_id}
      />

      {!selected_client_id ? (
        <p className="py-10 text-center text-sm text-foreground/60">
          Select a client to manage bookings and recurring prebooks.
        </p>
      ) : (
        <>
          <ManagerTabNav
            active_tab={active_tab}
            attention_count={dashboard.attention.length}
            on_change={handle_tab_change}
          />

          {operation_feedback ? (
            <div
              className={
                operation_feedback.type === 'success'
                  ? 'rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success'
                  : 'rounded-md border border-danger-border bg-danger-surface/40 px-4 py-3 text-sm text-danger-foreground'
              }
              role={operation_feedback.type === 'error' ? 'alert' : 'status'}
            >
              {operation_feedback.message}
            </div>
          ) : null}

          {loading_dashboard ? (
            <PanelLoadingState />
          ) : dashboard_error ? (
            <div className="rounded-md border border-danger-border bg-danger-surface/40 p-5 text-sm text-danger-foreground">
              <p>{dashboard_error}</p>
              <button
                className="mt-3 font-medium underline-offset-2 hover:underline"
                onClick={() => void refresh_dashboard(selected_client_id)}
                type="button"
              >
                Retry load
              </button>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-background p-5 sm:p-6">
              {active_tab === 'overview' ? (
                <OverviewTab
                  dashboard={dashboard}
                  on_open_attention={() => handle_tab_change('attention')}
                />
              ) : null}
              {active_tab === 'bookings' ? (
                <BookingsTab bookings={dashboard.bookings} on_refresh={handle_refresh} />
              ) : null}
              {active_tab === 'manual' ? (
                <ManualBookingTab
                  client_user_id={selected_client_id}
                  on_success={handle_refresh}
                  packages={dashboard.packages}
                  session_cards={session_cards}
                />
              ) : null}
              {active_tab === 'recurring' ? (
                <RecurringTab
                  client_user_id={selected_client_id}
                  on_operation_feedback={handle_operation_feedback}
                  on_refresh={handle_refresh}
                  rules={dashboard.recurring_rules}
                  session_cards={session_cards}
                />
              ) : null}
              {active_tab === 'attention' ? (
                <AttentionTab attention={dashboard.attention} on_refresh={handle_refresh} />
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PanelLoadingState() {
  return <p className="py-8 text-center text-sm text-foreground/60">Loading client data…</p>;
}
