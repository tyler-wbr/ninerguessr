"use client";

import { useEffect, useState } from "react";
import type { Difficulty } from "@/lib/supabase/types";

type Mode = "single" | "avg";

type Row =
  | {
      user_id: string;
      display_name: string;
      total_score: number;
      game_id: string;
      completed_at: string;
    }
  | {
      user_id: string;
      display_name: string;
      avg_score: number;
      games_played: number;
    };

const tabActive = "bg-niner-green text-niner-white";
const tabInactive = "text-niner-green hover:bg-niner-gold/15";

export default function LeaderboardClient({
  initialDifficulty,
  initialMode,
}: {
  initialDifficulty: Difficulty;
  initialMode: Mode;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/leaderboard?difficulty=${difficulty}&mode=${mode}&limit=100`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setRows(data.rows ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [difficulty, mode]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="inline-flex rounded border border-niner-green/25 overflow-hidden">
          {(["easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 text-sm capitalize ${
                difficulty === d ? tabActive : tabInactive
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded border border-niner-green/25 overflow-hidden">
          <button
            onClick={() => setMode("single")}
            className={`px-3 py-1.5 text-sm ${
              mode === "single" ? tabActive : tabInactive
            }`}
          >
            Best single game
          </button>
          <button
            onClick={() => setMode("avg")}
            className={`px-3 py-1.5 text-sm ${
              mode === "avg" ? tabActive : tabInactive
            }`}
          >
            Best average (5+ games)
          </button>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="table-head">
          <tr>
            <th className="py-2 w-12">#</th>
            <th>Player</th>
            <th className="text-right">
              {mode === "single" ? "Score" : "Avg score"}
            </th>
            {mode === "avg" && <th className="text-right">Games</th>}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-muted">
                Loading…
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-muted">
                No qualifying scores yet.
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row, i) => (
              <tr
                key={
                  "game_id" in row ? row.game_id : `${row.user_id}-${difficulty}`
                }
                className="table-row"
              >
                <td className="py-2 font-mono text-muted">{i + 1}</td>
                <td className="font-medium">{row.display_name}</td>
                <td className="text-right font-semibold text-niner-gold">
                  {("total_score" in row
                    ? row.total_score
                    : row.avg_score
                  ).toLocaleString()}
                </td>
                {mode === "avg" && "games_played" in row && (
                  <td className="text-right text-muted">{row.games_played}</td>
                )}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
