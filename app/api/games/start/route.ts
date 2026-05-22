import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { startGameSchema } from "@/lib/schemas";
import { rateLimitGameStart } from "@/lib/rateLimit";
import { signPhotoUrl } from "@/lib/photoUrl";

const ROUNDS = Number(process.env.GAME_ROUNDS ?? 5);

export async function POST(req: Request) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = await rateLimitGameStart(user.id);
  if (!rl.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = startGameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { difficulty } = parsed.data;

  const admin = createAdminSupabaseClient();

  // Pull a pool of published locations for the chosen difficulty, then pick 5
  // distinct ones at random in JS. Doing the random pick in JS avoids relying
  // on Postgres `random()` ordering when row counts are large and is easy to
  // unit-test.
  const { data: pool, error: poolErr } = await admin
    .from("locations")
    .select("id, image_path")
    .eq("difficulty", difficulty)
    .eq("is_published", true);
  if (poolErr) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  if (!pool || pool.length < ROUNDS) {
    return NextResponse.json(
      {
        error: "not_enough_locations",
        message: `Need at least ${ROUNDS} published ${difficulty} locations; found ${pool?.length ?? 0}.`,
      },
      { status: 409 },
    );
  }

  // Fisher-Yates partial shuffle for the first ROUNDS picks.
  const picked = [...pool];
  for (let i = 0; i < ROUNDS; i++) {
    const j = i + Math.floor(Math.random() * (picked.length - i));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  const chosen = picked.slice(0, ROUNDS);

  const { data: game, error: gameErr } = await admin
    .from("games")
    .insert({ user_id: user.id, difficulty, status: "in_progress" })
    .select("id, current_round")
    .single();
  if (gameErr || !game) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const roundsRows = chosen.map((loc, i) => ({
    game_id: game.id,
    location_id: loc.id,
    round_number: i + 1,
  }));
  const { error: roundsErr } = await admin.from("game_rounds").insert(roundsRows);
  if (roundsErr) {
    // best-effort rollback
    await admin.from("games").delete().eq("id", game.id);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const firstPhotoUrl = await signPhotoUrl(chosen[0].image_path);

  return NextResponse.json({
    gameId: game.id,
    difficulty,
    round: 1,
    totalRounds: ROUNDS,
    photoUrl: firstPhotoUrl,
  });
}
