import { createHash } from "crypto";
import type { Difficulty } from "@/lib/supabase/types";
import {
  CHALLENGE_TIMEZONE,
  DAILY_DIFFICULTY_ORDER,
  DAILY_PER_DIFFICULTY,
} from "@/lib/gameConfig";

export type LocationPick = { id: string; image_path: string; difficulty: Difficulty };

/** Calendar date YYYY-MM-DD in the challenge timezone. */
export function getChallengeDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CHALLENGE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function mulberry32(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromDate(date: string): number {
  const salt = process.env.DAILY_CHALLENGE_SALT ?? "niner-guessr-dev-salt";
  const hex = createHash("sha256").update(`${date}:${salt}`).digest("hex");
  return parseInt(hex.slice(0, 8), 16);
}

function shuffleInPlace<T>(items: T[], rand: () => number) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

/**
 * Deterministic daily location set: 2 easy, 2 medium, 2 hard (order fixed).
 * Same date + salt => same locations for all players.
 */
export function pickDailyLocations(
  date: string,
  pools: Record<Difficulty, LocationPick[]>,
): LocationPick[] {
  const rand = mulberry32(seedFromDate(date));
  const chosen: LocationPick[] = [];

  for (const difficulty of ["easy", "medium", "hard"] as const) {
    const pool = [...pools[difficulty]];
    shuffleInPlace(pool, rand);
    const picks = pool.slice(0, DAILY_PER_DIFFICULTY);
    if (picks.length < DAILY_PER_DIFFICULTY) {
      throw new Error(
        `Need at least ${DAILY_PER_DIFFICULTY} published ${difficulty} locations for daily challenge`,
      );
    }
    chosen.push(...picks);
  }

  // Interleave in gameplay order: EE MM HH
  const byDiff: Record<Difficulty, LocationPick[]> = {
    easy: chosen.filter((l) => l.difficulty === "easy"),
    medium: chosen.filter((l) => l.difficulty === "medium"),
    hard: chosen.filter((l) => l.difficulty === "hard"),
  };

  const counters: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  return DAILY_DIFFICULTY_ORDER.map((d) => {
    const loc = byDiff[d][counters[d]];
    counters[d]++;
    return loc;
  });
}

export function formatChallengeDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHALLENGE_TIMEZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(dt);
}
