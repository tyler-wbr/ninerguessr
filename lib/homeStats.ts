import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getChallengeDate } from "@/lib/dailyChallenge";

export type HomeDailyStats = {
  playersToday: number;
  topScore: number | null;
  topPlayer: string | null;
  challengeAvailable: boolean;
};

export async function getHomeDailyStats(): Promise<HomeDailyStats> {
  const challengeDate = getChallengeDate();
  const admin = createAdminSupabaseClient();

  const { count } = await admin
    .from("games")
    .select("*", { count: "exact", head: true })
    .eq("game_mode", "daily")
    .eq("challenge_date", challengeDate)
    .eq("status", "completed");

  const { data: topRow } = await admin
    .from("leaderboard_daily")
    .select("display_name, total_score")
    .eq("challenge_date", challengeDate)
    .order("total_score", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: locs } = await admin
    .from("locations")
    .select("difficulty")
    .eq("is_published", true);

  const counts = { easy: 0, medium: 0, hard: 0 };
  for (const loc of locs ?? []) {
    counts[loc.difficulty as keyof typeof counts]++;
  }
  const challengeAvailable =
    counts.easy >= 2 && counts.medium >= 2 && counts.hard >= 2;

  return {
    playersToday: count ?? 0,
    topScore: topRow?.total_score ?? null,
    topPlayer: topRow?.display_name ?? null,
    challengeAvailable,
  };
}
