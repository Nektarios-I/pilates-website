// TODO: Remove before production
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseEnvStatus, getSupabaseUrl } from '@/lib/supabase/env';

export async function GET() {
  const env_status = getSupabaseEnvStatus();

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: auth_error,
    } = await supabase.auth.getUser();

    const { count, error: db_error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    let supabase_url_host = 'unknown';
    try {
      supabase_url_host = new URL(getSupabaseUrl()).host;
    } catch {
      supabase_url_host = 'INVALID_URL';
    }

    return NextResponse.json({
      supabase_client: 'initialized',
      env_vars: env_status,
      supabase_url_host,
      vercel_url: process.env.VERCEL_URL ?? null,
      auth: {
        status: auth_error ? 'error' : user ? 'authenticated' : 'unauthenticated',
        user_email: user?.email ?? null,
        error: auth_error?.message ?? null,
      },
      database: {
        connection: db_error ? 'error' : 'ok',
        profiles_count: count ?? null,
        error: db_error?.message ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        supabase_client: 'failed_to_initialize',
        env_vars: env_status,
        vercel_url: process.env.VERCEL_URL ?? null,
        error: error instanceof Error ? error.message : 'Unknown error',
        hint:
          'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or ANON_KEY), SUPABASE_SERVICE_ROLE_KEY, and NEXT_PUBLIC_SITE_URL in Vercel project settings.',
      },
      { status: 500 },
    );
  }
}
