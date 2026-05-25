import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import type { Profile } from "@/lib/supabase/types";

export default function HeroAuthButtons({
  user,
  profile,
}: {
  user: { id: string; email: string | null } | null;
  profile: Profile | null;
}) {
  if (user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/profile"
          className="hero-pill hero-pill-outline hidden sm:inline-flex"
        >
          {profile?.display_name ?? "Profile"}
        </Link>
        <SignOutButton className="hero-pill hero-pill-outline" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link href="/login" className="hero-pill hero-pill-outline">
        Log in
      </Link>
      <Link href="/register" className="hero-pill hero-pill-gold">
        Sign up
      </Link>
    </div>
  );
}
