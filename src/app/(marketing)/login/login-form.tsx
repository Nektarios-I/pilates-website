'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  authDebugError,
  authDebugLog,
  setClientAuthDebugEnabled,
} from '@/lib/auth/debug';
import { getAuthRedirectOrigin } from '@/lib/auth/site-url';
import { createClient } from '@/lib/supabase/client';

import { resolve_sign_in_email } from './actions';

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
// Shared style helpers
// ─────────────────────────────────────────────────────────────────────────────

function input_cls(has_error?: boolean): string {
  return [
    'block w-full rounded-md border px-4 py-3 text-base text-stone-950 placeholder-stone-400 shadow-sm',
    'transition-colors focus:outline-none focus:ring-1',
    has_error
      ? 'border-red-300 bg-white focus:border-red-500 focus:ring-red-500'
      : 'border-stone-300 bg-white focus:border-stone-950 focus:ring-stone-950',
  ].join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons (inline SVG — no extra dependency)
// ─────────────────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
  const router = useRouter();
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

  function after_sign_in() {
    router.refresh();
    router.push('/account');
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
    const resolved = await resolve_sign_in_email(identifier);
    if (!resolved.success) {
      set_is_loading(false);
      set_error(resolved.error);
      return;
    }

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: resolved.email,
      password,
    });
    set_is_loading(false);

    if (err) {
      const msg = err.message.toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid password')) {
        set_error('Incorrect email/name or password. Check your details and try again.');
      } else if (msg.includes('email not confirmed')) {
        set_error(
          'Your email has not been confirmed yet. Check your inbox for a confirmation email.',
        );
      } else {
        set_error(err.message);
      }
    } else {
      after_sign_in();
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
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({
      email: otp_email.trim(),
      token: trimmed,
      type: 'email',
    });

    if (err) {
      set_is_loading(false);
      const msg = err.message.toLowerCase();
      if (msg.includes('expired') || msg.includes('invalid')) {
        set_error('That code is invalid or has expired. Click "Back" to request a new one.');
      } else {
        set_error(err.message);
      }
    } else {
      after_sign_in();
    }
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  async function handle_google() {
    clear_status();
    set_is_loading(true);
    const supabase = createClient();
    const site_url = getAuthRedirectOrigin();
    const redirect_to = `${site_url}/auth/callback`;
    authDebugLog('login: google sign-in requested', {
      provider: 'google',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      redirect_to,
    });
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirect_to },
    });
    // On success the browser is redirected to Google — no further action needed.
    if (err) {
      set_is_loading(false);
      authDebugError('login: google sign-in failed before redirect', {
        message: err.message,
        code: err.code ?? null,
        status: err.status ?? null,
      });
      if (
        err.message.toLowerCase().includes('unsupported provider') ||
        err.message.toLowerCase().includes('provider is not enabled')
      ) {
        set_error(
          debugEnabled
            ? `${err.message} Check Supabase Authentication > Providers and confirm Google is enabled for this project.`
            : 'Google sign-in is not available right now. Please use another sign-in method.',
        );
        return;
      }
      set_error(err.message);
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
          className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          aria-live="polite"
          className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
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
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-800">Reset link sent</p>
          <p className="mt-1 text-sm text-emerald-700">
            If an account with that email exists, a password reset link has been sent. Check your
            inbox and spam folder.
          </p>
        </div>
        <button
          className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-stone-700 underline underline-offset-4 hover:text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
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
        <p className="mb-4 text-sm text-stone-700">
          Enter your email and we&apos;ll send a link to reset your password.
        </p>
        <form noValidate onSubmit={handle_forgot_submit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-950" htmlFor="forgot-email">
                Email address
              </label>
              <input
                autoComplete="email"
                className={`mt-2 ${input_cls()}`}
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
          className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-stone-600 underline underline-offset-4 hover:text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
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
        <p className="mb-4 text-sm text-stone-700">
          A 6-digit code was sent to <strong>{otp_email}</strong>. Enter it below.
        </p>
        <form noValidate onSubmit={handle_otp_verify}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-950" htmlFor="otp-code">
                Sign-in code
              </label>
              <input
                autoComplete="one-time-code"
                className={`mt-2 ${input_cls()}`}
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
          className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-stone-600 underline underline-offset-4 hover:text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
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
              <label className="block text-sm font-medium text-stone-950" htmlFor="identifier">
                Email or name
              </label>
              <input
                autoComplete="username"
                className={`mt-2 ${input_cls()}`}
                disabled={is_loading}
                id="identifier"
                name="identifier"
                placeholder="NAME SURNAME or you@example.com"
                type="text"
                value={identifier}
                onChange={(e) => set_identifier(e.target.value)}
              />
              <p className="mt-2 text-xs text-stone-500">
                For name sign-in use ALL CAPS: NAME SURNAME (as on your account).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-950" htmlFor="password">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  autoComplete="current-password"
                  className={`pr-14 ${input_cls()}`}
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
                  className="absolute right-0 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-stone-500 hover:text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
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
              <label className="block text-sm font-medium text-stone-950" htmlFor="otp-email">
                Email address
              </label>
              <input
                autoComplete="email"
                className={`mt-2 ${input_cls()}`}
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
            className="inline-flex min-h-11 items-center text-sm text-stone-600 underline underline-offset-4 hover:text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
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
          className="inline-flex min-h-11 w-full items-center justify-center text-sm font-medium text-stone-700 underline underline-offset-4 hover:text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
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

      {/* Divider */}
      <div className="relative my-6">
        <div aria-hidden="true" className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-stone-500">or continue with</span>
        </div>
      </div>

      {/* Social sign-in */}
      <div className="flex flex-col gap-3">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-950 transition-colors hover:border-stone-500 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={is_loading}
          type="button"
          onClick={handle_google}
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </div>

      {/* Privacy note */}
      <p className="mt-6 text-xs leading-5 text-stone-500">
        By signing in, you agree to our terms of service and privacy policy. After your first
        sign-in this site will remember you automatically until you sign out.
      </p>
    </div>
  );
}
