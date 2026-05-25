import { getServerUser } from "@/lib/supabase/server";
import HeroLayout from "@/components/HeroLayout";
import HeroAuthButtons from "@/components/HeroAuthButtons";
import HeroButton from "@/components/HeroButton";
import LeaderboardClient from "./LeaderboardClient";
import type { Difficulty } from "@/lib/supabase/types";

const VALID: readonly Difficulty[] = ["easy", "medium", "hard"];
const VALID_MODES = ["single", "avg"] as const;
const VALID_BOARDS = ["casual", "daily"] as const;
type Mode = (typeof VALID_MODES)[number];
type Board = (typeof VALID_BOARDS)[number];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { board?: string; difficulty?: string; mode?: string };
}) {
  const { user, profile } = await getServerUser();

  const board: Board = (VALID_BOARDS as readonly string[]).includes(
    searchParams.board ?? "",
  )
    ? (searchParams.board as Board)
    : "casual";
  const difficulty: Difficulty = VALID.includes(
    searchParams.difficulty as Difficulty,
  )
    ? (searchParams.difficulty as Difficulty)
    : "easy";
  const mode: Mode = (VALID_MODES as readonly string[]).includes(
    searchParams.mode ?? "",
  )
    ? (searchParams.mode as Mode)
    : "single";

  return (
    <HeroLayout topRight={<HeroAuthButtons user={user} profile={profile} />}>
      <div className="flex min-h-[100dvh] flex-col px-6 py-20">
        <div className="mx-auto w-full max-w-3xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-niner-white sm:text-4xl">
              Leaderboards
            </h1>
            <p className="mt-2 text-sm text-niner-white/70">
              Top scores across campus
            </p>
          </div>

          <div className="hero-glass mt-8">
            <LeaderboardClient
              initialBoard={board}
              initialDifficulty={difficulty}
              initialMode={mode}
            />
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <HeroButton href="/challenge" variant="secondary">
              Daily Challenge
            </HeroButton>
            <HeroButton href="/" variant="secondary">
              Home
            </HeroButton>
          </div>
        </div>
      </div>
    </HeroLayout>
  );
}
