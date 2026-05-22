import LeaderboardClient from "./LeaderboardClient";
import type { Difficulty } from "@/lib/supabase/types";

const VALID: readonly Difficulty[] = ["easy", "medium", "hard"];
const VALID_MODES = ["single", "avg"] as const;
type Mode = (typeof VALID_MODES)[number];

export default function LeaderboardPage({
  searchParams,
}: {
  searchParams: { difficulty?: string; mode?: string };
}) {
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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="page-title mb-6">Leaderboards</h1>
      <LeaderboardClient initialDifficulty={difficulty} initialMode={mode} />
    </div>
  );
}
