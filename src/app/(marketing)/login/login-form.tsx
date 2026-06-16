'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { signInWithMagicLink } from './actions';

interface LoginFormProps {
  error?: string;
  message?: string;
}

export function LoginForm({ error: initial_error, message: initial_message }: LoginFormProps) {
  const [is_pending, start_transition] = useTransition();
  const [email, set_email] = useState('');
  const [error, set_error] = useState(initial_error);
  const [message, set_message] = useState(initial_message);

  const handle_submit = async (form_data: FormData) => {
    set_error(undefined);
    set_message(undefined);

    start_transition(async () => {
      const result = await signInWithMagicLink(form_data);

      if (result?.error) {
        set_error(result.error);
      } else if (result?.success) {
        set_message('Check your email for a sign-in link.');
        set_email('');
      }
    });
  };

  return (
    <div>
      {error && (
        <div
          aria-live="polite"
          className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          aria-live="polite"
          className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          role="alert"
        >
          {message}
        </div>
      )}

      <form action={handle_submit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-950" htmlFor="email">
              Email address
            </label>
            <input
              autoComplete="email"
              className="mt-2 block w-full rounded-md border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 placeholder-stone-400 shadow-sm transition-colors focus:border-stone-950 focus:outline-none focus:ring-1 focus:ring-stone-950"
              disabled={is_pending}
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
              value={email}
              onChange={(e) => set_email(e.target.value)}
            />
          </div>

          <Button className="w-full" disabled={is_pending} size="lg" type="submit">
            {is_pending ? 'Sending...' : 'Send sign-in link'}
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-stone-200 pt-6">
        <p className="text-xs leading-5 text-stone-600">
          By signing in, you agree to our terms of service and privacy policy. We&apos;ll send you a
          secure link to complete your sign-in. The link expires in 1 hour.
        </p>
      </div>
    </div>
  );
}
