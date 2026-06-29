import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Container } from '@/components/ui/container';
import { createClient } from '@/lib/supabase/server';
import { createPageMetadata } from '@/lib/metadata';

import { list_packages_for_staff } from './actions';
import { PricingPanel } from './pricing-panel';

export const metadata = createPageMetadata({
  title: 'Manage Pricing',
  description: 'Update class package prices shown on the website and in membership tools.',
  path: '/staff/pricing',
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

export default async function ManagePricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  if (!(await is_admin_or_owner())) redirect('/account');

  const packages = await list_packages_for_staff();

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
            Staff portal
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Manage pricing
          </h1>
          <p className="mt-3 text-base leading-7 text-foreground/70">
            Update package prices or add a new package. Active packages appear on the public
            pricing page and in membership tools.
          </p>
        </div>

        <div className="max-w-4xl rounded-md border border-border bg-surface p-6 sm:p-8">
          <PricingPanel
            key={packages
              .map((pkg) => pkg.id)
              .sort()
              .join(',')}
            packages={packages}
          />
        </div>
      </div>
    </Container>
  );
}
