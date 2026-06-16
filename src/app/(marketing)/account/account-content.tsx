'use client';

import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { signOut } from '../login/actions';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Role {
  role: string;
}

interface ActivePackage {
  id: string;
  credits_remaining: number | null;
  starts_at: string;
  expires_at: string | null;
  status: string;
  packages:
    | {
        id: string;
        name: string;
        package_type: string;
      }[]
    | null;
}

interface UpcomingBooking {
  id: string;
  status: string;
  created_at: string;
  sessions:
    | {
        id: string;
        title: string;
        starts_at: string;
        ends_at: string;
        session_type: string;
        location: string | null;
      }[]
    | null;
}

interface AccountContentProps {
  user: User;
  profile: Profile | null;
  roles: Role[];
  active_packages: ActivePackage[];
  upcoming_bookings: UpcomingBooking[];
}

export function AccountContent({
  user,
  profile,
  roles,
  active_packages,
  upcoming_bookings,
}: AccountContentProps) {
  const router = useRouter();
  const [is_pending, start_transition] = useTransition();

  const handle_sign_out = async () => {
    start_transition(async () => {
      await signOut();
      router.push('/login');
    });
  };

  const format_date = (date_string: string) => {
    return new Date(date_string).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const format_time = (date_string: string) => {
    return new Date(date_string).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const format_session_type = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <>
      <Section className="bg-surface">
        <Container>
          <div className="max-w-3xl space-y-8">
            {/* Profile Section */}
            <div className="rounded-md border border-border bg-background p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-stone-950">Profile</h2>
                  <p className="mt-1 text-sm text-stone-600">Your account information</p>
                </div>
                <Button disabled onClick={() => {}} size="sm" variant="secondary">
                  Edit profile
                </Button>
              </div>

              <dl className="mt-6 space-y-4 text-sm">
                <div>
                  <dt className="font-medium text-stone-950">Name</dt>
                  <dd className="mt-1 text-stone-700">
                    {profile?.full_name || 'Not provided yet'}
                  </dd>
                </div>

                <div>
                  <dt className="font-medium text-stone-950">Email</dt>
                  <dd className="mt-1 text-stone-700">{user.email}</dd>
                </div>

                <div>
                  <dt className="font-medium text-stone-950">Phone</dt>
                  <dd className="mt-1 text-stone-700">{profile?.phone || 'Not provided yet'}</dd>
                </div>

                <div>
                  <dt className="font-medium text-stone-950">Account status</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                      {profile?.status || 'active'}
                    </span>
                  </dd>
                </div>

                {roles.length > 0 && (
                  <div>
                    <dt className="font-medium text-stone-950">Roles</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {roles.map((role) => (
                        <span
                          className="inline-flex items-center rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700"
                          key={role.role}
                        >
                          {role.role}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 rounded-md bg-blue-50 p-4">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Profile editing functionality will be added in a future
                  update. Contact the studio to update your information.
                </p>
              </div>
            </div>

            {/* Active Packages Section */}
            <div className="rounded-md border border-border bg-background p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-stone-950">Active Packages</h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Your current memberships and credits
                  </p>
                </div>
                <ButtonLink href="/pricing" variant="secondary">
                  Buy package
                </ButtonLink>
              </div>

              {active_packages.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {active_packages.map((pkg) => {
                    const package_data = pkg.packages?.[0];
                    if (!package_data) return null;

                    return (
                      <div
                        className="rounded-md border border-stone-200 bg-stone-50 p-4"
                        key={pkg.id}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-stone-950">{package_data.name}</h3>
                            <p className="mt-1 text-sm text-stone-600">
                              {package_data.package_type === 'unlimited'
                                ? 'Unlimited classes'
                                : `${pkg.credits_remaining || 0} credits remaining`}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                              <span>Started {format_date(pkg.starts_at)}</span>
                              {pkg.expires_at && <span>Expires {format_date(pkg.expires_at)}</span>}
                            </div>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            {pkg.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-md bg-stone-50 p-8 text-center">
                  <p className="text-sm text-stone-600">No active packages</p>
                  <p className="mt-2 text-xs text-stone-500">
                    Purchase a package to start booking classes
                  </p>
                </div>
              )}

              <div className="mt-6 rounded-md bg-blue-50 p-4">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Package purchase functionality will be added in a future
                  update. Contact the studio to purchase packages.
                </p>
              </div>
            </div>

            {/* Upcoming Bookings Section */}
            <div className="rounded-md border border-border bg-background p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-stone-950">Upcoming Bookings</h2>
                  <p className="mt-1 text-sm text-stone-600">Your scheduled classes</p>
                </div>
                <ButtonLink href="/book" variant="secondary">
                  Book class
                </ButtonLink>
              </div>

              {upcoming_bookings.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {upcoming_bookings.map((booking) => {
                    const session = booking.sessions?.[0];
                    if (!session) return null;

                    return (
                      <div
                        className="rounded-md border border-stone-200 bg-stone-50 p-4"
                        key={booking.id}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-stone-950">{session.title}</h3>
                            <p className="mt-1 text-sm text-stone-600">
                              {format_session_type(session.session_type)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                              <span>{format_date(session.starts_at)}</span>
                              <span>
                                {format_time(session.starts_at)} - {format_time(session.ends_at)}
                              </span>
                              {session.location && <span>{session.location}</span>}
                            </div>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                            {booking.status}
                          </span>
                        </div>
                        <div className="mt-4">
                          <Button disabled size="sm" variant="secondary">
                            Cancel booking
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-md bg-stone-50 p-8 text-center">
                  <p className="text-sm text-stone-600">No upcoming bookings</p>
                  <p className="mt-2 text-xs text-stone-500">Book a class to get started</p>
                </div>
              )}

              <div className="mt-6 rounded-md bg-blue-50 p-4">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Booking and cancellation functionality will be added in a
                  future update. Contact the studio to book or cancel classes.
                </p>
              </div>
            </div>

            {/* Sign Out Section */}
            <div className="rounded-md border border-border bg-background p-6">
              <h2 className="text-xl font-semibold text-stone-950">Account Actions</h2>
              <p className="mt-1 text-sm text-stone-600">Manage your session</p>

              <div className="mt-6">
                <Button disabled={is_pending} variant="secondary" onClick={handle_sign_out}>
                  {is_pending ? 'Signing out...' : 'Sign out'}
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
