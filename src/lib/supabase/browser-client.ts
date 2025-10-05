"use client";

import { createClient, type SupabaseBrowserClient } from "./client";

let singleton: SupabaseBrowserClient | null = null;

export const getSupabaseBrowserClient = (): SupabaseBrowserClient => {
  if (!singleton) {
    singleton = createClient();
  }

  return singleton;
};

export type { SupabaseBrowserClient };
