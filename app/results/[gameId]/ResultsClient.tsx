"use client";

import { useState } from "react";
import HeroButton from "@/components/HeroButton";
import MapGuessSheet from "@/components/MapGuessSheet";
import MapPreviewThumb from "@/components/MapPreviewThumb";
import {
  campusBoundaryLatLng,
  campusMaxBounds,
} from "@/lib/mapConfig";
import type { Difficulty, GameMode } from "@/lib/supabase/types";

export type ResultRound = {
  round_number: number;
  round_difficulty: Difficulty | null;
  guess_lat: number | null;
  guess_lng: number | null;
  distance_m: number | null;
  distance_points: number | null;
  time_ms: number | null;
  points: number | null;
  photoUrl: string | null;
  loc: {
    lat: number;
    lng: number;
    title: string | null;
  } | null;
};

export default function ResultsClient({
  gameMode,
  difficulty,
  challengeDate,
  totalScore,
  rounds,
}: {
  gameMode: GameMode;
  difficulty: Difficulty | null;
  challengeDate: string | null;
  totalScore: number;
  rounds: ResultRound[];
}) {
  const [openRound, setOpenRound] = useState<number | null>(null);

  const activeRound = rounds.find((r) => r.round_number === openRound);

  return (
    <>
      <div className="flex min-h-[100dvh] flex-col px-6 py-20">
        <div className="mx-auto w-full max-w-lg text-center">
          <div className="text-sm uppercase tracking-wide text-niner-white/70">
            {gameMode === "daily"
              ? `Daily challenge${challengeDate ? ` · ${challengeDate}` : ""}`
              : `${difficulty} game complete`}
          </div>
          <div className="mt-2 text-5xl font-bold text-niner-gold">
            {totalScore.toLocaleString()}
          </div>
          <div className="text-niner-white/70">total points</div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {gameMode === "daily" ? (
              <HeroButton href="/challenge" variant="primary">
                Daily Challenge
              </HeroButton>
            ) : (
              <HeroButton
                href={`/play?difficulty=${difficulty}`}
                variant="primary"
              >
                Play again
              </HeroButton>
            )}
            <HeroButton
              href={
                gameMode === "daily"
                  ? "/leaderboard?board=daily"
                  : "/leaderboard"
              }
              variant="secondary"
            >
              Leaderboard
            </HeroButton>
          </div>
        </div>

        <div className="mx-auto mt-10 w-full max-w-2xl space-y-6 pb-12">
          {rounds.map((r) => (
            <div
              key={r.round_number}
              className="hero-glass relative overflow-hidden p-0"
            >
              <div className="relative aspect-video w-full overflow-hidden">
                {r.photoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={r.photoUrl}
                    alt={`Round ${r.round_number}`}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-niner-green/60 text-niner-white/50">
                    No photo
                  </div>
                )}

                <div className="absolute bottom-3 right-3">
                  <MapPreviewThumb
                    onClick={() => setOpenRound(r.round_number)}
                    label="Map"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <div className="text-sm text-niner-white">
                  <span className="font-bold">Round {r.round_number}</span>
                  {r.round_difficulty && (
                    <span className="text-niner-white/50 capitalize">
                      {" "}
                      · {r.round_difficulty}
                    </span>
                  )}
                  {r.loc?.title && (
                    <span className="text-niner-white/60"> · {r.loc.title}</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-niner-gold">
                    {r.points?.toLocaleString() ?? 0} pts
                  </div>
                  {r.distance_points != null && r.time_ms != null && (
                    <div className="text-xs text-niner-white/50">
                      {r.distance_points.toLocaleString()} × speed
                    </div>
                  )}
                  <div className="text-xs text-niner-white/60">
                    {r.distance_m != null
                      ? `${Math.round(r.distance_m).toLocaleString()} m away`
                      : "no guess"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeRound?.loc && (
        <MapGuessSheet
          open={openRound !== null}
          onOpenChange={(open) => !open && setOpenRound(null)}
          center={[activeRound.loc.lat, activeRound.loc.lng]}
          boundary={campusBoundaryLatLng}
          maxBounds={campusMaxBounds}
          reveal={{
            actual: [activeRound.loc.lat, activeRound.loc.lng],
            guess:
              activeRound.guess_lat != null && activeRound.guess_lng != null
                ? [activeRound.guess_lat, activeRound.guess_lng]
                : null,
          }}
          readOnly
        />
      )}
    </>
  );
}
