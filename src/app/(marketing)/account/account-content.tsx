'use client';

import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import {
  marketingInputClass,
  marketingSuccessBadgeClass,
  marketingWarningBadgeClass,
} from '@/components/ui/marketing-field-styles';
import { Section } from '@/components/ui/section';
import { createClient } from '@/lib/supabase/client';
import {
  cancellation_blocked_message,
  CANCELLATION_POLICY_SHORT,
  client_may_cancel_online,
} from '@/lib/booking/cancellation-policy';
import { display_profile_email } from '@/lib/auth/account-identifiers';
import { cancel_booking_action } from '../book/actions';
import { signOut } from '../login/actions';


interface Profile {
  id: string;
  email: string | null;
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Profile</h2>
                  <p className="mt-1 text-sm text-foreground/70">Your account information</p>
                </div>
                <Button className="w-full sm:w-auto" disabled onClick={() => {}} size="sm" variant="secondary">
                  Edit profile
                </Button>
              </div>

              <dl className="mt-6 space-y-4 text-sm">
                <div>
                  <dt className="font-medium text-foreground">Name</dt>
                  <dd className="mt-1 text-foreground/80">
                    {profile?.full_name || 'Not provided yet'}
                  </dd>
                </div>

                <div>
                  <dt className="font-medium text-foreground">Email</dt>
                  <dd className="mt-1 text-foreground/80">
                    {display_profile_email(profile?.email, user.email) ?? 'Not provided yet'}
                  </dd>
                </div>

                <div>
                  <dt className="font-medium text-foreground">Phone</dt>
                  <dd className="mt-1 text-foreground/80">{profile?.phone || 'Not provided yet'}</dd>
                </div>

                <div>
                  <dt className="font-medium text-foreground">Account status</dt>
                  <dd className="mt-1">
                    <span className={marketingSuccessBadgeClass}>
                      {profile?.status || 'active'}
                    </span>
                  </dd>
                </div>

                {roles.length > 0 && (
                  <div>
                    <dt className="font-medium text-foreground">Roles</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {roles.map((role) => (
                        <span
                          className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground/80"
                          key={role.role}
                        >
                          {role.role}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>

            </div>

            {/* Active Packages Section */}
            <div className="rounded-md border border-border bg-background p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Active Packages</h2>
                  <p className="mt-1 text-sm text-foreground/70">
                    Your current memberships and credits
                  </p>
                </div>
                <ButtonLink className="w-full sm:w-auto" href="/pricing" variant="secondary">
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
                        className="rounded-md border border-border bg-surface p-4"
                        key={pkg.id}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{package_data.name}</h3>
                            <p className="mt-1 text-sm text-foreground/70">
                              {package_data.package_type === 'unlimited'
                                ? 'Unlimited classes'
                                : `${pkg.credits_remaining ?? 0} ${package_data.class_type} credit${
                                    pkg.credits_remaining === 1 ? '' : 's'
                                  } remaining`}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/60">
                              <span>Started {format_date(pkg.starts_at)}</span>
                              {pkg.expires_at && <span>Expires {format_date(pkg.expires_at)}</span>}
                            </div>
                          </div>
                          <span className={marketingSuccessBadgeClass}>
                            {pkg.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-md bg-surface p-8 text-center">
                  <p className="text-sm text-foreground/70">No active packages</p>
                  <p className="mt-2 text-xs text-foreground/60">
                    Purchase a package to start booking classes
                  </p>
                </div>
              )}

            </div>

            {/* Upcoming Bookings Section */}
            <div className="rounded-md border border-border bg-background p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Upcoming Bookings</h2>
                  <p className="mt-1 text-sm text-foreground/70">Your scheduled classes</p>
                  <p className="mt-2 text-xs text-foreground/60">{CANCELLATION_POLICY_SHORT}</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                  <ButtonLink className="w-full sm:w-auto" href="/book" variant="secondary">
                    Book class
                  </ButtonLink>
                  <ButtonLink className="w-full sm:w-auto" href="/account/bookings" variant="secondary">
                    All bookings
                  </ButtonLink>
                </div>
              </div>

              {upcoming_bookings.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {upcoming_bookings.map((booking) => {
                    const session = get_related_row(booking.sessions);
                    if (!session) return null;

                    const may_cancel =
                      booking.status === 'booked' &&
                      client_may_cancel_online(session.starts_at);

                    return (
                      <div
                        className="rounded-md border border-border bg-surface p-4"
                        key={booking.id}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{session.title}</h3>
                            <p className="mt-1 text-sm text-foreground/70">
                              {format_session_type(session.session_type)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/60">
                              <span>{format_date(session.starts_at)}</span>
                              <span>
                                {format_time(session.starts_at)} - {format_time(session.ends_at)}
                              </span>
                              {session.location && <span>{session.location}</span>}
                            </div>
                          </div>
                          <span
                            className={
                              booking.status === 'waitlisted'
                                ? marketingWarningBadgeClass
                                : marketingSuccessBadgeClass
                            }
                          >
                            {booking.status}
                          </span>
                        </div>
                        {!cancelled_ids.has(booking.id) && booking.status === 'booked' ? (
                          <div className="mt-4">
                            {may_cancel ? (
                              <Button
                                className="w-full sm:w-auto"
                                disabled={cancelling_id === booking.id}
                                size="sm"
                                variant="secondary"
                                onClick={() => handle_cancel(booking.id)}
                              >
                                {cancelling_id === booking.id ? 'Cancelling…' : 'Cancel booking'}
                              </Button>
                            ) : (
                              <p className="text-xs text-foreground/60">
                                {cancellation_blocked_message()}
                              </p>
                            )}
                            {cancel_errors[booking.id] ? (
                              <p className="mt-2 text-xs text-destructive">{cancel_errors[booking.id]}</p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-md bg-surface p-8 text-center">
                  <p className="text-sm text-foreground/70">No upcoming bookings</p>
                  <p className="mt-2 text-xs text-foreground/60">Book a class to get started</p>
                </div>
              )}

            </div>

            {/* Change Password Section */}
            <div className="rounded-md border border-border bg-background p-6">
              <h2 className="text-xl font-semibold text-foreground">Change password</h2>
              <p className="mt-1 text-sm text-foreground/70">
                Update the password you use to login with email and password.
              </p>

              {password_success && (
                <div
                  aria-live="polite"
                  className="mt-4 rounded-md border border-success-border bg-success-surface p-4 text-sm text-success"
                  role="status"
                >
                  Your password has been updated.
                </div>
              )}

              {password_error && (
                <div
                  aria-live="polite"
                  className="mt-4 rounded-md border border-destructive-border bg-destructive-surface p-4 text-sm text-destructive"
                  role="alert"
                >
                  {password_error}
                </div>
              )}

              <form className="mt-6 space-y-4" noValidate onSubmit={handle_change_password}>
                <div>
                  <label className="block text-sm font-medium text-foreground" htmlFor="new-password">
                    New password
                  </label>
                  <div className="relative mt-2">
                    <input
                      autoComplete="new-password"
                      className={`pr-14 ${marketingInputClass(!!password_error)}`}
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
                      className="absolute right-0 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-foreground/60 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      type="button"
                      onClick={() => set_show_new_password((prev) => !prev)}
                    >
                      {show_new_password ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-foreground"
                    htmlFor="confirm-password"
                  >
                    Confirm new password
                  </label>
                  <input
                    autoComplete="new-password"
                    className={`mt-2 ${marketingInputClass(!!password_error)}`}
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
              <h2 className="text-xl font-semibold text-foreground">Account Actions</h2>
              <p className="mt-1 text-sm text-foreground/70">Manage your session</p>

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
