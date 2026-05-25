"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import HeroButton from "@/components/HeroButton";
import {
  validateRegistrationFields,
  type RegistrationFieldErrors,
} from "@/lib/profileValidation";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-300">{message}</p>;
}

export default function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<RegistrationFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const validation = validateRegistrationFields({
      firstName,
      lastName,
      displayName,
      email,
      password,
    });

    if (!validation.ok) {
      setFieldErrors(validation.errors);
      setError("Please fix the highlighted fields below.");
      return;
    }

    setFieldErrors({});
    setPending(true);
    const supabase = createBrowserSupabaseClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: validation.values.email,
      password: validation.values.password,
      options: {
        data: {
          first_name: validation.values.firstName,
          last_name: validation.values.lastName,
          display_name: validation.values.displayName,
        },
      },
    });
    setPending(false);

    if (signUpError) {
      setError(signUpError.message);
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

  function clearFieldError(field: keyof RegistrationFieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="hero-label">First name</span>
          <input
            type="text"
            autoComplete="given-name"
            maxLength={50}
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              clearFieldError("firstName");
            }}
            aria-invalid={!!fieldErrors.firstName}
            className={`hero-input ${fieldErrors.firstName ? "border-red-400/80 ring-1 ring-red-400/50" : ""}`}
          />
          <FieldError message={fieldErrors.firstName} />
        </label>
        <label className="block">
          <span className="hero-label">Last name</span>
          <input
            type="text"
            autoComplete="family-name"
            maxLength={50}
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              clearFieldError("lastName");
            }}
            aria-invalid={!!fieldErrors.lastName}
            className={`hero-input ${fieldErrors.lastName ? "border-red-400/80 ring-1 ring-red-400/50" : ""}`}
          />
          <FieldError message={fieldErrors.lastName} />
        </label>
      </div>

      <label className="block">
        <span className="hero-label">Display name</span>
        <input
          type="text"
          autoComplete="nickname"
          maxLength={24}
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            clearFieldError("displayName");
          }}
          aria-invalid={!!fieldErrors.displayName}
          className={`hero-input ${fieldErrors.displayName ? "border-red-400/80 ring-1 ring-red-400/50" : ""}`}
        />
        <p className="mt-1 text-xs text-niner-white/50">
          Shown on the leaderboard. 3–24 characters, at least one letter, no
          inappropriate language.
        </p>
        <FieldError message={fieldErrors.displayName} />
      </label>

      <label className="block">
        <span className="hero-label">Email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError("email");
          }}
          aria-invalid={!!fieldErrors.email}
          className={`hero-input ${fieldErrors.email ? "border-red-400/80 ring-1 ring-red-400/50" : ""}`}
        />
        <FieldError message={fieldErrors.email} />
      </label>

      <label className="block">
        <span className="hero-label">Password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError("password");
          }}
          aria-invalid={!!fieldErrors.password}
          className={`hero-input ${fieldErrors.password ? "border-red-400/80 ring-1 ring-red-400/50" : ""}`}
        />
        <p className="mt-1 text-xs text-niner-white/50">
          At least 8 characters.
        </p>
        <FieldError message={fieldErrors.password} />
      </label>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
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
