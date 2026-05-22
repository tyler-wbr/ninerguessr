"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
    router.push(next);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="label">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className="w-full btn-primary">
        {pending ? "Logging in…" : "Log in"}
      </button>
      <p className="text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="link-brand">
          Create an account
        </Link>
      </p>
    </form>
  );
}
