import type { Difficulty } from "@/lib/supabase/types";
import { DAILY_TIME_LIMIT_MS, totalRoundsForMode } from "@/lib/gameConfig";
import type { GameMode } from "@/lib/gameConfig";
import { signPhotoUrl } from "@/lib/photoUrl";

type AdminClient = ReturnType<
  typeof import("@/lib/supabase/admin").createAdminSupabaseClient
>;

export async function buildGameStartPayload(
  admin: AdminClient,
  game: {
    id: string;
    game_mode: GameMode;
    challenge_date: string | null;
    difficulty: Difficulty | null;
    current_round: number;
  },
) {
  const mode = game.game_mode;
  const totalRounds = totalRoundsForMode(mode);

  const { data: round } = await admin
    .from("game_rounds")
    .select(
      "round_number, location_id, round_difficulty, round_started_at, locations(image_path)",
    )
    .eq("game_id", game.id)
    .eq("round_number", game.current_round)
    .maybeSingle();

  if (!round) throw new Error("round_missing");

  const locRaw = round.locations as
    | { image_path: string }
    | { image_path: string }[]
    | null;
  const loc = Array.isArray(locRaw) ? locRaw[0] : locRaw;
  if (!loc) throw new Error("location_missing");

  const photoUrl = await signPhotoUrl(loc.image_path);
  const roundStartedAt =
    round.round_started_at ?? new Date().toISOString();

  if (!round.round_started_at) {
    await admin
      .from("game_rounds")
      .update({ round_started_at: roundStartedAt })
      .eq("game_id", game.id)
      .eq("round_number", game.current_round);
  }

  return {
    gameId: game.id,
    gameMode: mode,
    difficulty: game.difficulty,
    challengeDate: game.challenge_date,
    round: game.current_round,
    totalRounds,
    roundDifficulty: round.round_difficulty as Difficulty | null,
    photoUrl,
    roundStartedAt,
    timeLimitMs: mode === "daily" ? DAILY_TIME_LIMIT_MS : null,
  };
}
