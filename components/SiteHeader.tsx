import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import NinerGuessrLogo from "@/components/NinerGuessrLogo";
import type { Profile } from "@/lib/supabase/types";

export default function SiteHeader({
  user,
  profile,
}: {
  user: { id: string; email: string | null } | null;
  profile: Profile | null;
}) {
  return (
    <header className="border-b-4 border-niner-gold bg-niner-green text-niner-white">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        <NinerGuessrLogo variant="horizontal" />
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/leaderboard"
            className="hover:text-niner-gold transition-colors"
          >
            Leaderboard
          </Link>
          {user ? (
            <>
              <Link
                href="/profile"
                className="hover:text-niner-gold transition-colors"
              >
                {profile?.display_name ?? "Profile"}
              </Link>
              {profile?.is_admin && (
                <Link
                  href="/admin"
                  className="hover:text-niner-gold transition-colors"
                >
                  Admin
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hover:text-niner-gold transition-colors"
              >
                Log in
              </Link>
              <Link href="/register" className="btn-accent px-3 py-1">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
