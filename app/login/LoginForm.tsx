"use client";

import Link from "next/link";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import HeroButton from "@/components/HeroButton";
import { validateEmail, validatePassword } from "@/lib/profileValidation";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-300">{message}</p>;
}

export default function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);

    setEmailError(emailResult.ok ? undefined : emailResult.error);
    setPasswordError(passwordResult.ok ? undefined : passwordResult.error);

    if (!emailResult.ok || !passwordResult.ok) {
      setError("Please fix the highlighted fields below.");
      return;
    }

    setPending(true);
    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailResult.value,
      password: passwordResult.value,
    });
    setPending(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }
    window.location.assign(next);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <label className="block">
        <span className="hero-label">Email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(undefined);
          }}
          aria-invalid={!!emailError}
          className={`hero-input ${emailError ? "border-red-400/80 ring-1 ring-red-400/50" : ""}`}
        />
        <FieldError message={emailError} />
      </label>

      <label className="block">
        <span className="hero-label">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(undefined);
          }}
          aria-invalid={!!passwordError}
          className={`hero-input ${passwordError ? "border-red-400/80 ring-1 ring-red-400/50" : ""}`}
        />
        <FieldError message={passwordError} />
      </label>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

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
