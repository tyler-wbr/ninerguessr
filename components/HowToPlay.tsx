"use client";

import { useState } from "react";

export default function HowToPlay() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8 w-full text-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hero-text-link"
      >
        {open ? "Hide how to play" : "How to Play & Game Modes"}
      </button>

      {open && (
        <div className="hero-copy-panel mt-4 space-y-4 text-left text-sm text-niner-white/90">
          <section>
            <h2 className="font-semibold text-niner-white">
              Casual (Easy / Medium / Hard)
            </h2>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-niner-white/85">
              <li>5 rounds at one difficulty</li>
              <li>Score based on how close your pin is (up to 5,000 pts per round)</li>
              <li>Guess must be on campus — off-campus pins score 0</li>
              <li>No timer; take your time on the map</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-niner-white">Daily Challenge</h2>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-niner-white/85">
              <li>6 rounds: 2 easy, 2 medium, 2 hard</li>
              <li>Same locations for everyone each day</li>
              <li>60 seconds per round — faster guesses earn a speed bonus</li>
              <li>Final score = distance points × speed multiplier</li>
              <li>One attempt per day (you can resume if you leave mid-game)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-niner-white">Scoring</h2>
            <p className="mt-1 text-niner-white/85">
              Perfect guess within ~25 m = 5,000 pts. Score drops smoothly with
              distance and hits zero around 500 m. Daily mode multiplies by up to
              100% for instant guesses, down to 50% at the time limit.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
