import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/onboarding';

  if (code) {
    const supabase = await createSupabaseServerClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[auth/callback] Failed to exchange code for session', { error });
      return NextResponse.redirect(
        new URL(`/signin?error=auth_failed&message=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }

    // Check if user has completed onboarding
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.onboarded) {
        // User already onboarded, redirect to dashboard
        const role = user.user_metadata?.role;
        const dashboardUrl = role === 'instructor' ? '/instructor/dashboard' : '/learner/dashboard';
        return NextResponse.redirect(new URL(dashboardUrl, requestUrl.origin));
      }
    }
  }

  // Redirect to onboarding or specified next URL
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
