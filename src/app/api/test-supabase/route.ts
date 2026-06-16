// TODO: Remove before production
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check auth status
    const {
      data: { user },
      error: auth_error,
    } = await supabase.auth.getUser();

    // Check database connection via profiles table
    const { count, error: db_error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const url_configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const key_configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

    return NextResponse.json({
      supabase_client: 'initialized',
      env_vars: {
        NEXT_PUBLIC_SUPABASE_URL: url_configured ? 'set' : 'MISSING',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key_configured ? 'set' : 'MISSING',
      },
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
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set in .env.local',
      },
      { status: 500 },
    );
  }
}
