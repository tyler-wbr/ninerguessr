"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import HeroButton from "@/components/HeroButton";

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setPending(true);
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (!data.session) {
      setMessage(
        "Account created. Check your inbox to confirm your email, then log in.",
      );
      return;
    }
    router.refresh();
    router.push("/");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="hero-label">Display name</span>
        <input
          type="text"
          required
          maxLength={40}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="hero-input"
        />
      </label>
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
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="hero-input"
        />
      </label>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {message && <p className="text-sm text-niner-gold">{message}</p>}
      <HeroButton type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </HeroButton>
      <p className="text-center text-sm text-niner-white/70">
        Already have an account?{" "}
        <Link href="/login" className="text-niner-gold hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
