/**
 * Fetch building footprints from UNC Charlotte OpenGIS and write
 * data/campus-boundary.json as a padded convex hull.
 *
 *   npm run fetch:boundary
 *
 * Source: https://openmaps.uncc.edu/opengis/rest/services/AllCampusNew/MapServer
 * Layer 1201 (Academic Buildings). Re-run if UNCC updates their GIS data.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });

const MAPSERVER =
  "https://openmaps.uncc.edu/opengis/rest/services/AllCampusNew/MapServer";
const LAYERS = [1201, 1202, 1203, 501, 502, 503];
const PAD_DEG = 0.0018; // ~200 m padding so quads between buildings stay in bounds

// Known campus extremities to include areas with sparse building coverage.
const ANCHOR_POINTS: [number, number][] = [
  [-80.744, 35.3045], // south / South Village
  [-80.728, 35.309], // east
  [-80.738, 35.313], // north
  [-80.751, 35.307], // west
];

type LngLat = [number, number];

function collectPoints(geojson: {
  features: { geometry?: { type: string; coordinates: unknown } | null }[];
}): LngLat[] {
  const pts: LngLat[] = [];
  for (const feat of geojson.features) {
    const g = feat.geometry;
    if (!g) continue;
    const pushRing = (ring: LngLat[]) => pts.push(...ring);
    if (g.type === "Polygon") {
      for (const ring of g.coordinates as LngLat[][]) pushRing(ring);
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.coordinates as LngLat[][][]) {
        for (const ring of poly) pushRing(ring);
      }
    }
  }
  return pts;
}

function cross(o: LngLat, a: LngLat, b: LngLat) {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function convexHull(points: LngLat[]): LngLat[] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length <= 2) return pts;

  const lower: LngLat[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: LngLat[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function expandFromCentroid(ring: LngLat[], pad: number): LngLat[] {
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  return ring.map(([lng, lat]) => {
    const dx = lng - cx;
    const dy = lat - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [lng + (dx / len) * pad, lat + (dy / len) * pad] as LngLat;
  });
}

async function fetchLayer(layerId: number): Promise<LngLat[]> {
  const url =
    `${MAPSERVER}/${layerId}/query?` +
    new URLSearchParams({
      where: "1=1",
      returnGeometry: "true",
      outSR: "4326",
      f: "geojson",
      resultRecordCount: "2000",
    });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Layer ${layerId}: HTTP ${res.status}`);
  const data = await res.json();
  return collectPoints(data);
}

async function main() {
  console.log("Fetching UNC Charlotte building footprints…");
  const points: LngLat[] = [...ANCHOR_POINTS];
  for (const layerId of LAYERS) {
    const pts = await fetchLayer(layerId);
    console.log(`  layer ${layerId}: ${pts.length} vertices`);
    points.push(...pts);
  }
  if (points.length < 3) {
    throw new Error("Not enough geometry returned from MapServer.");
  }

  let hull = convexHull(points);
  hull = expandFromCentroid(hull, PAD_DEG);
  hull.push(hull[0]);

  const feature = {
    type: "Feature",
    properties: {
      name: "UNC Charlotte campus (approx.)",
      source: "openmaps.uncc.edu AllCampusNew MapServer — convex hull of building footprints + anchor points",
      generated_at: new Date().toISOString(),
    },
    geometry: {
      type: "Polygon",
      coordinates: [hull],
    },
  };

  const out = resolve(process.cwd(), "data", "campus-boundary.json");
  writeFileSync(out, `${JSON.stringify(feature, null, 2)}\n`);
  console.log(`Wrote ${out} (${hull.length - 1} hull vertices).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
