import "server-only";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Profile } from "./types";

/**
 * Server-side Supabase client bound to the current request's auth cookie.
 * Uses the anon key, so RLS is enforced. Use this for any per-user read.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // set() throws in Server Components; safe to ignore — middleware
            // refreshes the session cookie.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // see above
          }
        },
      },
    },
  );
}

export type ServerUser = {
  user: { id: string; email: string | null } | null;
  profile: Profile | null;
};

/**
 * Convenience: fetch the current auth user and their profile in one call.
 * Returns nulls if not authenticated.
 */
export async function getServerUser(): Promise<ServerUser> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: (profile as Profile | null) ?? null,
  };
}
