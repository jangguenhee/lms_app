import { createClient } from '@supabase/supabase-js';
import { env } from '@/constants/env';
import type { Database } from '@/lib/supabase/types';

/**
 * Infrastructure Layer용 Supabase 클라이언트 생성
 * 
 * 이 클라이언트는 Infrastructure Layer에서 사용되며,
 * Repository 구현체들이 데이터베이스 접근에 사용합니다.
 * 
 * @returns Supabase 클라이언트 인스턴스
 */
export function createSupabaseClient(): ReturnType<typeof createClient<Database>> {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false, // Infrastructure Layer에서는 세션 관리하지 않음
      },
    }
  );
}

/**
 * 싱글톤 패턴으로 Supabase 클라이언트 인스턴스 관리
 * 
 * Infrastructure Layer의 Repository들이 공유할 수 있는
 * 단일 클라이언트 인스턴스를 제공합니다.
 */
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabaseClient(): ReturnType<typeof createSupabaseClient> {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  return supabaseClient;
}

/**
 * 클라이언트 인스턴스 초기화 (테스트용)
 */
export function resetSupabaseClient(): void {
  supabaseClient = null;
}

