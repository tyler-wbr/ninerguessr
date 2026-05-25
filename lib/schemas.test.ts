import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { startGameSchema } from "./schemas";

describe("startGameSchema", () => {
  it("requires difficulty for casual mode", () => {
    const r = startGameSchema.safeParse({ mode: "casual" });
    assert.equal(r.success, false);
  });

  it("accepts casual with difficulty", () => {
    const r = startGameSchema.safeParse({ mode: "casual", difficulty: "easy" });
    assert.equal(r.success, true);
  });

  it("accepts daily without difficulty", () => {
    const r = startGameSchema.safeParse({ mode: "daily" });
    assert.equal(r.success, true);
  });

  it("defaults mode to casual", () => {
    const r = startGameSchema.safeParse({ difficulty: "hard" });
    assert.equal(r.success, true);
    if (r.success) {
      assert.equal(r.data.mode, "casual");
      assert.equal(r.data.difficulty, "hard");
    }
  });
});
