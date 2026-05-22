import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import {
  campusBoundaryLatLng,
  campusMaxBounds,
} from "@/lib/campusBoundary";

export { campusBoundaryLatLng, campusMaxBounds };

export const campusCenter: LatLngExpression = [
  Number(process.env.NEXT_PUBLIC_CAMPUS_CENTER_LAT ?? 35.3074),
  Number(process.env.NEXT_PUBLIC_CAMPUS_CENTER_LNG ?? -80.735),
];

export type BoundaryRings = typeof campusBoundaryLatLng;
