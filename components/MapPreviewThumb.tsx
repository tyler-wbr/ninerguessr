"use client";

import dynamic from "next/dynamic";
import {
  campusBoundaryLatLng,
  campusCenter,
  campusMaxBounds,
} from "@/lib/mapConfig";

const GuessMap = dynamic(() => import("@/components/Map/GuessMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-niner-green/20 animate-pulse" />
  ),
});

export default function MapPreviewThumb({
  onClick,
  label = "Map",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative h-[4.5rem] w-[6.25rem] overflow-hidden rounded-xl border-2 border-niner-white/50 shadow-lg transition-transform hover:scale-105 active:scale-95 sm:h-[5.5rem] sm:w-[7.5rem]"
      aria-label="Open map to make your guess"
    >
      <div className="pointer-events-none absolute inset-0">
        <GuessMap
          center={campusCenter}
          boundary={campusBoundaryLatLng}
          maxBounds={campusMaxBounds}
        />
      </div>
      <div className="absolute inset-0 bg-niner-green/20 group-hover:bg-niner-green/10 transition-colors" />
      <span className="absolute bottom-1.5 left-0 right-0 text-center text-xs font-semibold text-niner-white drop-shadow-md">
        {label}
      </span>
    </button>
  );
}
