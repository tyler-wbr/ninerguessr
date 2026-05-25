"use client";

import { useTransition } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function SignOutButton({ className }: { className?: string }) {
  const [pending, start] = useTransition();
  const supabase = createBrowserSupabaseClient();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        start(async () => {
          await supabase.auth.signOut();
          window.location.assign("/");
        });
      }}
      className={
        className ??
        "text-sm hover:text-niner-gold transition-colors disabled:opacity-50"
      }
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
