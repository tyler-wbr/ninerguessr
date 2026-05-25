import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { difficultySchema } from "@/lib/schemas";
import { getChallengeDate } from "@/lib/dailyChallenge";
import { z } from "zod";

const querySchema = z.object({
  board: z.enum(["casual", "daily"]).default("casual"),
  difficulty: difficultySchema.optional(),
  mode: z.enum(["single", "avg"]).default("single"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    board: url.searchParams.get("board") ?? "casual",
    difficulty: url.searchParams.get("difficulty") ?? undefined,
    mode: url.searchParams.get("mode") ?? "single",
    date: url.searchParams.get("date") ?? undefined,
    limit: url.searchParams.get("limit") ?? 50,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { board, difficulty, mode, date, limit } = parsed.data;
  const admin = createAdminSupabaseClient();

  if (board === "daily") {
    const challengeDate = date ?? getChallengeDate();
    const { data, error } = await admin
      .from("leaderboard_daily")
      .select("user_id, display_name, total_score, game_id, completed_at")
      .eq("challenge_date", challengeDate)
      .order("total_score", { ascending: false })
      .limit(limit);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ board, date: challengeDate, rows: data ?? [] });
  }

  if (!difficulty) {
    return NextResponse.json(
      { error: "difficulty required for casual leaderboard" },
      { status: 400 },
    );
  }

  if (mode === "single") {
    const { data, error } = await admin
      .from("leaderboard_single")
      .select("user_id, display_name, total_score, game_id, completed_at")
      .eq("difficulty", difficulty)
      .order("total_score", { ascending: false })
      .limit(limit);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ board, mode, difficulty, rows: data ?? [] });
  }

  const { data, error } = await admin
    .from("leaderboard_avg")
    .select("user_id, display_name, avg_score, games_played")
    .eq("difficulty", difficulty)
    .order("avg_score", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ board, mode, difficulty, rows: data ?? [] });
}
