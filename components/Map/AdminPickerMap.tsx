"use client";

import dynamic from "next/dynamic";
import { Marker, useMapEvents } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { useState, useEffect } from "react";
import type { BoundaryRings } from "./CampusMap";

const CampusMap = dynamic(() => import("./CampusMap"), { ssr: false });

export type AdminPickerMapProps = {
  center: LatLngExpression;
  boundary?: BoundaryRings;
  initial?: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
};

function PickerMarker({
  initial,
  onChange,
}: {
  initial: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const [pos, setPos] = useState<LatLngExpression | null>(
    initial ? [initial.lat, initial.lng] : null,
  );
  useEffect(() => {
    if (initial) setPos([initial.lat, initial.lng]);
  }, [initial]);
  useMapEvents({
    click(e) {
      setPos([e.latlng.lat, e.latlng.lng]);
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return pos ? (
    <Marker
      position={pos}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const m = e.target as L.Marker;
          const ll = m.getLatLng();
          setPos([ll.lat, ll.lng]);
          onChange(ll.lat, ll.lng);
        },
      }}
    />
  ) : null;
}

export default function AdminPickerMap({
  center,
  boundary,
  initial,
  onChange,
}: AdminPickerMapProps) {
  return (
    <CampusMap center={center} boundary={boundary} className="h-full w-full">
      <PickerMarker initial={initial ?? null} onChange={onChange} />
    </CampusMap>
  );
}
