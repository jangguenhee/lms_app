import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/constants/env';
import type { Database } from '@/lib/supabase/types';

const PUBLIC_PATHS = ['/', '/signin', '/signup', '/onboarding'] as const;

const LEARNER_PREFIX = '/learner';
const INSTRUCTOR_PREFIX = '/instructor';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(request, response);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    if (isPublicPath(pathname)) {
      return response;
    }

    return redirectWithCookies(request, response, '/signin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role,onboarded')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!profile) {
    return redirectWithCookies(request, response, '/onboarding');
  }

  const { onboarded, role } = profile;

  if (!onboarded && !pathname.startsWith('/onboarding')) {
    return redirectWithCookies(request, response, '/onboarding');
  }

  if (role === 'instructor' && pathname.startsWith(LEARNER_PREFIX)) {
    return redirectWithCookies(request, response, `${INSTRUCTOR_PREFIX}/dashboard`);
  }

  if (role === 'learner' && pathname.startsWith(INSTRUCTOR_PREFIX)) {
    return redirectWithCookies(request, response, `${LEARNER_PREFIX}/dashboard`);
  }

  return response;
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((publicPath) =>
    publicPath === '/' ? pathname === '/' : pathname === publicPath || pathname.startsWith(`${publicPath}/`),
  );
}

function redirectWithCookies(request: NextRequest, originalResponse: NextResponse, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';

  const redirectResponse = NextResponse.redirect(url, { status: 307 });
  originalResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
): SupabaseClient<Database> {
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          response.cookies.set({ name, value, ...options });
        });
      },
    },
  }) as unknown as SupabaseClient<Database>;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api).*)'],
};
