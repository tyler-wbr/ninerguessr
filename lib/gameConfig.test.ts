import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { totalRoundsForMode, DAILY_DIFFICULTY_ORDER } from "./gameConfig";

describe("gameConfig", () => {
  it("returns 5 rounds for casual", () => {
    assert.equal(totalRoundsForMode("casual"), 5);
  });

  it("returns 6 rounds for daily", () => {
    assert.equal(totalRoundsForMode("daily"), 6);
  });

  it("orders daily difficulties EE MM HH", () => {
    assert.deepEqual(DAILY_DIFFICULTY_ORDER, [
      "easy",
      "easy",
      "medium",
      "medium",
      "hard",
      "hard",
    ]);
  });
});
