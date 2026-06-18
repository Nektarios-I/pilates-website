'use client';

import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { createClient } from '@/lib/supabase/client';
import { cancel_booking_action } from '../book/actions';
import { signOut } from '../login/actions';

function password_input_cls(has_error?: boolean): string {
  return [
    'block w-full rounded-md border px-4 py-3 text-base text-stone-950 placeholder-stone-400 shadow-sm',
    'transition-colors focus:outline-none focus:ring-1',
    has_error
      ? 'border-red-300 bg-white focus:border-red-500 focus:ring-red-500'
      : 'border-stone-300 bg-white focus:border-stone-950 focus:ring-stone-950',
  ].join(' ');
}

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
        class_type: string;
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
  const [cancelling_id, set_cancelling_id] = useState<string | null>(null);
  const [cancel_errors, set_cancel_errors] = useState<Record<string, string>>({});
  const [cancelled_ids, set_cancelled_ids] = useState<Set<string>>(new Set());
  const [new_password, set_new_password] = useState('');
  const [confirm_password, set_confirm_password] = useState('');
  const [show_new_password, set_show_new_password] = useState(false);
  const [password_loading, set_password_loading] = useState(false);
  const [password_error, set_password_error] = useState<string | undefined>();
  const [password_success, set_password_success] = useState(false);

  const handle_sign_out = async () => {
    start_transition(async () => {
      await signOut();
      router.push('/login');
    });
  };

  const handle_cancel = async (booking_id: string) => {
    set_cancelling_id(booking_id);
    set_cancel_errors((prev) => ({ ...prev, [booking_id]: '' }));

    const result = await cancel_booking_action(booking_id, 'Cancelled by client');

    if (result.success) {
      set_cancelled_ids((prev) => new Set([...prev, booking_id]));
      router.refresh();
    } else {
      set_cancel_errors((prev) => ({ ...prev, [booking_id]: result.error }));
    }
    set_cancelling_id(null);
  };

  const handle_change_password = async (e: React.FormEvent) => {
    e.preventDefault();
    set_password_error(undefined);
    set_password_success(false);

    if (!new_password) {
      set_password_error('Please enter a new password.');
      return;
    }
    if (new_password.length < 8) {
      set_password_error('Password must be at least 8 characters.');
      return;
    }
    if (new_password !== confirm_password) {
      set_password_error('Passwords do not match.');
      return;
    }

    set_password_loading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: new_password });
    set_password_loading(false);

    if (error) {
      if (error.message.toLowerCase().includes('same password')) {
        set_password_error('Your new password must be different from your current password.');
      } else {
        set_password_error(error.message);
      }
      return;
    }

    set_new_password('');
    set_confirm_password('');
    set_password_success(true);
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

  const get_related_row = <T,>(value: T | T[] | null): T | null =>
    Array.isArray(value) ? (value[0] ?? null) : value;

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
                    const package_data = get_related_row(pkg.packages);
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
                                : `${pkg.credits_remaining ?? 0} ${package_data.class_type} credit${
                                    pkg.credits_remaining === 1 ? '' : 's'
                                  } remaining`}
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
                    const session = get_related_row(booking.sessions);
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
                        {!cancelled_ids.has(booking.id) && (
                          <div className="mt-4">
                            <Button
                              disabled={cancelling_id === booking.id}
                              size="sm"
                              variant="secondary"
                              onClick={() => handle_cancel(booking.id)}
                            >
                              {cancelling_id === booking.id ? 'Cancelling…' : 'Cancel booking'}
                            </Button>
                            {cancel_errors[booking.id] && (
                              <p className="mt-2 text-xs text-red-600">{cancel_errors[booking.id]}</p>
                            )}
                          </div>
                        )}
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

            </div>

            {/* Change Password Section */}
            <div className="rounded-md border border-border bg-background p-6">
              <h2 className="text-xl font-semibold text-stone-950">Change password</h2>
              <p className="mt-1 text-sm text-stone-600">
                Update the password you use to sign in with email and password.
              </p>

              {password_success && (
                <div
                  aria-live="polite"
                  className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                  role="status"
                >
                  Your password has been updated.
                </div>
              )}

              {password_error && (
                <div
                  aria-live="polite"
                  className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  role="alert"
                >
                  {password_error}
                </div>
              )}

              <form className="mt-6 space-y-4" noValidate onSubmit={handle_change_password}>
                <div>
                  <label className="block text-sm font-medium text-stone-950" htmlFor="new-password">
                    New password
                  </label>
                  <div className="relative mt-2">
                    <input
                      autoComplete="new-password"
                      className={`pr-11 ${password_input_cls(!!password_error)}`}
                      disabled={password_loading}
                      id="new-password"
                      minLength={8}
                      placeholder="At least 8 characters"
                      type={show_new_password ? 'text' : 'password'}
                      value={new_password}
                      onChange={(e) => set_new_password(e.target.value)}
                    />
                    <button
                      aria-label={show_new_password ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-950"
                      type="button"
                      onClick={() => set_show_new_password((prev) => !prev)}
                    >
                      {show_new_password ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-stone-950"
                    htmlFor="confirm-password"
                  >
                    Confirm new password
                  </label>
                  <input
                    autoComplete="new-password"
                    className={`mt-2 ${password_input_cls(!!password_error)}`}
                    disabled={password_loading}
                    id="confirm-password"
                    minLength={8}
                    placeholder="Re-enter your new password"
                    type={show_new_password ? 'text' : 'password'}
                    value={confirm_password}
                    onChange={(e) => set_confirm_password(e.target.value)}
                  />
                </div>

                <Button disabled={password_loading} size="sm" type="submit" variant="secondary">
                  {password_loading ? 'Updating…' : 'Update password'}
                </Button>
              </form>
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
