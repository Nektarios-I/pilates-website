import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Container } from '@/components/ui/container';
import { ClientBookingManagerPanel } from '@/features/client-booking-manager/client-booking-manager-panel';
import { parse_manager_tab } from '@/features/client-booking-manager/format';
import {
  caller_has_staff_access,
} from '@/features/client-booking-manager/staff-access';
import {
  load_client_dashboard,
  load_manager_clients,
  load_manager_session_cards,
} from '@/features/client-booking-manager/actions';
import { createPageMetadata } from '@/lib/metadata';
import { createClient } from '@/lib/supabase/server';

export const metadata = createPageMetadata({
  title: 'Client Booking Manager',
  description:
    'Manage manual bookings, recurring prebooks, and client booking issues for studio clients.',
  path: '/staff/client-bookings',
});

type PageProps = {
  searchParams: Promise<{ client?: string; tab?: string }>;
};

async function resolve_page_access(): Promise<{ allowed: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { allowed: false };

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const role_values = (roles ?? []).map((row) => row.role);
  return { allowed: caller_has_staff_access(role_values) };
}

export default async function StaffClientBookingsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const access = await resolve_page_access();
  if (!access.allowed) redirect('/account');

  const params = await searchParams;
  const initial_client_id = params.client ?? '';
  const [clients, session_cards, initial_dashboard] = await Promise.all([
    load_manager_clients(),
    load_manager_session_cards(),
    initial_client_id ? load_client_dashboard(initial_client_id) : Promise.resolve(null),
  ]);

  return (
    <Container>
      <div className="py-8 sm:py-12">
        <div className="mb-6">
          <Link
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground"
            href="/account"
          >
            Back to account
          </Link>
        </div>

        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-foreground/60">
            Staff
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Client Booking Manager
          </h1>
          <p className="mt-3 text-base leading-7 text-foreground/70">
            Manage manual bookings, recurring prebooks, and client booking issues.
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-6 sm:p-8">
          <ClientBookingManagerPanel
            clients={clients}
            initial_client_id={initial_client_id}
            initial_dashboard={initial_dashboard}
            initial_tab={parse_manager_tab(params.tab)}
            session_cards={session_cards}
          />
        </div>
      </div>
    </Container>
  );
}
