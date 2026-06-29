'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { marketingInputClass } from '@/components/ui/marketing-field-styles';
import { setClientAuthDebugEnabled } from '@/lib/auth/debug';
import { getAuthRedirectOrigin } from '@/lib/auth/site-url';
import { createClient } from '@/lib/supabase/client';

import { sign_in_with_password, verify_sign_in_otp } from './actions';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SignInMode = 'password' | 'otp';
type OtpStep = 'email' | 'verify';
type ForgotStep = 'idle' | 'form' | 'sent';

interface LoginFormProps {
  debugEnabled?: boolean;
  error?: string;
  message?: string;
  hint?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// URL hint → human-readable message
// ─────────────────────────────────────────────────────────────────────────────

const HINT_MESSAGES: Record<string, string> = {
  link_expired:
    'That sign-in link has expired or was already used. Magic links are single-use and valid for about 1 hour. Request a fresh one below.',
  link_expired_or_invalid:
    'The sign-in link is invalid or has expired. Request a new link and open it in the same browser you used to request it.',
  pkce_browser_mismatch:
    'Open the sign-in link in the same browser where you entered your email — not in an email app or different browser.',
  auth_failed: 'Sign-in could not be completed. Please try again.',
  password_updated: 'Your password has been updated. Sign in below.',
};

function resolve_initial_state(
  error?: string,
  hint?: string,
  message?: string,
): { error?: string; success?: string } {
  if (hint && HINT_MESSAGES[hint]) return { error: HINT_MESSAGES[hint] };
  if (error === 'auth_callback_error')
    return {
      error:
        'The sign-in link could not be verified. It may have expired or already been used. Request a new one below.',
    };
  if (error) return { error };
  if (message === 'password_updated') return { success: HINT_MESSAGES.password_updated };
  if (message) return { success: message };
  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons (inline SVG — no extra dependency)
// ─────────────────────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line strokeLinecap="round" strokeLinejoin="round" x1="1" x2="23" y1="1" y2="23" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function LoginForm({
  debugEnabled = false,
  error: initial_error,
  message: initial_message,
  hint: initial_hint,
}: LoginFormProps) {
  const { error: init_error, success: init_success } = resolve_initial_state(
    initial_error,
    initial_hint,
    initial_message,
  );

  // ── Sign-in mode ───────────────────────────────────────────────────────────
  const [mode, set_mode] = useState<SignInMode>('password');
  const [otp_step, set_otp_step] = useState<OtpStep>('email');
  const [forgot_step, set_forgot_step] = useState<ForgotStep>('idle');

  // ── Fields ─────────────────────────────────────────────────────────────────
  const [identifier, set_identifier] = useState('');
  const [password, set_password] = useState('');
  const [show_password, set_show_password] = useState(false);
  const [otp_email, set_otp_email] = useState('');
  const [otp_code, set_otp_code] = useState('');
  const [forgot_email, set_forgot_email] = useState('');

  // ── Status ─────────────────────────────────────────────────────────────────
  const [is_loading, set_is_loading] = useState(false);
  const [error, set_error] = useState<string | undefined>(init_error);
  const [success, set_success] = useState<string | undefined>(init_success);

  useEffect(() => {
    setClientAuthDebugEnabled(debugEnabled);
  }, [debugEnabled]);

  function clear_status() {
    set_error(undefined);
    set_success(undefined);
  }

  // ── Email + Password sign-in ──────────────────────────────────────────────

  async function handle_password_sign_in(e: React.FormEvent) {
    e.preventDefault();
    clear_status();

    if (!identifier.trim() || !password) {
      set_error('Email or name and password are required.');
      return;
    }

    set_is_loading(true);
    const result = await sign_in_with_password(identifier, password, '/account');
    set_is_loading(false);

    if (!result.success) {
      set_error(result.error);
    }
  }

  // ── Forgot password ───────────────────────────────────────────────────────

  function open_forgot_password() {
    clear_status();
    set_forgot_email(identifier.trim()); // pre-fill with whatever was typed
    set_forgot_step('form');
  }

  async function handle_forgot_submit(e: React.FormEvent) {
    e.preventDefault();
    clear_status();

    const trimmed = forgot_email.trim();
    if (!trimmed) {
      set_error('Enter your email address to receive a reset link.');
      return;
    }

    set_is_loading(true);
    const supabase = createClient();
    const site_url = getAuthRedirectOrigin();
    const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${site_url}/auth/callback?next=/auth/reset-password`,
    });
    set_is_loading(false);

    if (err) {
      set_error(err.message);
    } else {
      set_forgot_step('sent');
    }
  }

  // ── Email OTP sign-in ─────────────────────────────────────────────────────

  async function handle_otp_request(e: React.FormEvent) {
    e.preventDefault();
    clear_status();

    const trimmed = otp_email.trim();
    if (!trimmed) {
      set_error('Email address is required.');
      return;
    }

    set_is_loading(true);
    const supabase = createClient();
    const site_url = getAuthRedirectOrigin();

    // Must be called from the browser so the PKCE verifier cookie is stored here.
    const { error: err } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${site_url}/auth/callback`,
      },
    });
    set_is_loading(false);

    if (err) {
      const msg = err.message.toLowerCase();
      if (msg.includes('user not found') || msg.includes('not found')) {
        set_error(
          'No account found with that email. This studio uses invite-only accounts — contact us to get started.',
        );
      } else if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
        set_error('Too many requests. Please wait a few minutes before requesting another code.');
      } else {
        set_error(err.message);
      }
    } else {
      set_success('Code sent — check your inbox (and spam folder).');
      set_otp_step('verify');
    }
  }

  async function handle_otp_verify(e: React.FormEvent) {
    e.preventDefault();
    clear_status();

    const trimmed = otp_code.trim();
    if (!trimmed) {
      set_error('Please enter the 6-digit code from your email.');
      return;
    }

    set_is_loading(true);
    const result = await verify_sign_in_otp(otp_email, trimmed, '/account');
    set_is_loading(false);

    if (!result.success) {
      set_error(result.error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Shared status block (inline JSX, not a nested component)
  // ─────────────────────────────────────────────────────────────────────────

  const status_block = (
    <>
      {error && (
        <div
          aria-live="polite"
          className="mb-5 rounded-md border border-destructive-border bg-destructive-surface p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          aria-live="polite"
          className="mb-5 rounded-md border border-success/30 bg-success-surface p-4 text-sm text-success"
          role="status"
        >
          {success}
        </div>
      )}
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Password mode — forgot flow (inline)
  // ─────────────────────────────────────────────────────────────────────────

  if (forgot_step === 'sent') {
    return (
      <div>
        {status_block}
        <div className="rounded-md border border-success/30 bg-success-surface p-5">
          <p className="text-sm font-semibold text-success">Reset link sent</p>
          <p className="mt-1 text-sm text-success/90">
            If an account with that email exists, a password reset link has been sent. Check your
            inbox and spam folder.
          </p>
        </div>
        <button
          className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-foreground/80 underline underline-offset-4 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          type="button"
          onClick={() => {
            set_forgot_step('idle');
            clear_status();
          }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  if (forgot_step === 'form') {
    return (
      <div>
        {status_block}
        <p className="mb-4 text-sm text-foreground/80">
          Enter your email and we&apos;ll send a link to reset your password.
        </p>
        <form noValidate onSubmit={handle_forgot_submit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground" htmlFor="forgot-email">
                Email address
              </label>
              <input
                autoComplete="email"
                className={`mt-2 ${marketingInputClass()}`}
                disabled={is_loading}
                id="forgot-email"
                placeholder="you@example.com"
                type="email"
                value={forgot_email}
                onChange={(e) => set_forgot_email(e.target.value)}
              />
            </div>
            <Button className="w-full" disabled={is_loading} size="lg" type="submit">
              {is_loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </div>
        </form>
        <button
          className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-foreground/70 underline underline-offset-4 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          type="button"
          onClick={() => {
            set_forgot_step('idle');
            clear_status();
          }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OTP verify step
  // ─────────────────────────────────────────────────────────────────────────

  if (mode === 'otp' && otp_step === 'verify') {
    return (
      <div>
        {status_block}
        <p className="mb-4 text-sm text-foreground/80">
          A 6-digit code was sent to <strong>{otp_email}</strong>. Enter it below.
        </p>
        <form noValidate onSubmit={handle_otp_verify}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground" htmlFor="otp-code">
                Sign-in code
              </label>
              <input
                autoComplete="one-time-code"
                className={`mt-2 ${marketingInputClass()}`}
                disabled={is_loading}
                id="otp-code"
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="123456"
                type="text"
                value={otp_code}
                onChange={(e) => set_otp_code(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <Button className="w-full" disabled={is_loading} size="lg" type="submit">
              {is_loading ? 'Verifying…' : 'Verify code'}
            </Button>
          </div>
        </form>
        <button
          className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-foreground/70 underline underline-offset-4 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          type="button"
          onClick={() => {
            set_otp_step('email');
            set_otp_code('');
            clear_status();
          }}
        >
          Back — request a new code
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main sign-in view
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div>
      {status_block}

      {/* Password OR OTP form */}
      {mode === 'password' ? (
        <form noValidate onSubmit={handle_password_sign_in}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground" htmlFor="identifier">
                Email or name
              </label>
              <input
                autoComplete="username"
                className={`mt-2 ${marketingInputClass()}`}
                disabled={is_loading}
                id="identifier"
                name="identifier"
                placeholder="NAME SURNAME or you@example.com"
                type="text"
                value={identifier}
                onChange={(e) => set_identifier(e.target.value)}
              />
              <p className="mt-2 text-xs text-foreground/60">
                For name sign-in use ALL CAPS: NAME SURNAME (as on your account).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  autoComplete="current-password"
                  className={`pr-14 ${marketingInputClass()}`}
                  disabled={is_loading}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={show_password ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => set_password(e.target.value)}
                />
                <button
                  aria-label={show_password ? 'Hide password' : 'Show password'}
                  className="absolute right-0 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-foreground/60 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  type="button"
                  onClick={() => set_show_password((p) => !p)}
                >
                  <EyeIcon open={show_password} />
                </button>
              </div>
            </div>

            <Button className="w-full" disabled={is_loading} size="lg" type="submit">
              {is_loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
        </form>
      ) : (
        /* OTP email request form */
        <form noValidate onSubmit={handle_otp_request}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground" htmlFor="otp-email">
                Email address
              </label>
              <input
                autoComplete="email"
                className={`mt-2 ${marketingInputClass()}`}
                disabled={is_loading}
                id="otp-email"
                placeholder="you@example.com"
                type="email"
                value={otp_email}
                onChange={(e) => set_otp_email(e.target.value)}
              />
            </div>
            <Button className="w-full" disabled={is_loading} size="lg" type="submit">
              {is_loading ? 'Sending code…' : 'Send code'}
            </Button>
          </div>
        </form>
      )}

      {/* Forgot password (password mode only) */}
      {mode === 'password' && (
        <div className="mt-3 text-right">
          <button
            className="inline-flex min-h-11 items-center text-sm text-foreground/70 underline underline-offset-4 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            type="button"
            onClick={open_forgot_password}
          >
            Forgot password?
          </button>
        </div>
      )}

      {/* Mode toggle */}
      <div className="mt-5">
        <button
          className="inline-flex min-h-11 w-full items-center justify-center text-sm font-medium text-foreground/80 underline underline-offset-4 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          type="button"
          onClick={() => {
            set_mode((m) => (m === 'password' ? 'otp' : 'password'));
            set_otp_step('email');
            clear_status();
          }}
        >
          {mode === 'password' ? 'Sign in without password' : 'Use password instead'}
        </button>
      </div>

      {/* Privacy note */}
      <p className="mt-6 text-xs leading-5 text-foreground/60">
        By signing in, you agree to our terms of service and privacy policy. After your first
        sign-in this site will remember you automatically until you sign out.
      </p>
    </div>
  );
}
