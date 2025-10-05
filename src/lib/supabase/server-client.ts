import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/constants/env';
import type { Database } from './types';

/**
 * Server Component 및 Route Handler용 Supabase 클라이언트
 * - cookies()를 사용한 세션 관리
 * - Route Handler와 Server Component 모두에서 사용 가능
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 set이 실패할 수 있음
          }
        },
      },
    }
  );
}