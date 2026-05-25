"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import HeroLayout from "@/components/HeroLayout";
import HeroButton from "@/components/HeroButton";
import MapGuessSheet from "@/components/MapGuessSheet";
import MapPreviewThumb from "@/components/MapPreviewThumb";
import {
  campusBoundaryLatLng,
  campusCenter,
  campusMaxBounds,
} from "@/lib/mapConfig";
import type { Difficulty, GameMode } from "@/lib/supabase/types";

type StartResponse = {
  gameId: string;
  gameMode: GameMode;
  difficulty: Difficulty | null;
  challengeDate: string | null;
  round: number;
  totalRounds: number;
  roundDifficulty: Difficulty | null;
  photoUrl: string;
  roundStartedAt: string;
  timeLimitMs: number | null;
};

type GuessResponse = {
  round: number;
  totalRounds: number;
  gameMode: GameMode;
  roundDifficulty: Difficulty | null;
  distance_m: number;
  distancePoints: number | null;
  timeMs: number | null;
  timeMultiplier: number | null;
  points: number;
  actual: { lat: number; lng: number };
  outOfBounds: boolean;
  isFinal: boolean;
  nextPhotoUrl: string | null;
  nextRoundDifficulty: Difficulty | null;
  roundStartedAt: string | null;
  timeLimitMs: number | null;
};

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "guessing";
      gameId: string;
      gameMode: GameMode;
      round: number;
      totalRounds: number;
      roundDifficulty: Difficulty | null;
      photoUrl: string;
      roundStartedAt: string;
      timeLimitMs: number | null;
    }
  | {
      kind: "revealed";
      gameId: string;
      gameMode: GameMode;
      round: number;
      totalRounds: number;
      roundDifficulty: Difficulty | null;
      photoUrl: string;
      result: GuessResponse;
      runningTotal: number;
      guess: { lat: number; lng: number };
    };

type GameClientProps =
  | { mode: "casual"; difficulty: Difficulty }
  | { mode: "daily" };

function roundLabel(
  gameMode: GameMode,
  difficulty: Difficulty | null,
  roundDifficulty: Difficulty | null,
): string {
  if (gameMode === "daily") {
    return `daily · ${roundDifficulty ?? "?"}`.toUpperCase();
  }
  return (difficulty ?? "easy").toUpperCase();
}

function RoundTimer({
  roundStartedAt,
  timeLimitMs,
  onExpire,
}: {
  roundStartedAt: string;
  timeLimitMs: number;
  onExpire: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState(timeLimitMs);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    const start = new Date(roundStartedAt).getTime();

    function tick() {
      const elapsed = Date.now() - start;
      const left = Math.max(0, timeLimitMs - elapsed);
      setRemainingMs(left);
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
    }

    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [roundStartedAt, timeLimitMs, onExpire]);

  const secs = Math.ceil(remainingMs / 1000);
  const urgent = remainingMs <= 10_000;

  return (
    <span
      className={`font-mono text-sm font-semibold ${urgent ? "text-red-300" : "text-niner-gold"}`}
    >
      {secs}s
    </span>
  );
}

export default function GameClient(props: GameClientProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [runningTotal, setRunningTotal] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const pinRef = useRef(pin);
  pinRef.current = pin;
  const mode = props.mode;
  const difficulty = props.mode === "casual" ? props.difficulty : undefined;
  const casualDifficulty = difficulty ?? null;

  useEffect(() => {
    let cancelled = false;
    const body =
      mode === "daily"
        ? { mode: "daily" as const }
        : { mode: "casual" as const, difficulty: difficulty! };

    async function start() {
      try {
        const res = await fetch("/api/games/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            err.message ?? err.error ?? `start failed (${res.status})`,
          );
        }
        const data = (await res.json()) as StartResponse;
        if (cancelled) return;
        setPhase({
          kind: "guessing",
          gameId: data.gameId,
          gameMode: data.gameMode,
          round: data.round,
          totalRounds: data.totalRounds,
          roundDifficulty: data.roundDifficulty,
          photoUrl: data.photoUrl,
          roundStartedAt: data.roundStartedAt,
          timeLimitMs: data.timeLimitMs,
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
  }, [mode, difficulty]);

  useEffect(() => {
    if (phase.kind === "revealed") {
      setMapOpen(true);
    }
  }, [phase]);

  const submitGuessAt = useCallback(
    async (coords: { lat: number; lng: number }) => {
      if (phase.kind !== "guessing" || submitting) return;
      setSubmitting(true);
      try {
        const res = await fetch(`/api/games/${phase.gameId}/guess`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(coords),
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
          gameMode: phase.gameMode,
          round: phase.round,
          totalRounds: phase.totalRounds,
          roundDifficulty: phase.roundDifficulty,
          photoUrl: phase.photoUrl,
          result,
          runningTotal: newTotal,
          guess: coords,
        });
        setMapOpen(true);
      } catch (e) {
        setPhase({
          kind: "error",
          message: e instanceof Error ? e.message : "Failed to submit guess",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [phase, runningTotal, submitting],
  );

  const submitGuess = useCallback(() => {
    if (phase.kind !== "guessing" || !pinRef.current) return;
    submitGuessAt(pinRef.current);
  }, [phase, submitGuessAt]);

  const handleTimerExpire = useCallback(() => {
    if (phase.kind !== "guessing" || submitting) return;
    if (pinRef.current) {
      submitGuessAt(pinRef.current);
    } else {
      submitGuessAt({ lat: 0, lng: 0 });
    }
  }, [phase, submitting, submitGuessAt]);

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
    setMapOpen(false);
    setPhase({
      kind: "guessing",
      gameId: phase.gameId,
      gameMode: phase.gameMode,
      round: phase.round + 1,
      totalRounds: phase.totalRounds,
      roundDifficulty: phase.result.nextRoundDifficulty,
      photoUrl: phase.result.nextPhotoUrl!,
      roundStartedAt: phase.result.roundStartedAt!,
      timeLimitMs: phase.result.timeLimitMs,
    });
  }

  if (phase.kind === "loading") {
    return (
      <HeroLayout>
        <div className="flex min-h-[100dvh] items-center justify-center">
          <p className="text-lg text-niner-white/80">Starting game…</p>
        </div>
      </HeroLayout>
    );
  }

  if (phase.kind === "error") {
    const backHref = props.mode === "daily" ? "/challenge" : "/";
    return (
      <HeroLayout>
        <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
          <p className="text-red-300">{phase.message}</p>
          <HeroButton
            variant="secondary"
            className="mt-6"
            onClick={() => router.push(backHref)}
          >
            Back
          </HeroButton>
        </div>
      </HeroLayout>
    );
  }

  const round = phase.round;
  const totalRounds = phase.totalRounds;
  const revealed = phase.kind === "revealed";
  const photoUrl = phase.photoUrl;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl}
        alt={`Round ${round}`}
        className="fixed inset-0 h-[100dvh] w-full object-cover object-center"
      />

      <div className="absolute inset-x-0 top-0 z-20 border-b border-niner-white/10 bg-niner-green/70 px-3 py-2.5 backdrop-blur-md pt-[max(0.625rem,env(safe-area-inset-top))] sm:px-4 sm:py-3">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={props.mode === "daily" ? "/challenge" : "/"}
              className="shrink-0 text-xs font-medium text-niner-white/80 hover:text-niner-gold sm:text-sm"
            >
              ← {props.mode === "daily" ? "Challenge" : "Home"}
            </Link>
            <div className="min-w-0 flex-1 text-center">
              <div className="truncate text-[10px] uppercase tracking-wide text-niner-white/70 sm:text-xs">
                {roundLabel(
                  phase.gameMode,
                  casualDifficulty,
                  phase.roundDifficulty,
                )}{" "}
                · {round}/{totalRounds}
              </div>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <div className="text-sm font-semibold text-niner-gold">
                  {runningTotal.toLocaleString()} pts
                </div>
                {!revealed &&
                  phase.timeLimitMs != null &&
                  phase.kind === "guessing" && (
                    <RoundTimer
                      roundStartedAt={phase.roundStartedAt}
                      timeLimitMs={phase.timeLimitMs}
                      onExpire={handleTimerExpire}
                    />
                  )}
              </div>
            </div>
            <div className="w-14 shrink-0 sm:w-16" aria-hidden />
          </div>
          <div className="mt-2 flex justify-center gap-1">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-4 rounded sm:h-2 sm:w-5 ${
                  i + 1 < round
                    ? "bg-niner-gold"
                    : i + 1 === round
                      ? revealed
                        ? "bg-niner-white"
                        : "bg-niner-white/40"
                      : "bg-niner-white/15"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {revealed && (
        <div className="absolute inset-x-3 top-[5.5rem] z-20 mx-auto max-w-md rounded-xl border border-niner-white/20 bg-niner-green/80 px-3 py-2.5 text-center backdrop-blur-md sm:inset-x-4 sm:top-24 sm:px-4 sm:py-3">
          <div className="text-2xl font-bold text-niner-gold">
            {phase.result.points.toLocaleString()} pts
          </div>
          {phase.result.distancePoints != null &&
            phase.result.timeMultiplier != null && (
              <div className="text-xs text-niner-white/70">
                {phase.result.distancePoints.toLocaleString()} distance ×{" "}
                {Math.round(phase.result.timeMultiplier * 100)}% speed
              </div>
            )}
          <div className="text-sm text-niner-white/90">
            {phase.result.distance_m.toLocaleString()} m away
            {phase.result.outOfBounds && (
              <span className="ml-1 text-niner-gold">(out of bounds)</span>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-[5.5rem] right-3 z-20 sm:bottom-28 sm:right-6">
        <MapPreviewThumb
          onClick={() => setMapOpen(true)}
          label={revealed ? "Map" : "Map"}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-niner-white/10 bg-niner-green/80 px-3 py-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-4">
        <div className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {!revealed ? (
            <>
              <p className="text-center text-xs text-niner-white/80 sm:text-left sm:text-sm">
                {pin ? "Pin placed — submit or adjust on map" : "Tap map to guess"}
              </p>
              <HeroButton
                variant="primary"
                className="w-full sm:w-auto sm:min-w-[9rem]"
                onClick={() => {
                  if (pin) submitGuess();
                  else setMapOpen(true);
                }}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : pin ? "Submit guess" : "Open map"}
              </HeroButton>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="text-center text-sm text-niner-white/80 hover:text-niner-gold sm:text-left"
              >
                View on map
              </button>
              <HeroButton
                variant="primary"
                className="w-full sm:w-auto sm:min-w-[9rem]"
                onClick={nextRound}
              >
                {phase.result.isFinal ? "See results" : "Next round →"}
              </HeroButton>
            </>
          )}
        </div>
      </div>

      <MapGuessSheet
        open={mapOpen}
        onOpenChange={setMapOpen}
        center={campusCenter}
        boundary={campusBoundaryLatLng}
        maxBounds={campusMaxBounds}
        reveal={
          revealed
            ? {
                actual: [phase.result.actual.lat, phase.result.actual.lng],
                guess: [phase.guess.lat, phase.guess.lng],
              }
            : undefined
        }
        onPinChange={(lat, lng) => setPin({ lat, lng })}
        readOnly={revealed}
        onSubmit={revealed ? undefined : submitGuess}
        submitDisabled={!pin}
        submitting={submitting}
        hint={
          pin
            ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`
            : "Tap the map to drop your pin"
        }
      />
    </div>
  );
}
