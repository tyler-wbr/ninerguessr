import type { Difficulty } from "@/lib/supabase/types";

export type GameMode = "casual" | "daily";

export const CASUAL_ROUNDS = Number(process.env.GAME_ROUNDS ?? 5);
export const DAILY_ROUNDS = Number(process.env.DAILY_CHALLENGE_ROUNDS ?? 6);
export const DAILY_PER_DIFFICULTY = Number(
  process.env.DAILY_CHALLENGE_PER_DIFFICULTY ?? 2,
);
export const DAILY_TIME_LIMIT_MS = Number(
  process.env.DAILY_ROUND_TIME_SEC ?? 60,
) * 1000;

export const CHALLENGE_TIMEZONE =
  process.env.CHALLENGE_TIMEZONE ?? "America/New_York";

export const DAILY_DIFFICULTY_ORDER: Difficulty[] = [
  "easy",
  "easy",
  "medium",
  "medium",
  "hard",
  "hard",
];

export function totalRoundsForMode(mode: GameMode): number {
  return mode === "daily" ? DAILY_ROUNDS : CASUAL_ROUNDS;
}

export function minLocationsPerDifficulty(mode: GameMode): number {
  return mode === "daily" ? DAILY_PER_DIFFICULTY : totalRoundsForMode(mode);
}
