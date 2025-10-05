'use client';

import { createBrowserClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/constants/env';
import type { Database } from './types';

type BrowserCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

type GetAllCookiesResult = Array<Pick<BrowserCookie, 'name' | 'value'>>;

const isBrowser = typeof window !== 'undefined';

const sameSiteMap: Record<'lax' | 'strict' | 'none', string> = {
  lax: 'Lax',
  strict: 'Strict',
  none: 'None',
};

const formatSameSite = (sameSite: CookieOptions['sameSite']): string | null => {
  if (sameSite === undefined || sameSite === false) {
    return null;
  }

  if (sameSite === true) {
    return sameSiteMap.strict;
  }

  if (typeof sameSite === 'string' && sameSiteMap[sameSite]) {
    return sameSiteMap[sameSite];
  }

  return null;
};

const getAllBrowserCookies = (): GetAllCookiesResult => {
  if (!isBrowser || !document.cookie) {
    return [];
  }

  return document.cookie.split('; ').filter(Boolean).map((cookie) => {
    const [name, ...valueParts] = cookie.split('=');
    return {
      name,
      value: decodeURIComponent(valueParts.join('=')),
    };
  });
};

const setAllBrowserCookies = (cookies: BrowserCookie[]): void => {
  if (!isBrowser) {
    return;
  }

  cookies.forEach(({ name, value, options }) => {
    const segments = [`${name}=${encodeURIComponent(value)}`];

    const {
      path,
      domain,
      maxAge,
      expires,
      sameSite,
      secure,
    } = options ?? {};

    segments.push(`Path=${path ?? '/'}`);

    if (domain) {
      segments.push(`Domain=${domain}`);
    }

    if (typeof maxAge === 'number') {
      segments.push(`Max-Age=${Math.floor(maxAge)}`);
    }

    if (expires) {
      const expiry = expires instanceof Date ? expires : new Date(expires);
      if (!Number.isNaN(expiry.getTime())) {
        segments.push(`Expires=${expiry.toUTCString()}`);
      }
    }

    const formattedSameSite = formatSameSite(sameSite);
    if (formattedSameSite) {
      segments.push(`SameSite=${formattedSameSite}`);
    }

    if (secure) {
      segments.push('Secure');
    }

    document.cookie = segments.join('; ');
  });
};

const createSupabaseBrowserClient = () =>
  createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      ...(isBrowser
        ? {
            cookies: {
              getAll: (): GetAllCookiesResult | null => getAllBrowserCookies(),
              setAll: (cookies: BrowserCookie[]): void => setAllBrowserCookies(cookies),
            },
          }
        : {}),
    },
  );

type SupabaseBrowserClient = ReturnType<typeof createSupabaseBrowserClient>;

let client: SupabaseBrowserClient | null = null;

export function createClient(): SupabaseBrowserClient {
  if (!client) {
    client = createSupabaseBrowserClient();
  }

  return client;
}

export type { SupabaseBrowserClient };
