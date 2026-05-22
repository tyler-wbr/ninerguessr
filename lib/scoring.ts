/**
 * Distance + score math. Pure functions; safe to import from any context.
 */

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type ScoreConfig = {
  fullPointsWithinM: number;
  zeroPointsAtM: number;
  maxPoints: number;
};

export function defaultScoreConfig(): ScoreConfig {
  return {
    fullPointsWithinM: Number(process.env.SCORE_FULL_M ?? 25),
    zeroPointsAtM: Number(process.env.SCORE_ZERO_M ?? 500),
    maxPoints: Number(process.env.SCORE_MAX ?? 5000),
  };
}

/**
 * Smooth decay from `maxPoints` at full-credit distance to 0 at the cutoff.
 * Uses a (1 - t)^1.5 curve which is gentler than linear near the answer but
 * still drops to zero by `zeroPointsAtM`.
 */
export function scoreFromDistance(
  distanceM: number,
  cfg: ScoreConfig = defaultScoreConfig(),
): number {
  const { fullPointsWithinM: full, zeroPointsAtM: zero, maxPoints: max } = cfg;
  if (distanceM <= full) return max;
  if (distanceM >= zero) return 0;
  const t = (distanceM - full) / (zero - full);
  return Math.max(0, Math.round(max * Math.pow(1 - t, 1.5)));
}
