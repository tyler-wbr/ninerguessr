import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  haversineMeters,
  scoreFromDistance,
  defaultScoreConfig,
  timeMultiplier,
  scoreFromDistanceAndTime,
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

describe("timeMultiplier", () => {
  it("returns 1 at zero elapsed", () => {
    assert.equal(timeMultiplier(0, 60_000), 1);
  });

  it("returns 0.5 at the limit", () => {
    assert.equal(timeMultiplier(60_000, 60_000), 0.5);
  });

  it("does not go below 0.5", () => {
    assert.equal(timeMultiplier(120_000, 60_000), 0.5);
  });
});

describe("scoreFromDistanceAndTime", () => {
  const cfg = defaultScoreConfig();

  it("combines distance and time", () => {
    const r = scoreFromDistanceAndTime(10, 0, cfg, 60_000);
    assert.equal(r.distancePoints, cfg.maxPoints);
    assert.equal(r.points, cfg.maxPoints);
    assert.equal(r.timeMs, 0);
  });

  it("applies time penalty at half the limit", () => {
    const r = scoreFromDistanceAndTime(10, 30_000, cfg, 60_000);
    assert.equal(r.distancePoints, cfg.maxPoints);
    assert.equal(r.timeMultiplier, 0.75);
    assert.equal(r.points, Math.round(cfg.maxPoints * 0.75));
  });
});
