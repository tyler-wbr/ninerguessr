import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  haversineMeters,
  scoreFromDistance,
  defaultScoreConfig,
} from "./scoring";

describe("haversineMeters", () => {
  it("returns 0 for identical points", () => {
    assert.equal(haversineMeters(35.3074, -80.735, 35.3074, -80.735), 0);
  });

  it("is symmetric", () => {
    const d1 = haversineMeters(35.3074, -80.735, 35.308, -80.734);
    const d2 = haversineMeters(35.308, -80.734, 35.3074, -80.735);
    assert.ok(Math.abs(d1 - d2) < 1e-6);
  });
});

describe("scoreFromDistance", () => {
  const cfg = defaultScoreConfig();

  it("awards max points within full-credit distance", () => {
    assert.equal(scoreFromDistance(10, cfg), cfg.maxPoints);
    assert.equal(scoreFromDistance(cfg.fullPointsWithinM, cfg), cfg.maxPoints);
  });

  it("awards zero at or beyond cutoff", () => {
    assert.equal(scoreFromDistance(cfg.zeroPointsAtM, cfg), 0);
    assert.equal(scoreFromDistance(cfg.zeroPointsAtM + 100, cfg), 0);
  });

  it("decays smoothly between full credit and cutoff", () => {
    const mid = scoreFromDistance(200, cfg);
    assert.ok(mid > 0 && mid < cfg.maxPoints);
  });
});
