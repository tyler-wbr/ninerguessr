import Image from "next/image";
import Link from "next/link";
import { getServerUser } from "@/lib/supabase/server";
import HomeAuthButtons from "@/components/HomeAuthButtons";

const DIFFICULTIES = [
  { id: "easy", label: "Play Easy" },
  { id: "medium", label: "Play Medium" },
  { id: "hard", label: "Play Hard" },
] as const;

function playHref(difficulty: string, loggedIn: boolean) {
  return loggedIn
    ? `/play?difficulty=${difficulty}`
    : `/login?next=${encodeURIComponent(`/play?difficulty=${difficulty}`)}`;
}

export default async function HomePage() {
  const { user, profile } = await getServerUser();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image
        src="/images/campus-hero.jpg"
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      <div
        className="absolute inset-0 bg-gradient-to-r from-niner-green/95 via-niner-green/80 to-niner-green/20"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-niner-green/50 via-transparent to-transparent sm:hidden"
        aria-hidden
      />

      <div className="absolute right-6 top-6 z-20 sm:right-10 sm:top-10">
        <HomeAuthButtons user={user} profile={profile} />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-6 pb-8 pt-16 sm:px-10 sm:pb-10 sm:pt-20 md:px-14 lg:px-20">
        <div className="max-w-md flex-1">
          <h1 className="text-4xl font-bold tracking-tight text-niner-white sm:text-5xl lg:text-6xl">
            Niner Guessr
          </h1>
          <p className="mt-2 text-sm text-niner-white/70 sm:text-base">
            Drop a pin. Score points. Know your campus.
          </p>

          <div className="hero-divider mt-8" />

          <nav className="mt-6 flex flex-col" aria-label="Main">
            {DIFFICULTIES.map((d) => (
              <Link
                key={d.id}
                href={playHref(d.id, !!user)}
                className="hero-nav-link"
              >
                {d.label}
              </Link>
            ))}

            <div className="hero-divider my-2" />

            <Link href="/leaderboard" className="hero-nav-link">
              Leaderboard
            </Link>

            {user && (
              <>
                <Link href="/profile" className="hero-nav-link">
                  Profile
                </Link>
                {profile?.is_admin && (
                  <Link href="/admin" className="hero-nav-link">
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        <footer className="mt-auto pt-8">
          <p className="max-w-lg text-xs text-niner-white/45">
            Five rounds · 5,000 points each · Not affiliated with UNC Charlotte
          </p>
        </footer>
      </div>
    </div>
  );
}
