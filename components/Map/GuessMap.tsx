"use client";

import dynamic from "next/dynamic";
import { Marker, useMapEvents, Polyline, Popup } from "react-leaflet";
import { useState } from "react";
import type { LatLngExpression, LatLngBoundsExpression } from "leaflet";
import { BRAND } from "@/lib/brand";
import type { BoundaryRings } from "./CampusMap";

const CampusMap = dynamic(() => import("./CampusMap"), { ssr: false });

export type GuessMapProps = {
  center: LatLngExpression;
  boundary?: BoundaryRings;
  maxBounds?: LatLngBoundsExpression;
  // When set, marker drop is disabled and these are shown instead.
  reveal?: {
    actual: LatLngExpression;
    guess: LatLngExpression | null;
  };
  onChange?: (lat: number, lng: number) => void;
};

function MarkerDropper({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  const [pos, setPos] = useState<LatLngExpression | null>(null);
  useMapEvents({
    click(e) {
      setPos([e.latlng.lat, e.latlng.lng]);
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return pos ? <Marker position={pos} /> : null;
}

export default function GuessMap({
  center,
  boundary,
  maxBounds,
  reveal,
  onChange,
}: GuessMapProps) {
  return (
    <CampusMap
      center={center}
      boundary={boundary}
      maxBounds={maxBounds}
      className="h-full w-full"
    >
      {reveal ? (
        <>
          <Marker position={reveal.actual}>
            <Popup>Actual location</Popup>
          </Marker>
          {reveal.guess && (
            <>
              <Marker position={reveal.guess}>
                <Popup>Your guess</Popup>
              </Marker>
              <Polyline
                positions={[reveal.guess, reveal.actual]}
                pathOptions={{ color: BRAND.ninerGold, weight: 2, dashArray: "6 6" }}
              />
            </>
          )}
        </>
      ) : (
        <MarkerDropper onPick={onChange ?? (() => {})} />
      )}
    </CampusMap>
  );
}
