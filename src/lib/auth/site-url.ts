import { siteConfig } from '@/config/site';

/**
 * Origin used for Supabase email/OAuth redirects.
 * Prefer the live browser origin on the client so preview deployments
 * work even when NEXT_PUBLIC_SITE_URL was not set at build time.
 */
export function getAuthRedirectOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  const configured = siteConfig.siteUrl;
  if (configured && !configured.includes('localhost')) {
    return configured;
  }

  const vercel_host = process.env.VERCEL_URL;
  if (vercel_host) {
    return `https://${vercel_host}`;
  }

  return configured;
}
