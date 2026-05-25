"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Difficulty } from "@/lib/supabase/types";

type Mode = "single" | "avg";
type Board = "casual" | "daily";

type CasualRow =
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

type DailyRow = {
  user_id: string;
  display_name: string;
  total_score: number;
  game_id: string;
  completed_at: string;
};

const tabActive = "bg-niner-gold text-niner-green font-semibold";
const tabInactive =
  "text-niner-white/80 hover:bg-niner-white/10 hover:text-niner-white";

export default function LeaderboardClient({
  initialBoard,
  initialDifficulty,
  initialMode,
}: {
  initialBoard: Board;
  initialDifficulty: Difficulty;
  initialMode: Mode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [board, setBoard] = useState<Board>(initialBoard);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [rows, setRows] = useState<(CasualRow | DailyRow)[]>([]);
  const [challengeDate, setChallengeDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function syncUrl(next: { board?: Board; difficulty?: Difficulty; mode?: Mode }) {
    const b = next.board ?? board;
    const params = new URLSearchParams(searchParams.toString());
    params.set("board", b);
    if (b === "casual") {
      params.set("difficulty", next.difficulty ?? difficulty);
      params.set("mode", next.mode ?? mode);
    } else {
      params.delete("difficulty");
      params.delete("mode");
    }
    router.replace(`/leaderboard?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url =
      board === "daily"
        ? `/api/leaderboard?board=daily&limit=100`
        : `/api/leaderboard?board=casual&difficulty=${difficulty}&mode=${mode}&limit=100`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setRows(data.rows ?? []);
          setChallengeDate(data.date ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [board, difficulty, mode]);

  return (
    <div>
      <div className="mb-6 inline-flex overflow-hidden rounded-xl border border-niner-white/30">
        <button
          onClick={() => {
            setBoard("casual");
            syncUrl({ board: "casual" });
          }}
          className={`px-4 py-1.5 text-sm transition-colors ${
            board === "casual" ? tabActive : tabInactive
          }`}
        >
          Casual
        </button>
        <button
          onClick={() => {
            setBoard("daily");
            syncUrl({ board: "daily" });
          }}
          className={`px-4 py-1.5 text-sm transition-colors ${
            board === "daily" ? tabActive : tabInactive
          }`}
        >
          Daily Challenge
        </button>
      </div>

      {board === "daily" && challengeDate && (
        <p className="mb-4 text-sm text-niner-white/60">
          Scores for {challengeDate}
        </p>
      )}

      {board === "casual" && (
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="inline-flex overflow-hidden rounded-xl border border-niner-white/30">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d);
                  syncUrl({ difficulty: d });
                }}
                className={`px-3 py-1.5 text-sm capitalize transition-colors ${
                  difficulty === d ? tabActive : tabInactive
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="inline-flex overflow-hidden rounded-xl border border-niner-white/30">
            <button
              onClick={() => {
                setMode("single");
                syncUrl({ mode: "single" });
              }}
              className={`px-3 py-1.5 text-sm transition-colors ${
                mode === "single" ? tabActive : tabInactive
              }`}
            >
              Best single game
            </button>
            <button
              onClick={() => {
                setMode("avg");
                syncUrl({ mode: "avg" });
              }}
              className={`px-3 py-1.5 text-sm transition-colors ${
                mode === "avg" ? tabActive : tabInactive
              }`}
            >
              Best average (5+ games)
            </button>
          </div>
        </div>
      )}

      <table className="w-full text-sm text-niner-white">
        <thead>
          <tr className="text-left text-niner-white/60">
            <th className="py-2 w-12">#</th>
            <th>Player</th>
            <th className="text-right">
              {board === "daily"
                ? "Score"
                : mode === "single"
                  ? "Score"
                  : "Avg score"}
            </th>
            {board === "casual" && mode === "avg" && (
              <th className="text-right">Games</th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-niner-white/60">
                Loading…
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-niner-white/60">
                No qualifying scores yet.
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row, i) => (
              <tr
                key={
                  "game_id" in row
                    ? row.game_id
                    : `${row.user_id}-${board}-${i}`
                }
                className="border-t border-niner-white/10"
              >
                <td className="py-2.5 font-mono text-niner-white/50">
                  {i + 1}
                </td>
                <td className="font-medium">{row.display_name}</td>
                <td className="text-right font-semibold text-niner-gold">
                  {("total_score" in row
                    ? row.total_score
                    : "avg_score" in row
                      ? row.avg_score
                      : 0
                  ).toLocaleString()}
                </td>
                {board === "casual" && mode === "avg" && "games_played" in row && (
                  <td className="text-right text-niner-white/60">
                    {row.games_played}
                  </td>
                )}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
