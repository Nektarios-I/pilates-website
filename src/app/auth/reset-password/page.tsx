'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  marketingAlertErrorClass,
  marketingEyebrowClass,
  marketingIconButtonClass,
  marketingInputClass,
  marketingLabelClass,
  marketingPageIntroClass,
  marketingTextLinkClass,
} from '@/components/ui/marketing-field-styles';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, set_password] = useState('');
  const [confirm, set_confirm] = useState('');
  const [show_password, set_show_password] = useState(false);
  const [is_loading, set_is_loading] = useState(false);
  const [error, set_error] = useState<string | undefined>();
  const [has_session, set_has_session] = useState<boolean | null>(null);

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

  if (has_session === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-foreground/60">Loading…</p>
      </div>
    );
  }

  if (!has_session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <p className={marketingEyebrowClass}>Password reset</p>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">Link expired</h1>
          <p className={marketingPageIntroClass}>
            This password reset link is invalid or has already been used. Request a new one from
            the login page.
          </p>
          <a className={`mt-6 ${marketingTextLinkClass}`} href="/login">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className={marketingEyebrowClass}>Account</p>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">Set a new password</h1>
          <p className={marketingPageIntroClass}>
            Choose a strong password of at least 8 characters.
          </p>
        </div>

        <div className="mt-10 rounded-md border border-border bg-surface p-6 sm:p-8">
          {error ? (
            <div aria-live="polite" className={`mb-5 ${marketingAlertErrorClass}`} role="alert">
              {error}
            </div>
          ) : null}

          <form noValidate onSubmit={handle_submit}>
            <div className="space-y-4">
              <div>
                <label className={marketingLabelClass} htmlFor="new-password">
                  New password
                </label>
                <div className="relative mt-2">
                  <input
                    autoComplete="new-password"
                    className={`pr-14 ${marketingInputClass()}`}
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
                    className={marketingIconButtonClass}
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
                <label className={marketingLabelClass} htmlFor="confirm-password">
                  Confirm password
                </label>
                <input
                  autoComplete="new-password"
                  className={`mt-2 ${marketingInputClass()}`}
                  disabled={is_loading}
                  id="confirm-password"
                  placeholder="Repeat your password"
                  type={show_password ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => set_confirm(e.target.value)}
                />
              </div>

              <Button className="w-full justify-center" disabled={is_loading} type="submit">
                {is_loading ? 'Updating…' : 'Set new password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
