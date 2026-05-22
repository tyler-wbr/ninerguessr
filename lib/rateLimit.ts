import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

// Fallback: per-process in-memory limiter for local dev when Upstash isn't
// configured. Not safe across serverless instances; do not rely on it in prod.
const memory = new Map<string, { hits: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const cur = memory.get(key);
  if (!cur || cur.resetAt < now) {
    memory.set(key, { hits: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }
  cur.hits += 1;
  return { success: cur.hits <= limit, remaining: Math.max(0, limit - cur.hits) };
}

function makeUpstashLimiter(limit: number, window: `${number} ${"s" | "m" | "h"}`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: "ng:rl",
  });
}

const gameStartLimiter = makeUpstashLimiter(30, "1 h");
const gameGuessLimiter = makeUpstashLimiter(60, "1 m");

export async function rateLimitGameStart(userId: string) {
  if (gameStartLimiter) return gameStartLimiter.limit(`start:${userId}`);
  return memoryLimit(`start:${userId}`, 30, 60 * 60 * 1000);
}

export async function rateLimitGameGuess(userId: string) {
  if (gameGuessLimiter) return gameGuessLimiter.limit(`guess:${userId}`);
  return memoryLimit(`guess:${userId}`, 60, 60 * 1000);
}
