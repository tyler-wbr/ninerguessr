"use client";

import dynamic from "next/dynamic";
import {
  campusBoundaryLatLng,
} from "@/lib/mapConfig";

const GuessMap = dynamic(() => import("@/components/Map/GuessMap"), {
  ssr: false,
  loading: () => null,
});

export default function ResultsMap({
  actual,
  guess,
}: {
  actual: { lat: number; lng: number };
  guess: { lat: number; lng: number } | null;
}) {
  return (
    <GuessMap
      center={[actual.lat, actual.lng]}
      boundary={campusBoundaryLatLng}
      reveal={{
        actual: [actual.lat, actual.lng],
        guess: guess ? [guess.lat, guess.lng] : null,
      }}
    />
  );
}
