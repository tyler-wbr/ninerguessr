import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { startGameSchema } from "@/lib/schemas";
import { rateLimitGameStart } from "@/lib/rateLimit";
import {
  getChallengeDate,
  pickDailyLocations,
  type LocationPick,
} from "@/lib/dailyChallenge";
import {
  CASUAL_ROUNDS,
  DAILY_PER_DIFFICULTY,
} from "@/lib/gameConfig";
import type { Difficulty } from "@/lib/supabase/types";
import { buildGameStartPayload } from "@/lib/gamePayload";

function fisherYatesPick<T>(pool: T[], count: number): T[] {
  const picked = [...pool];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (picked.length - i));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return picked.slice(0, count);
}

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

  const { mode, difficulty } = parsed.data;
  const admin = createAdminSupabaseClient();

  if (mode === "daily") {
    return startDailyGame(admin, user.id);
  }

  return startCasualGame(admin, user.id, difficulty!);
}

async function startCasualGame(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
  difficulty: Difficulty,
) {
  const { data: pool, error: poolErr } = await admin
    .from("locations")
    .select("id, image_path")
    .eq("difficulty", difficulty)
    .eq("is_published", true)
    .not("image_path", "is", null)
    .not("lat", "is", null)
    .not("lng", "is", null);
  if (poolErr) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  if (!pool || pool.length < CASUAL_ROUNDS) {
    return NextResponse.json(
      {
        error: "not_enough_locations",
        message: `Need at least ${CASUAL_ROUNDS} published ${difficulty} locations; found ${pool?.length ?? 0}.`,
      },
      { status: 409 },
    );
  }

  const chosen = fisherYatesPick(pool, CASUAL_ROUNDS);
  const now = new Date().toISOString();

  const { data: game, error: gameErr } = await admin
    .from("games")
    .insert({
      user_id: userId,
      difficulty,
      game_mode: "casual",
      status: "in_progress",
    })
    .select("id, current_round, game_mode, challenge_date, difficulty")
    .single();
  if (gameErr || !game) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const roundsRows = chosen.map((loc, i) => ({
    game_id: game.id,
    location_id: loc.id,
    round_number: i + 1,
    round_difficulty: difficulty,
    round_started_at: i === 0 ? now : null,
  }));
  const { error: roundsErr } = await admin.from("game_rounds").insert(roundsRows);
  if (roundsErr) {
    await admin.from("games").delete().eq("id", game.id);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const payload = await buildGameStartPayload(admin, game);
  return NextResponse.json(payload);
}

async function startDailyGame(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
) {
  const challengeDate = getChallengeDate();

  const { data: existing } = await admin
    .from("games")
    .select("id, status, current_round, game_mode, challenge_date, difficulty")
    .eq("user_id", userId)
    .eq("game_mode", "daily")
    .eq("challenge_date", challengeDate)
    .maybeSingle();

  if (existing) {
    if (existing.status === "completed") {
      return NextResponse.json(
        { error: "already_played", challengeDate },
        { status: 409 },
      );
    }
    if (existing.status === "in_progress") {
      const payload = await buildGameStartPayload(admin, existing);
      return NextResponse.json(payload);
    }
  }

  const { data: allLocs, error: locErr } = await admin
    .from("locations")
    .select("id, image_path, difficulty")
    .eq("is_published", true)
    .not("image_path", "is", null)
    .not("lat", "is", null)
    .not("lng", "is", null);
  if (locErr) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const pools: Record<Difficulty, LocationPick[]> = {
    easy: [],
    medium: [],
    hard: [],
  };
  for (const loc of allLocs ?? []) {
    pools[loc.difficulty as Difficulty].push({
      id: loc.id,
      image_path: loc.image_path,
      difficulty: loc.difficulty as Difficulty,
    });
  }

  for (const d of ["easy", "medium", "hard"] as const) {
    if (pools[d].length < DAILY_PER_DIFFICULTY) {
      return NextResponse.json(
        {
          error: "not_enough_locations",
          message: `Daily challenge needs at least ${DAILY_PER_DIFFICULTY} published ${d} locations; found ${pools[d].length}.`,
        },
        { status: 409 },
      );
    }
  }

  let chosen: LocationPick[];
  try {
    chosen = pickDailyLocations(challengeDate, pools);
  } catch (e) {
    return NextResponse.json(
      {
        error: "not_enough_locations",
        message: e instanceof Error ? e.message : "Cannot build daily challenge",
      },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();

  const { data: game, error: gameErr } = await admin
    .from("games")
    .insert({
      user_id: userId,
      game_mode: "daily",
      challenge_date: challengeDate,
      difficulty: null,
      status: "in_progress",
    })
    .select("id, current_round, game_mode, challenge_date, difficulty")
    .single();
  if (gameErr || !game) {
    if (gameErr?.code === "23505") {
      return NextResponse.json(
        { error: "already_played", challengeDate },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const roundsRows = chosen.map((loc, i) => ({
    game_id: game.id,
    location_id: loc.id,
    round_number: i + 1,
    round_difficulty: loc.difficulty,
    round_started_at: i === 0 ? now : null,
  }));
  const { error: roundsErr } = await admin.from("game_rounds").insert(roundsRows);
  if (roundsErr) {
    await admin.from("games").delete().eq("id", game.id);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const payload = await buildGameStartPayload(admin, game);
  return NextResponse.json(payload);
}
