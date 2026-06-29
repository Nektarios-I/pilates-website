import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { safe_auth_next_path } from '@/lib/auth/safe-auth-redirect';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env';

export async function updateSession(request: NextRequest) {
  let supabase_response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies_to_set) {
        cookies_to_set.forEach(({ name, value }) => request.cookies.set(name, value));
        supabase_response = NextResponse.next({
          request,
        });
        cookies_to_set.forEach(({ name, value, options }) =>
          supabase_response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the auth session (Supabase SSR standard — do not skip).
  await supabase.auth.getClaims();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const is_login_route = pathname === '/login';

  if (is_login_route && user) {
    const next = request.nextUrl.searchParams.get('next') ?? undefined;
    const destination = new URL(safe_auth_next_path(next), request.url);
    return NextResponse.redirect(destination);
  }

  const protected_routes = ['/account', '/staff'];
  const is_protected_route = protected_routes.some((route) => pathname.startsWith(route));

  if (is_protected_route && !user) {
    const redirect_url = new URL('/login', request.url);
    redirect_url.searchParams.set('message', 'Please sign in to continue');
    redirect_url.searchParams.set('next', pathname);
    return NextResponse.redirect(redirect_url);
  }

  return supabase_response;
}
