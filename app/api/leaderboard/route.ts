import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { difficultySchema } from "@/lib/schemas";
import { z } from "zod";

const querySchema = z.object({
  difficulty: difficultySchema,
  mode: z.enum(["single", "avg"]).default("single"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    difficulty: url.searchParams.get("difficulty"),
    mode: url.searchParams.get("mode") ?? "single",
    limit: url.searchParams.get("limit") ?? 50,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { difficulty, mode, limit } = parsed.data;
  const admin = createAdminSupabaseClient();

  if (mode === "single") {
    const { data, error } = await admin
      .from("leaderboard_single")
      .select("user_id, display_name, total_score, game_id, completed_at")
      .eq("difficulty", difficulty)
      .order("total_score", { ascending: false })
      .limit(limit);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ mode, difficulty, rows: data ?? [] });
  }

  const { data, error } = await admin
    .from("leaderboard_avg")
    .select("user_id, display_name, avg_score, games_played")
    .eq("difficulty", difficulty)
    .order("avg_score", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mode, difficulty, rows: data ?? [] });
}
