/**
 * Shared campus boundary helpers. GeoJSON rings use [lng, lat]; Leaflet uses [lat, lng].
 */

import boundaryFeature from "@/data/campus-boundary.json";

type Ring = [number, number][]; // [lng, lat]
type PolyGeom =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };

type Feature = { type: "Feature"; geometry: PolyGeom; properties?: unknown };
type FeatureCollection = { type: "FeatureCollection"; features: Feature[] };

export function extractCampusGeometry(
  data: PolyGeom | Feature | FeatureCollection,
): PolyGeom {
  if (data.type === "FeatureCollection") {
    return data.features[0].geometry;
  }
  if (data.type === "Feature") {
    return data.geometry;
  }
  return data;
}

export function geoJsonToLeafletRings(geom: PolyGeom): [number, number][][] {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  return polys.map((rings) => rings[0].map(([lng, lat]) => [lat, lng] as [number, number]));
}

export function boundsFromGeometry(geom: PolyGeom): [[number, number], [number, number]] {
  const rings =
    geom.type === "Polygon"
      ? geom.coordinates
      : geom.coordinates.flatMap((poly) => poly);
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }
  }
  const pad = 0.002;
  return [
    [minLat - pad, minLng - pad],
    [maxLat + pad, maxLng + pad],
  ];
}

const campusGeometry = extractCampusGeometry(
  boundaryFeature as Feature | FeatureCollection | PolyGeom,
);

export const campusBoundaryLatLng = geoJsonToLeafletRings(campusGeometry);
export const campusMaxBounds = boundsFromGeometry(campusGeometry);
