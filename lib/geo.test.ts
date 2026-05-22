import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isWithinCampus, loadCampusBoundary } from "./geo";

describe("campus boundary", () => {
  it("loads a polygon geometry", () => {
    const geom = loadCampusBoundary();
    assert.ok(geom.type === "Polygon" || geom.type === "MultiPolygon");
  });

  it("includes the campus center", () => {
    assert.equal(isWithinCampus(35.3074, -80.735), true);
  });

  it("rejects a point far off campus", () => {
    assert.equal(isWithinCampus(35.25, -80.85), false);
  });
});
