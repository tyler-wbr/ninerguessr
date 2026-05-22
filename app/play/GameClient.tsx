"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  campusBoundaryLatLng,
  campusCenter,
  campusMaxBounds,
} from "@/lib/mapConfig";
import type { Difficulty } from "@/lib/supabase/types";

const GuessMap = dynamic(() => import("@/components/Map/GuessMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-sm text-muted">
      Loading map…
    </div>
  ),
});

type StartResponse = {
  gameId: string;
  difficulty: Difficulty;
  round: number;
  totalRounds: number;
  photoUrl: string;
};

type GuessResponse = {
  round: number;
  totalRounds: number;
  distance_m: number;
  points: number;
  actual: { lat: number; lng: number };
  outOfBounds: boolean;
  isFinal: boolean;
  nextPhotoUrl: string | null;
};

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "guessing"; gameId: string; round: number; totalRounds: number; photoUrl: string }
  | {
      kind: "revealed";
      gameId: string;
      round: number;
      totalRounds: number;
      photoUrl: string;
      result: GuessResponse;
      runningTotal: number;
      guess: { lat: number; lng: number };
    };

export default function GameClient({ difficulty }: { difficulty: Difficulty }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [runningTotal, setRunningTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const res = await fetch("/api/games/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ difficulty }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message ?? err.error ?? `start failed (${res.status})`);
        }
        const data = (await res.json()) as StartResponse;
        if (cancelled) return;
        setPhase({
          kind: "guessing",
          gameId: data.gameId,
          round: data.round,
          totalRounds: data.totalRounds,
          photoUrl: data.photoUrl,
        });
      } catch (e) {
        if (!cancelled)
          setPhase({
            kind: "error",
            message: e instanceof Error ? e.message : "Failed to start game",
          });
      }
    }
    start();
    return () => {
      cancelled = true;
    };
  }, [difficulty]);

  async function submitGuess() {
    if (phase.kind !== "guessing" || !pin) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/games/${phase.gameId}/guess`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(pin),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "guess failed");
      }
      const result = (await res.json()) as GuessResponse;
      const newTotal = runningTotal + result.points;
      setRunningTotal(newTotal);
      setPhase({
        kind: "revealed",
        gameId: phase.gameId,
        round: phase.round,
        totalRounds: phase.totalRounds,
        photoUrl: phase.photoUrl,
        result,
        runningTotal: newTotal,
        guess: pin,
      });
    } catch (e) {
      setPhase({
        kind: "error",
        message: e instanceof Error ? e.message : "Failed to submit guess",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function nextRound() {
    if (phase.kind !== "revealed") return;
    if (phase.result.isFinal) {
      const res = await fetch(`/api/games/${phase.gameId}/complete`, {
        method: "POST",
      });
      if (res.ok) router.push(`/results/${phase.gameId}`);
      return;
    }
    setPin(null);
    setPhase({
      kind: "guessing",
      gameId: phase.gameId,
      round: phase.round + 1,
      totalRounds: phase.totalRounds,
      photoUrl: phase.result.nextPhotoUrl!,
    });
  }

  if (phase.kind === "loading") {
    return (
      <div className="p-8 text-center text-muted">Starting game…</div>
    );
  }
  if (phase.kind === "error") {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{phase.message}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 link-brand"
        >
          Back to home
        </button>
      </div>
    );
  }

  const round = phase.round;
  const totalRounds = phase.totalRounds;
  const revealed = phase.kind === "revealed";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">
            {difficulty} · round {round} of {totalRounds}
          </div>
          <div className="text-lg font-semibold text-niner-green">
            Score so far: {runningTotal.toLocaleString()}
          </div>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded ${
                i + 1 < round
                  ? "bg-niner-green"
                  : i + 1 === round
                  ? revealed
                    ? "bg-niner-gold"
                    : "bg-niner-green/40"
                  : "bg-niner-green/15"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-lg overflow-hidden border border-niner-green/25 bg-niner-green aspect-video lg:aspect-auto lg:h-[70vh] flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={phase.photoUrl}
            alt={`Round ${round}`}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        <div className="rounded-lg overflow-hidden border border-niner-green/25 h-[60vh] lg:h-[70vh] relative">
          <GuessMap
            center={campusCenter}
            boundary={campusBoundaryLatLng}
            maxBounds={campusMaxBounds}
            reveal={
              revealed
                ? {
                    actual: [phase.result.actual.lat, phase.result.actual.lng],
                    guess: phase.guess
                      ? [phase.guess.lat, phase.guess.lng]
                      : null,
                  }
                : undefined
            }
            onChange={(lat, lng) => setPin({ lat, lng })}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {revealed ? (
          <div className="text-sm text-niner-green">
            <span className="font-bold text-niner-gold">
              {phase.result.points.toLocaleString()} pts
            </span>{" "}
            · {phase.result.distance_m.toLocaleString()} m away
            {phase.result.outOfBounds && (
              <span className="ml-2 text-niner-gold">(out of bounds)</span>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted">
            {pin
              ? `Pin: ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`
              : "Click the map to drop your guess."}
          </div>
        )}

        {revealed ? (
          <button
            onClick={nextRound}
            className="btn-primary px-5 py-2"
          >
            {phase.result.isFinal ? "See results" : "Next round →"}
          </button>
        ) : (
          <button
            disabled={!pin || submitting}
            onClick={submitGuess}
            className="btn-primary px-5 py-2"
          >
            {submitting ? "Submitting…" : "Submit guess"}
          </button>
        )}
      </div>
    </div>
  );
}
