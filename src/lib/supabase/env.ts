function requireEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return trimmed;
}

export function getSupabaseUrl(): string {
  return requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabasePublishableKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return requireEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)',
    key,
  );
}

export function getSupabaseServiceRoleKey(): string | undefined {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key || undefined;
}

export type SupabaseEnvStatus = {
  url: 'set' | 'MISSING';
  publishable_key: 'set' | 'MISSING';
  service_role_key: 'set' | 'MISSING';
  site_url: 'set' | 'MISSING';
};

export function getSupabaseEnvStatus(): SupabaseEnvStatus {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING',
    publishable_key:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? 'set'
        : 'MISSING',
    service_role_key: getSupabaseServiceRoleKey() ? 'set' : 'MISSING',
    site_url: process.env.NEXT_PUBLIC_SITE_URL ? 'set' : 'MISSING',
  };
}
