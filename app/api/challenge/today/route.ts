import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getChallengeDate,
  formatChallengeDateLabel,
} from "@/lib/dailyChallenge";
import {
  DAILY_PER_DIFFICULTY,
  DAILY_ROUNDS,
  DAILY_TIME_LIMIT_MS,
} from "@/lib/gameConfig";
import type { Difficulty } from "@/lib/supabase/types";

export async function GET() {
  const challengeDate = getChallengeDate();
  const admin = createAdminSupabaseClient();

  const counts: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  const { data: locs } = await admin
    .from("locations")
    .select("difficulty")
    .eq("is_published", true);
  for (const loc of locs ?? []) {
    counts[loc.difficulty as Difficulty]++;
  }

  const available = (["easy", "medium", "hard"] as const).every(
    (d) => counts[d] >= DAILY_PER_DIFFICULTY,
  );

  let userStatus: "not_started" | "in_progress" | "completed" = "not_started";
  let gameId: string | null = null;
  let completedScore: number | null = null;

  const { user } = await getServerUser();
  if (user) {
    const { data: game } = await admin
      .from("games")
      .select("id, status, total_score")
      .eq("user_id", user.id)
      .eq("game_mode", "daily")
      .eq("challenge_date", challengeDate)
      .maybeSingle();

    if (game) {
      gameId = game.id;
      if (game.status === "completed") {
        userStatus = "completed";
        completedScore = game.total_score;
      } else if (game.status === "in_progress") {
        userStatus = "in_progress";
      }
    }
  }

  return NextResponse.json({
    date: challengeDate,
    dateLabel: formatChallengeDateLabel(challengeDate),
    available,
    rounds: DAILY_ROUNDS,
    timeLimitSec: DAILY_TIME_LIMIT_MS / 1000,
    locationCounts: counts,
    userStatus,
    gameId,
    completedScore,
  });
}
