/**
 * 환경변수 타입 정의
 * 
 * 이 파일은 TypeScript에서 process.env의 환경변수들에 대한
 * 타입 안전성을 제공합니다.
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * Supabase 프로젝트 URL
       * 클라이언트와 서버 모두에서 사용
       */
      readonly NEXT_PUBLIC_SUPABASE_URL: string;

      /**
       * Supabase 익명 키 (Anon Key)
       * 클라이언트와 서버 모두에서 사용
       * RLS 정책이 적용된 공개 키
       */
      readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

      /**
       * Supabase 서비스 역할 키 (Service Role Key)
       * 서버에서만 사용
       * RLS 정책을 우회하는 관리자 키
       * 주의: 클라이언트에 노출되면 안 됨
       */
      readonly SUPABASE_SERVICE_ROLE_KEY: string;
    }
  }
}

export {};

