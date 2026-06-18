import Link from 'next/link';

import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { createClient } from '@/lib/supabase/server';
import { createPageMetadata } from '@/lib/metadata';

import { BookingCalendar } from './booking-calendar';
import type { PackageItem } from './booking-panel';
import { get_day_schedule, get_session_cards, get_slots_for_day } from './schedule-actions';
import { to_date_key } from '@/lib/schedule/studio-hours';

export const metadata = createPageMetadata({
  title: 'Book a Class',
  description: 'Choose a day and time for your reformer Pilates session.',
  path: '/book',
});

function package_has_credits(
  package_type: string,
  credits_remaining: number | null,
): boolean {
  if (package_type === 'unlimited' || package_type === 'monthly') return true;
  return (credits_remaining ?? 0) > 0;
}

export default async function BookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Section className="bg-background">
        <Container>
          <div className="mx-auto max-w-lg text-center">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              Booking
            </p>
            <h1 className="mt-4 text-4xl font-semibold text-stone-950 sm:text-5xl">
              Book a session
            </h1>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              Sign in to choose a day and reserve your reformer class.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <ButtonLink href="/login">Sign in to book</ButtonLink>
              <ButtonLink href="/pricing" variant="secondary">
                View pricing
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  const { data: raw_packages } = await supabase
    .from('user_packages')
    .select('id, credits_remaining, expires_at, status, packages(name, class_type, package_type)')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const packages: PackageItem[] = (raw_packages ?? [])
    .filter((entry) => {
      if (entry.expires_at && new Date(entry.expires_at) < new Date()) return false;
      const pkg = Array.isArray(entry.packages) ? entry.packages[0] : entry.packages;
      if (!pkg) return false;
      return package_has_credits(pkg.package_type, entry.credits_remaining);
    })
    .map((entry) => {
      const pkg = Array.isArray(entry.packages) ? entry.packages[0] : entry.packages;
      return {
        id: entry.id,
        credits_remaining: entry.credits_remaining,
        expires_at: entry.expires_at ?? null,
        package_name: pkg?.name ?? 'Package',
        class_type: pkg?.class_type ?? 'reformer',
        package_type: pkg?.package_type ?? 'credit_pack',
      };
    });

  const today_key = to_date_key(new Date());
  const [session_cards, initial_schedule] = await Promise.all([
    get_session_cards(),
    get_day_schedule(today_key),
  ]);
  const initial_card = session_cards[0] ?? null;
  const initial_slots = initial_card
    ? await get_slots_for_day(today_key, initial_card.session_type, initial_card.duration_minutes)
    : [];

  return (
    <>
      <Section className="bg-background">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              Booking
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-stone-950 sm:text-5xl">
              Book a session
            </h1>
            <p className="mt-4 text-lg leading-8 text-stone-700">
              Choose a class, then pick an available slot.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="bg-muted">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <BookingCalendar
              initial_date={today_key}
              initial_schedule={initial_schedule}
              initial_slots={initial_slots}
              packages={packages}
              session_cards={session_cards}
            />

            <aside>
              <div className="rounded-md border border-border bg-surface p-6">
                <h2 className="text-sm font-semibold text-stone-950">Your packages</h2>

                {packages.length === 0 ? (
                  <div className="mt-4">
                    <p className="text-sm text-stone-600">No active packages.</p>
                    <Link
                      className="mt-3 block text-sm font-medium text-stone-700 underline underline-offset-4 hover:text-stone-950"
                      href="/pricing"
                    >
                      View pricing
                    </Link>
                  </div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {packages.map((pkg) => (
                      <li key={pkg.id} className="rounded-md border border-stone-100 bg-stone-50 p-3">
                        <p className="text-sm font-medium text-stone-950">{pkg.package_name}</p>
                        <p className="mt-0.5 text-xs text-stone-500">
                          {pkg.package_type === 'unlimited' || pkg.package_type === 'monthly'
                            ? 'Unlimited classes'
                            : `${pkg.credits_remaining ?? 0} credit${pkg.credits_remaining !== 1 ? 's' : ''} remaining`}
                          {pkg.expires_at
                            ? ` · expires ${new Date(pkg.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                            : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-5 border-t border-stone-100 pt-4">
                  <Link
                    className="text-sm font-medium text-stone-700 underline underline-offset-4 hover:text-stone-950"
                    href="/account"
                  >
                    View account
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
