"use client";

import { MapContainer, TileLayer, Polygon, AttributionControl, useMap } from "react-leaflet";
import type { LatLngExpression, LatLngBoundsExpression } from "leaflet";
import { BRAND } from "@/lib/brand";
import { useEffect } from "react";
import { patchLeafletIcons } from "./leafletIcon";

export type BoundaryRings = [number, number][][]; // [lat, lng]

export type CampusMapProps = {
  center: LatLngExpression;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: LatLngBoundsExpression;
  boundary?: BoundaryRings;
  className?: string;
  children?: React.ReactNode;
};

function MapResizeOnMount() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

/**
 * Base campus map. Loads OpenStreetMap tiles. The campus boundary (if given)
 * is drawn as a translucent overlay. Wrap with `dynamic(..., { ssr: false })`
 * before using in a server component.
 */
export default function CampusMap({
  center,
  zoom = 16,
  minZoom = 14,
  maxZoom = 19,
  maxBounds,
  boundary,
  className,
  children,
}: CampusMapProps) {
  useEffect(() => {
    patchLeafletIcons();
  }, []);

  return (
    <div className={className ?? "h-full w-full"}>
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        maxBounds={maxBounds}
        maxBoundsViscosity={1}
        scrollWheelZoom
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <AttributionControl position="bottomright" prefix={false} />
        <MapResizeOnMount />
        {boundary && (
          <Polygon
            positions={boundary}
            pathOptions={{
              color: BRAND.charlotteGreen,
              weight: 2,
              opacity: 0.6,
              fillOpacity: 0.05,
              dashArray: "4 4",
            }}
          />
        )}
        {children}
      </MapContainer>
    </div>
  );
}
