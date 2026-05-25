import { getServerUser } from "@/lib/supabase/server";
import { getHomeDailyStats } from "@/lib/homeStats";
import HeroLayout from "@/components/HeroLayout";
import HeroAuthButtons from "@/components/HeroAuthButtons";
import HeroButton from "@/components/HeroButton";
import HowToPlay from "@/components/HowToPlay";
import HomeDailyStatsBar from "@/components/HomeDailyStatsBar";
import NinerGuessrLogo from "@/components/NinerGuessrLogo";

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
  const [{ user, profile }, dailyStats] = await Promise.all([
    getServerUser(),
    getHomeDailyStats(),
  ]);

  return (
    <HeroLayout
      topLeft={false}
      topRight={<HeroAuthButtons user={user} profile={profile} />}
    >
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-[max(5rem,env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)] sm:px-6">
        <div className="w-full max-w-sm">
          <div className="hero-copy-panel hero-copy-panel-home text-center">
            <div className="flex justify-center">
              <NinerGuessrLogo
                variant="stacked"
                priority
                className="w-64 sm:w-72 -mb-4"
              />
            </div>
            <p className="mt-1 text-sm font-medium text-niner-white/95 sm:text-base">
              Know Your Campus? Prove It.
            </p>
            <HomeDailyStatsBar stats={dailyStats} />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <HeroButton href="/challenge" variant="primary" fullWidth>
              Daily Challenge
            </HeroButton>

            {DIFFICULTIES.map((d) => (
              <HeroButton
                key={d.id}
                href={playHref(d.id, !!user)}
                variant="primary"
                fullWidth
              >
                {d.label}
              </HeroButton>
            ))}

            <HeroButton href="/leaderboard" variant="secondary" fullWidth>
              Leaderboard
            </HeroButton>

            {user && (
              <>
                <HeroButton href="/profile" variant="secondary" fullWidth>
                  Profile
                </HeroButton>
                {profile?.is_admin && (
                  <HeroButton href="/admin" variant="secondary" fullWidth>
                    Admin
                  </HeroButton>
                )}
              </>
            )}
          </div>

          <HowToPlay />

          <p className="mt-8 text-center text-xs leading-relaxed text-niner-white/80 [text-shadow:0_1px_6px_rgba(0,32,21,0.85)]">
            Not affiliated with UNC Charlotte
          </p>
        </div>
      </div>
    </HeroLayout>
  );
}
