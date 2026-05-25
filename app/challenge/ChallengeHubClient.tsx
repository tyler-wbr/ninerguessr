"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HeroButton from "@/components/HeroButton";

type TodayChallenge = {
  date: string;
  dateLabel: string;
  available: boolean;
  rounds: number;
  timeLimitSec: number;
  userStatus: "not_started" | "in_progress" | "completed";
  gameId: string | null;
  completedScore: number | null;
};

export default function ChallengeHubClient() {
  const [info, setInfo] = useState<TodayChallenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenge/today")
      .then((r) => r.json())
      .then(setInfo)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-center text-niner-white/70">Loading today&apos;s challenge…</p>
    );
  }

  if (!info) {
    return (
      <p className="text-center text-red-300">Could not load daily challenge.</p>
    );
  }

  return (
    <div className="w-full max-w-md text-center">
      <p className="text-sm uppercase tracking-wide text-niner-gold">
        Daily Challenge
      </p>
      <h1 className="mt-2 text-2xl font-bold text-niner-white sm:text-3xl">
        {info.dateLabel}
      </h1>
      <p className="mt-3 text-sm text-niner-white/70">
        {info.rounds} rounds · 2 easy, 2 medium, 2 hard · {info.timeLimitSec}s
        per round
      </p>
      <p className="mt-1 text-xs text-niner-white/50">
        Score = accuracy × speed. Same locations for everyone today.
      </p>

      <div className="hero-glass mt-8 text-left text-sm text-niner-white/80">
        <ul className="list-inside list-disc space-y-1">
          <li>One attempt per day</li>
          <li>Faster guesses earn a speed bonus</li>
          <li>Resumes if you leave mid-game</li>
        </ul>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {!info.available && (
          <p className="text-sm text-niner-gold">
            Not enough published photos yet for today&apos;s challenge.
          </p>
        )}

        {info.userStatus === "completed" && info.completedScore != null && (
          <div className="rounded-xl border border-niner-gold/40 bg-niner-gold/10 px-4 py-3">
            <div className="text-xs uppercase text-niner-white/70">
              Your score today
            </div>
            <div className="text-3xl font-bold text-niner-gold">
              {info.completedScore.toLocaleString()}
            </div>
            {info.gameId && (
              <Link
                href={`/results/${info.gameId}`}
                className="mt-1 inline-block text-sm text-niner-white/80 hover:text-niner-gold"
              >
                View results →
              </Link>
            )}
          </div>
        )}

        {info.available && info.userStatus !== "completed" && (
          <HeroButton href="/challenge/play" variant="primary" fullWidth>
            {info.userStatus === "in_progress"
              ? "Continue challenge"
              : "Play today's challenge"}
          </HeroButton>
        )}

        <HeroButton href="/leaderboard?board=daily" variant="secondary" fullWidth>
          Today&apos;s leaderboard
        </HeroButton>
        <HeroButton href="/" variant="secondary" fullWidth>
          Home
        </HeroButton>
      </div>
    </div>
  );
}
