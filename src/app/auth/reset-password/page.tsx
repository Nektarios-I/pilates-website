'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

// This page is reached after the user clicks a password-reset link in their
// email. The /auth/callback route exchanges the code and establishes a
// recovery session before redirecting here. Once the user submits their new
// password, supabase.auth.updateUser() upgrades the session to a full session.

function input_cls(): string {
  return [
    'block w-full rounded-md border border-stone-300 bg-white px-4 py-3 text-base text-stone-950',
    'placeholder-stone-400 shadow-sm transition-colors focus:border-stone-950 focus:outline-none',
    'focus:ring-1 focus:ring-stone-950',
  ].join(' ');
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, set_password] = useState('');
  const [confirm, set_confirm] = useState('');
  const [show_password, set_show_password] = useState(false);
  const [is_loading, set_is_loading] = useState(false);
  const [error, set_error] = useState<string | undefined>();
  const [has_session, set_has_session] = useState<boolean | null>(null);

  // Verify the recovery session exists. If not, the user probably landed here
  // directly without going through the reset-password email link.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      set_has_session(!!session);
    });
  }, []);

  async function handle_submit(e: React.FormEvent) {
    e.preventDefault();
    set_error(undefined);

    if (!password) {
      set_error('Please enter a new password.');
      return;
    }
    if (password.length < 8) {
      set_error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      set_error('Passwords do not match.');
      return;
    }

    set_is_loading(true);
    const supabase = createClient();
    const { error: update_error } = await supabase.auth.updateUser({ password });
    set_is_loading(false);

    if (update_error) {
      if (update_error.message.toLowerCase().includes('same password')) {
        set_error('Your new password must be different from your current password.');
      } else {
        set_error(update_error.message);
      }
    } else {
      router.push('/login?message=password_updated');
    }
  }

  // Loading — waiting for session check
  if (has_session === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-stone-500">Loading…</p>
      </div>
    );
  }

  // No session — link was invalid or already used
  if (!has_session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
            Password reset
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-stone-950">Link expired</h1>
          <p className="mt-4 text-base leading-7 text-stone-700">
            This password reset link is invalid or has already been used. Request a new one from
            the sign-in page.
          </p>
          <a
            className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-stone-700 underline underline-offset-4 hover:text-stone-950"
            href="/login"
          >
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">Account</p>
          <h1 className="mt-4 text-3xl font-semibold text-stone-950">Set a new password</h1>
          <p className="mt-4 text-base leading-7 text-stone-700">
            Choose a strong password of at least 8 characters.
          </p>
        </div>

        <div className="mt-10 rounded-md border border-border bg-surface p-6 sm:p-8">
          {error && (
            <div
              aria-live="polite"
              className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}

          <form noValidate onSubmit={handle_submit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-950" htmlFor="new-password">
                  New password
                </label>
                <div className="relative mt-2">
                  <input
                    autoComplete="new-password"
                    className={`pr-14 ${input_cls()}`}
                    disabled={is_loading}
                    id="new-password"
                    minLength={8}
                    placeholder="At least 8 characters"
                    type={show_password ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => set_password(e.target.value)}
                  />
                  <button
                    aria-label={show_password ? 'Hide password' : 'Show password'}
                    className="absolute right-0 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-stone-500 hover:text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                    type="button"
                    onClick={() => set_show_password((p) => !p)}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.75}
                      viewBox="0 0 24 24"
                    >
                      {show_password ? (
                        <>
                          <path
                            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      ) : (
                        <>
                          <path
                            d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            x1="1"
                            x2="23"
                            y1="1"
                            y2="23"
                          />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-stone-950"
                  htmlFor="confirm-password"
                >
                  Confirm password
                </label>
                <input
                  autoComplete="new-password"
                  className={`mt-2 ${input_cls()}`}
                  disabled={is_loading}
                  id="confirm-password"
                  placeholder="Repeat your password"
                  type={show_password ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => set_confirm(e.target.value)}
                />
              </div>

              <button
                className={[
                  'inline-flex w-full items-center justify-center rounded-md border px-6 py-3 text-base font-medium transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950',
                  is_loading
                    ? 'cursor-not-allowed border-stone-300 bg-stone-300 text-stone-100'
                    : 'border-stone-950 bg-stone-950 text-white hover:bg-stone-800',
                ].join(' ')}
                disabled={is_loading}
                type="submit"
              >
                {is_loading ? 'Updating…' : 'Set new password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
