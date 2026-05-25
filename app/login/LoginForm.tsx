"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import HeroButton from "@/components/HeroButton";

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
        <span className="hero-label">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="hero-input"
        />
      </label>
      <label className="block">
        <span className="hero-label">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="hero-input"
        />
      </label>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <HeroButton type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </HeroButton>
      <p className="text-center text-sm text-niner-white/70">
        New here?{" "}
        <Link href="/register" className="text-niner-gold hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
