import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabase_response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
    },
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protected_routes = ['/account'];
  const is_protected_route = protected_routes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  // Redirect to login if accessing protected route without auth
  if (is_protected_route && !user) {
    const redirect_url = new URL('/login', request.url);
    redirect_url.searchParams.set('message', 'Please sign in to access your account');
    redirect_url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(redirect_url);
  }

  // TODO: Add role-based route protection for admin/staff routes when implemented
  // Example:
  // if (request.nextUrl.pathname.startsWith('/admin') && !has_role(user, 'admin')) {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }

  return supabase_response;
}
