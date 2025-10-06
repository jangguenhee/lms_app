import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DebugPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/signin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">디버그 정보</h1>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">세션 정보</h2>
          <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
            {JSON.stringify(
              {
                user_id: session.user.id,
                email: session.user.email,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">프로필 정보</h2>
          <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>

        {profile && (
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">권한 체크</h2>
            <ul className="space-y-2">
              <li>
                <strong>Role:</strong>{' '}
                <span
                  className={
                    profile.role === 'instructor'
                      ? 'text-green-600'
                      : 'text-blue-600'
                  }
                >
                  {profile.role}
                </span>
              </li>
              <li>
                <strong>Onboarded:</strong>{' '}
                <span
                  className={
                    profile.onboarded ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {profile.onboarded ? 'Yes' : 'No'}
                </span>
              </li>
              <li>
                <strong>Expected Dashboard:</strong>{' '}
                {profile.role === 'instructor'
                  ? '/instructor/dashboard'
                  : '/learner/dashboard'}
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
