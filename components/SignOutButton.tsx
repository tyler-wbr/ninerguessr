"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const supabase = createBrowserSupabaseClient();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        start(async () => {
          await supabase.auth.signOut();
          router.refresh();
          router.push("/");
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
