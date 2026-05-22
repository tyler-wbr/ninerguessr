import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { guessSchema } from "@/lib/schemas";
import { rateLimitGameGuess } from "@/lib/rateLimit";
import { haversineMeters, scoreFromDistance } from "@/lib/scoring";
import { isWithinCampus } from "@/lib/geo";
import { signPhotoUrl } from "@/lib/photoUrl";

const ROUNDS = Number(process.env.GAME_ROUNDS ?? 5);

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = await rateLimitGameGuess(user.id);
  if (!rl.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = guessSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { lat, lng } = parsed.data;
  const gameId = params.id;

  const admin = createAdminSupabaseClient();

  const { data: game, error: gameErr } = await admin
    .from("games")
    .select("id, user_id, status, current_round")
    .eq("id", gameId)
    .maybeSingle();
  if (gameErr || !game) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (game.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (game.status !== "in_progress") {
    return NextResponse.json({ error: "game_finished" }, { status: 409 });
  }

  const { data: round, error: roundErr } = await admin
    .from("game_rounds")
    .select(
      "id, round_number, location_id, guess_lat, guess_lng, distance_m, points, guessed_at",
    )
    .eq("game_id", gameId)
    .eq("round_number", game.current_round)
    .maybeSingle();
  if (roundErr || !round) {
    return NextResponse.json({ error: "round_missing" }, { status: 500 });
  }

  const { data: loc, error: locErr } = await admin
    .from("locations")
    .select("id, lat, lng, image_path")
    .eq("id", round.location_id)
    .maybeSingle();
  if (locErr || !loc) {
    return NextResponse.json({ error: "location_missing" }, { status: 500 });
  }

  // Idempotency: if this round already has a guess, return the stored result.
  if (round.guessed_at) {
    return buildResponse({
      admin,
      gameId,
      currentRound: round.round_number,
      isFinal: round.round_number === ROUNDS,
      distance_m: round.distance_m!,
      points: round.points!,
      actual: { lat: loc.lat, lng: loc.lng },
      gameStatus: game.status,
    });
  }

  const distance_m = haversineMeters(lat, lng, loc.lat, loc.lng);
  const inBounds = isWithinCampus(lat, lng);
  const points = inBounds ? scoreFromDistance(distance_m) : 0;

  const { error: updErr } = await admin
    .from("game_rounds")
    .update({
      guess_lat: lat,
      guess_lng: lng,
      distance_m,
      points,
      guessed_at: new Date().toISOString(),
    })
    .eq("id", round.id);
  if (updErr) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const isFinal = round.round_number === ROUNDS;
  if (!isFinal) {
    await admin
      .from("games")
      .update({ current_round: round.round_number + 1 })
      .eq("id", gameId);
  }

  return buildResponse({
    admin,
    gameId,
    currentRound: round.round_number,
    isFinal,
    distance_m,
    points,
    actual: { lat: loc.lat, lng: loc.lng },
    outOfBounds: !inBounds,
    gameStatus: game.status,
  });
}

async function buildResponse(args: {
  admin: ReturnType<typeof createAdminSupabaseClient>;
  gameId: string;
  currentRound: number;
  isFinal: boolean;
  distance_m: number;
  points: number;
  actual: { lat: number; lng: number };
  outOfBounds?: boolean;
  gameStatus: string;
}) {
  const { admin, gameId, currentRound, isFinal, distance_m, points, actual } =
    args;

  let nextPhotoUrl: string | null = null;
  if (!isFinal) {
    const { data: nextRound } = await admin
      .from("game_rounds")
      .select("location_id")
      .eq("game_id", gameId)
      .eq("round_number", currentRound + 1)
      .maybeSingle();
    if (nextRound) {
      const { data: nextLoc } = await admin
        .from("locations")
        .select("image_path")
        .eq("id", nextRound.location_id)
        .maybeSingle();
      if (nextLoc) nextPhotoUrl = await signPhotoUrl(nextLoc.image_path);
    }
  }

  return NextResponse.json({
    round: currentRound,
    totalRounds: ROUNDS,
    distance_m: Math.round(distance_m),
    points,
    actual,
    outOfBounds: args.outOfBounds ?? false,
    isFinal,
    nextPhotoUrl,
  });
}
