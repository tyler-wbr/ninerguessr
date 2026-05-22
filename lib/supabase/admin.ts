import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client. Bypasses RLS. NEVER import from a client
// component. The "server-only" import above will throw at build time if a
// "use client" file tries to bundle this module.

let cached: SupabaseClient | null = null;

export function createAdminSupabaseClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.",
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "location-photos";
