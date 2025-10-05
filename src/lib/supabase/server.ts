import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers.js';
import { env } from '../../constants/env';
import type { Database } from './types';

export type ServerClient = SupabaseClient<Database>;

async function withCookies<T>(
  factory: (cookieStore: Awaited<ReturnType<typeof cookies>>) => T,
): Promise<T> {
  const cookieStore = await cookies();
  return factory(cookieStore);
}

export async function createSupabaseServerClient(): Promise<ServerClient> {
  return withCookies((cookieStore) =>
    createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components may not allow cookie mutation.
          }
        },
      },
    }) as unknown as ServerClient,
  );
}

export async function createClient(): Promise<ServerClient> {
  return createSupabaseServerClient();
}

export async function createPureClient(): Promise<ServerClient> {
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  }) as unknown as ServerClient;
}

export async function createServiceRoleClient(): Promise<ServerClient> {
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되어 있지 않습니다.');
  }

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  }) as unknown as ServerClient;
}
