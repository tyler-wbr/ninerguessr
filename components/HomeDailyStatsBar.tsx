import type { HomeDailyStats } from "@/lib/homeStats";

export default function HomeDailyStatsBar({ stats }: { stats: HomeDailyStats }) {
  if (!stats.challengeAvailable) {
    return (
      <p className="mt-2 text-sm text-niner-white/85">
        Daily Challenge unlocks when enough campus photos are published.
      </p>
    );
  }

  if (stats.playersToday === 0) {
    return (
      <p className="mt-2 text-sm font-medium text-niner-gold">
        Be the first to play today&apos;s Daily Challenge!
      </p>
    );
  }

  return (
    <p className="mt-2 text-sm text-niner-white/90">
      <span className="font-semibold text-niner-gold">
        {stats.playersToday.toLocaleString()}
      </span>{" "}
      {stats.playersToday === 1 ? "player" : "players"} finished today
      {stats.topScore != null && (
        <>
          {" "}
          · top score{" "}
          <span className="font-semibold text-niner-gold">
            {stats.topScore.toLocaleString()}
          </span>
          {stats.topPlayer && (
            <span className="text-niner-white/75"> ({stats.topPlayer})</span>
          )}
        </>
      )}
    </p>
  );
}
