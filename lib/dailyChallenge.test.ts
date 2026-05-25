import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getChallengeDate, pickDailyLocations } from "./dailyChallenge";

describe("getChallengeDate", () => {
  it("returns YYYY-MM-DD format", () => {
    const d = getChallengeDate(new Date("2026-05-22T15:00:00Z"));
    assert.match(d, /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("pickDailyLocations", () => {
  const pools = {
    easy: [
      { id: "e1", image_path: "e1.jpg", difficulty: "easy" as const },
      { id: "e2", image_path: "e2.jpg", difficulty: "easy" as const },
      { id: "e3", image_path: "e3.jpg", difficulty: "easy" as const },
    ],
    medium: [
      { id: "m1", image_path: "m1.jpg", difficulty: "medium" as const },
      { id: "m2", image_path: "m2.jpg", difficulty: "medium" as const },
      { id: "m3", image_path: "m3.jpg", difficulty: "medium" as const },
    ],
    hard: [
      { id: "h1", image_path: "h1.jpg", difficulty: "hard" as const },
      { id: "h2", image_path: "h2.jpg", difficulty: "hard" as const },
      { id: "h3", image_path: "h3.jpg", difficulty: "hard" as const },
    ],
  };

  it("picks 2 per difficulty in EE MM HH order", () => {
    const picks = pickDailyLocations("2026-05-22", pools);
    assert.equal(picks.length, 6);
    assert.equal(picks.filter((p) => p.difficulty === "easy").length, 2);
    assert.equal(picks.filter((p) => p.difficulty === "medium").length, 2);
    assert.equal(picks.filter((p) => p.difficulty === "hard").length, 2);
    assert.deepEqual(
      picks.map((p) => p.difficulty),
      ["easy", "easy", "medium", "medium", "hard", "hard"],
    );
  });

  it("is deterministic for the same date", () => {
    const a = pickDailyLocations("2026-05-22", pools);
    const b = pickDailyLocations("2026-05-22", pools);
    assert.deepEqual(
      a.map((p) => p.id),
      b.map((p) => p.id),
    );
  });

  it("differs across dates", () => {
    const a = pickDailyLocations("2026-05-22", pools);
    const b = pickDailyLocations("2026-05-23", pools);
    assert.notDeepEqual(
      a.map((p) => p.id),
      b.map((p) => p.id),
    );
  });

  it("throws when a difficulty pool is too small", () => {
    const small = {
      ...pools,
      hard: [pools.hard[0]],
    };
    assert.throws(
      () => pickDailyLocations("2026-05-22", small),
      /Need at least 2 published hard locations/,
    );
  });
});
