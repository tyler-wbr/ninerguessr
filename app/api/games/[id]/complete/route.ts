import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { totalRoundsForMode } from "@/lib/gameConfig";
import type { GameMode } from "@/lib/gameConfig";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const gameId = params.id;

  const { data: game, error } = await admin
    .from("games")
    .select("id, user_id, status, total_score, game_mode")
    .eq("id", gameId)
    .maybeSingle();
  if (error || !game) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (game.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (game.status === "completed") {
    return NextResponse.json({ gameId, totalScore: game.total_score });
  }

  const totalRounds = totalRoundsForMode(game.game_mode as GameMode);

  const { data: rounds, error: roundsErr } = await admin
    .from("game_rounds")
    .select("points, guessed_at")
    .eq("game_id", gameId);
  if (roundsErr || !rounds) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const allGuessed =
    rounds.length === totalRounds && rounds.every((r) => r.guessed_at);
  if (!allGuessed) {
    return NextResponse.json({ error: "not_all_rounds_guessed" }, { status: 409 });
  }

  const totalScore = rounds.reduce((sum, r) => sum + (r.points ?? 0), 0);

  const { error: updErr } = await admin
    .from("games")
    .update({
      status: "completed",
      total_score: totalScore,
      completed_at: new Date().toISOString(),
    })
    .eq("id", gameId);
  if (updErr) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ gameId, totalScore });
}
