import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { signPhotoUrl } from "@/lib/photoUrl";

/**
 * GET /api/games/:id — used by /play to resume an in-progress game or by the
 * client to fetch a fresh signed photo URL after one expires. Returns only
 * the current round's photo URL, never coordinates.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: game, error } = await admin
    .from("games")
    .select("id, user_id, difficulty, status, current_round, total_score")
    .eq("id", params.id)
    .maybeSingle();
  if (error || !game) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (game.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (game.status !== "in_progress") {
    return NextResponse.json({
      gameId: game.id,
      status: game.status,
      difficulty: game.difficulty,
      totalScore: game.total_score,
    });
  }

  const { data: round } = await admin
    .from("game_rounds")
    .select("location_id, round_number")
    .eq("game_id", game.id)
    .eq("round_number", game.current_round)
    .maybeSingle();
  if (!round) {
    return NextResponse.json({ error: "round_missing" }, { status: 500 });
  }
  const { data: loc } = await admin
    .from("locations")
    .select("image_path")
    .eq("id", round.location_id)
    .maybeSingle();
  if (!loc) {
    return NextResponse.json({ error: "location_missing" }, { status: 500 });
  }

  const photoUrl = await signPhotoUrl(loc.image_path);

  return NextResponse.json({
    gameId: game.id,
    status: game.status,
    difficulty: game.difficulty,
    round: game.current_round,
    photoUrl,
  });
}
