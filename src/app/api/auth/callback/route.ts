import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle errors from Supabase
  if (error) {
    console.error('[auth/callback] Error from Supabase', { error, errorDescription });

    let userMessage = '이메일 확인에 실패했습니다.';

    if (error === 'access_denied' && errorDescription?.includes('expired')) {
      userMessage = '이메일 확인 링크가 만료되었습니다. 다시 회원가입해주세요.';
    }

    return NextResponse.redirect(
      new URL(`/signin?error=email_verification_failed&message=${encodeURIComponent(userMessage)}`, requestUrl.origin)
    );
  }

  if (code) {
    const supabase = await createSupabaseServerClient();

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[auth/callback] Failed to exchange code for session', { error: exchangeError });

      let userMessage = '인증 처리 중 오류가 발생했습니다.';

      if (exchangeError.message?.includes('expired')) {
        userMessage = '인증 코드가 만료되었습니다. 다시 시도해주세요.';
      }

      return NextResponse.redirect(
        new URL(`/signin?error=auth_failed&message=${encodeURIComponent(userMessage)}`, requestUrl.origin)
      );
    }

    // Check if user has completed onboarding
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarded, role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.onboarded) {
        // User already onboarded, redirect to dashboard
        const dashboardUrl = profile.role === 'instructor' ? '/instructor/dashboard' : '/learner/dashboard';
        return NextResponse.redirect(new URL(dashboardUrl, requestUrl.origin));
      }
    }

    // New user, redirect to onboarding
    return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
  }

  // No code provided, redirect to signin
  return NextResponse.redirect(new URL('/signin', requestUrl.origin));
}
