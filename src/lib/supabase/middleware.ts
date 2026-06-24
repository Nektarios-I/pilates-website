import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes that require the user to be authenticated.
  // Role-level enforcement (instructor / owner / admin) is handled inside each
  // page/action — the middleware only ensures a valid session exists.
  const protected_routes = ['/account', '/staff'];
  const is_protected_route = protected_routes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (is_protected_route && !user) {
    const redirect_url = new URL('/login', request.url);
    redirect_url.searchParams.set('message', 'Please sign in to continue');
    redirect_url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(redirect_url);
  }

  return supabase_response;
}
