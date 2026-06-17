import Link from 'next/link';

import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { createClient } from '@/lib/supabase/server';
import { createPageMetadata } from '@/lib/metadata';

import { BookingPanel } from './booking-panel';
import type { PackageItem, SessionItem } from './booking-panel';

export const metadata = createPageMetadata({
  title: 'Book a Class',
  description: 'Browse upcoming Pilates sessions and book your spot.',
  path: '/book',
});

export default async function BookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Unauthenticated state ────────────────────────────────────────────────
  if (!user) {
    return (
      <Section className="bg-background">
        <Container>
          <div className="mx-auto max-w-lg text-center">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              Booking
            </p>
            <h1 className="mt-4 text-4xl font-semibold text-stone-950 sm:text-5xl">
              Book a class
            </h1>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              Sign in to your account to browse upcoming sessions and reserve your spot.
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

  // ── Fetch upcoming sessions ──────────────────────────────────────────────
  const now = new Date().toISOString();

  const { data: raw_sessions } = await supabase
    .from('sessions')
    .select('id, title, description, session_type, starts_at, ends_at, capacity, credits_required, location, instructor_id')
    .eq('status', 'scheduled')
    .gt('starts_at', now)
    .order('starts_at', { ascending: true })
    .limit(30);

  // ── Resolve instructor names ─────────────────────────────────────────────
  const instructor_ids = [
    ...new Set((raw_sessions ?? []).map((s) => s.instructor_id).filter(Boolean) as string[]),
  ];

  const instructor_map: Record<string, string> = {};
  if (instructor_ids.length > 0) {
    const { data: instructors } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', instructor_ids);

    (instructors ?? []).forEach((p) => {
      if (p.full_name) instructor_map[p.id] = p.full_name;
    });
  }

  // ── Fetch confirmed booking counts for each session ─────────────────────
  const session_ids = (raw_sessions ?? []).map((s) => s.id);
  const count_map: Record<string, number> = {};

  if (session_ids.length > 0) {
    const { data: booking_counts } = await supabase
      .from('bookings')
      .select('session_id')
      .in('session_id', session_ids)
      .eq('status', 'booked');

    (booking_counts ?? []).forEach((b) => {
      count_map[b.session_id] = (count_map[b.session_id] ?? 0) + 1;
    });
  }

  const sessions: SessionItem[] = (raw_sessions ?? []).map((s) => ({
    id:               s.id,
    title:            s.title,
    description:      s.description ?? null,
    session_type:     s.session_type,
    starts_at:        s.starts_at,
    ends_at:          s.ends_at,
    capacity:         s.capacity,
    credits_required: s.credits_required,
    location:         s.location ?? null,
    instructor_name:  s.instructor_id ? (instructor_map[s.instructor_id] ?? null) : null,
    confirmed_count:  count_map[s.id] ?? 0,
  }));

  // ── Fetch user's active packages ─────────────────────────────────────────
  // We fetch with a join to get the package name and type in one query.
  const { data: raw_packages } = await supabase
    .from('user_packages')
    .select('id, credits_remaining, expires_at, status, packages(name, package_type)')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const packages: PackageItem[] = (raw_packages ?? [])
    .filter((p) => {
      if (p.expires_at && new Date(p.expires_at) < new Date()) return false;
      const pkg = Array.isArray(p.packages) ? p.packages[0] : p.packages;
      if (!pkg) return false;
      if (pkg.package_type !== 'unlimited' && (p.credits_remaining ?? 0) <= 0) return false;
      return true;
    })
    .map((p) => {
      const pkg = Array.isArray(p.packages) ? p.packages[0] : p.packages;
      return {
        id:                p.id,
        credits_remaining: p.credits_remaining,
        expires_at:        p.expires_at ?? null,
        package_name:      pkg?.name ?? 'Unknown package',
        package_type:      pkg?.package_type ?? 'credit_pack',
      };
    });

  return (
    <>
      {/* Page header */}
      <Section className="bg-background">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              Booking
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-stone-950 sm:text-5xl">
              Book a class
            </h1>
            <p className="mt-4 text-lg leading-8 text-stone-700">
              Select a session below to reserve your spot. Credits are deducted from your package
              when the booking is confirmed.
            </p>
          </div>
        </Container>
      </Section>

      {/* Booking section */}
      <Section className="bg-muted">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            {/* Session list */}
            <div>
              <h2 className="mb-6 text-xl font-semibold text-stone-950">Upcoming sessions</h2>
              <BookingPanel packages={packages} sessions={sessions} />
            </div>

            {/* Sidebar: package summary */}
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
                    {packages.map((p) => (
                      <li key={p.id} className="rounded-md border border-stone-100 bg-stone-50 p-3">
                        <p className="text-sm font-medium text-stone-950">{p.package_name}</p>
                        <p className="mt-0.5 text-xs text-stone-500">
                          {p.package_type === 'unlimited'
                            ? 'Unlimited classes'
                            : `${p.credits_remaining ?? 0} credit${p.credits_remaining !== 1 ? 's' : ''} remaining`}
                          {p.expires_at && (
                            <> · expires {new Date(p.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</>
                          )}
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
