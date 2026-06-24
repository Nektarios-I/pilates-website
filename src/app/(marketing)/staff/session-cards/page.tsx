import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Container } from '@/components/ui/container';
import { createPageMetadata } from '@/lib/metadata';
import { createClient } from '@/lib/supabase/server';

import { list_session_cards_for_staff } from './actions';
import { SessionCardsPanel } from './session-cards-panel';

export const metadata = createPageMetadata({
  title: 'Session Cards',
  description: 'Manage the class cards shown on the booking page.',
  path: '/staff/session-cards',
});

async function is_admin_or_owner(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  return (roles ?? []).some((row) => row.role === 'owner' || row.role === 'admin');
}

export default async function SessionCardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  if (!(await is_admin_or_owner())) redirect('/account');

  const cards = await list_session_cards_for_staff();

  return (
    <Container>
      <div className="py-8 sm:py-12">
        <div className="mb-6">
          <Link
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-950"
            href="/account"
          >
            Back to account
          </Link>
        </div>

        <div className="mb-8 max-w-xl">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
            Owner / Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-stone-950 sm:text-4xl">
            Session cards
          </h1>
          <p className="mt-3 text-base leading-7 text-stone-600">
            Add, edit, deactivate, or remove the class cards clients see before choosing a
            booking slot.
          </p>
        </div>

        <SessionCardsPanel cards={cards} />
      </div>
    </Container>
  );
}
