import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { guessSchema } from "@/lib/schemas";
import { rateLimitGameGuess } from "@/lib/rateLimit";
import {
  haversineMeters,
  scoreFromDistance,
  scoreFromDistanceAndTime,
} from "@/lib/scoring";
import { isWithinCampus } from "@/lib/geo";
import { signPhotoUrl } from "@/lib/photoUrl";
import { DAILY_TIME_LIMIT_MS, totalRoundsForMode } from "@/lib/gameConfig";
import type { GameMode } from "@/lib/gameConfig";
import type { Difficulty } from "@/lib/supabase/types";

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
    .select("id, user_id, status, current_round, game_mode, challenge_date, difficulty, started_at")
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

  const gameMode = game.game_mode as GameMode;
  const totalRounds = totalRoundsForMode(gameMode);

  const { data: round, error: roundErr } = await admin
    .from("game_rounds")
    .select(
      "id, round_number, location_id, round_difficulty, round_started_at, guess_lat, guess_lng, distance_m, distance_points, time_ms, points, guessed_at",
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

  if (round.guessed_at) {
    return buildResponse({
      admin,
      gameId,
      gameMode,
      totalRounds,
      currentRound: round.round_number,
      isFinal: round.round_number === totalRounds,
      distance_m: round.distance_m!,
      distancePoints: round.distance_points ?? round.points!,
      timeMs: round.time_ms ?? 0,
      points: round.points!,
      actual: { lat: loc.lat, lng: loc.lng },
      roundDifficulty: round.round_difficulty as Difficulty | null,
    });
  }

  const roundStartedAt =
    round.round_started_at ?? game.started_at ?? new Date().toISOString();
  const elapsedMs = Date.now() - new Date(roundStartedAt).getTime();

  const distance_m = haversineMeters(lat, lng, loc.lat, loc.lng);
  const inBounds = isWithinCampus(lat, lng);

  let distancePoints = 0;
  let timeMs = 0;
  let timeMult = 1;
  let points = 0;

  if (inBounds) {
    if (gameMode === "daily") {
      const scored = scoreFromDistanceAndTime(
        distance_m,
        elapsedMs,
        undefined,
        DAILY_TIME_LIMIT_MS,
      );
      distancePoints = scored.distancePoints;
      timeMs = scored.timeMs;
      timeMult = scored.timeMultiplier;
      points = scored.points;
    } else {
      distancePoints = scoreFromDistance(distance_m);
      points = distancePoints;
    }
  }

  const now = new Date().toISOString();

  const { error: updErr } = await admin
    .from("game_rounds")
    .update({
      guess_lat: lat,
      guess_lng: lng,
      distance_m,
      distance_points: distancePoints,
      time_ms: gameMode === "daily" ? timeMs : null,
      points,
      guessed_at: now,
      round_started_at: roundStartedAt,
    })
    .eq("id", round.id);
  if (updErr) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const isFinal = round.round_number === totalRounds;
  if (!isFinal) {
    const nextRoundNum = round.round_number + 1;
    await admin
      .from("games")
      .update({ current_round: nextRoundNum })
      .eq("id", gameId);
    await admin
      .from("game_rounds")
      .update({ round_started_at: now })
      .eq("game_id", gameId)
      .eq("round_number", nextRoundNum);
  }

  return buildResponse({
    admin,
    gameId,
    gameMode,
    totalRounds,
    currentRound: round.round_number,
    isFinal,
    distance_m,
    distancePoints,
    timeMs,
    timeMultiplier: timeMult,
    points,
    actual: { lat: loc.lat, lng: loc.lng },
    outOfBounds: !inBounds,
    roundDifficulty: round.round_difficulty as Difficulty | null,
    nextRoundStartedAt: isFinal ? null : now,
  });
}

async function buildResponse(args: {
  admin: ReturnType<typeof createAdminSupabaseClient>;
  gameId: string;
  gameMode: GameMode;
  totalRounds: number;
  currentRound: number;
  isFinal: boolean;
  distance_m: number;
  distancePoints: number;
  timeMs?: number;
  timeMultiplier?: number;
  points: number;
  actual: { lat: number; lng: number };
  outOfBounds?: boolean;
  roundDifficulty: Difficulty | null;
  nextRoundStartedAt?: string | null;
}) {
  const {
    admin,
    gameId,
    gameMode,
    totalRounds,
    currentRound,
    isFinal,
    distance_m,
    distancePoints,
    timeMs,
    timeMultiplier,
    points,
    actual,
    roundDifficulty,
    nextRoundStartedAt,
  } = args;

  let nextPhotoUrl: string | null = null;
  let nextRoundDifficulty: Difficulty | null = null;
  if (!isFinal) {
    const { data: nextRound } = await admin
      .from("game_rounds")
      .select("location_id, round_difficulty, locations(image_path)")
      .eq("game_id", gameId)
      .eq("round_number", currentRound + 1)
      .maybeSingle();
    if (nextRound) {
      nextRoundDifficulty = nextRound.round_difficulty as Difficulty | null;
      const locRaw = nextRound.locations as
        | { image_path: string }
        | { image_path: string }[]
        | null;
      const nextLoc = Array.isArray(locRaw) ? locRaw[0] : locRaw;
      if (nextLoc) nextPhotoUrl = await signPhotoUrl(nextLoc.image_path);
    }
  }

  return NextResponse.json({
    round: currentRound,
    totalRounds,
    gameMode,
    roundDifficulty,
    distance_m: Math.round(distance_m),
    distancePoints,
    timeMs: timeMs ?? null,
    timeMultiplier: timeMultiplier ?? null,
    points,
    actual,
    outOfBounds: args.outOfBounds ?? false,
    isFinal,
    nextPhotoUrl,
    nextRoundDifficulty,
    roundStartedAt: nextRoundStartedAt ?? null,
    timeLimitMs: gameMode === "daily" ? DAILY_TIME_LIMIT_MS : null,
  });
}
