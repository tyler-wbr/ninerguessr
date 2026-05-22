/**
 * Lightweight point-in-polygon for the campus boundary check. Uses a
 * GeoJSON Polygon or MultiPolygon. Ray-casting; treats coords as planar
 * (fine for a sub-kilometer campus).
 */

import fs from "node:fs";
import path from "node:path";

type Ring = [number, number][]; // [lng, lat] per GeoJSON
type PolyGeom =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };

type Feature = { type: "Feature"; geometry: PolyGeom; properties?: unknown };
type FeatureCollection = { type: "FeatureCollection"; features: Feature[] };

let cached: PolyGeom | null = null;

export function loadCampusBoundary(): PolyGeom {
  if (cached) return cached;
  const file = path.join(process.cwd(), "data", "campus-boundary.json");
  const raw = fs.readFileSync(file, "utf8");
  const parsed = JSON.parse(raw) as PolyGeom | Feature | FeatureCollection;
  if (parsed.type === "FeatureCollection") {
    cached = parsed.features[0].geometry;
  } else if (parsed.type === "Feature") {
    cached = parsed.geometry;
  } else {
    cached = parsed;
  }
  return cached!;
}

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lng: number, lat: number, rings: Ring[]): boolean {
  if (!pointInRing(lng, lat, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(lng, lat, rings[i])) return false;
  }
  return true;
}

export function isWithinCampus(lat: number, lng: number): boolean {
  const geom = loadCampusBoundary();
  if (geom.type === "Polygon") {
    return pointInPolygon(lng, lat, geom.coordinates);
  }
  return geom.coordinates.some((poly) => pointInPolygon(lng, lat, poly));
}
