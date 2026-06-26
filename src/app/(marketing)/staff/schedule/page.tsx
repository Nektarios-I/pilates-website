import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Container } from '@/components/ui/container';
import { createClient } from '@/lib/supabase/server';
import { createPageMetadata } from '@/lib/metadata';

import { ScheduleEditorPanel } from './schedule-editor-panel';

export const metadata = createPageMetadata({
  title: 'Studio Schedule',
  description: 'Set working hours and breaks for each calendar day.',
  path: '/staff/schedule',
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

export default async function StudioSchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  if (!(await is_admin_or_owner())) redirect('/account');

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

        <div className="mb-8 max-w-xl">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-foreground/60">
            Owner / Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Studio schedule
          </h1>
          <p className="mt-3 text-base leading-7 text-foreground/70">
            Choose a day and set open hours and breaks. Defaults are Mon–Fri 6:00–12:00 & 15:00–20:00,
            Sat 7:00–11:00, Sun closed.
          </p>
        </div>

        <ScheduleEditorPanel />
      </div>
    </Container>
  );
}
