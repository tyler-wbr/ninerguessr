"use client";

import dynamic from "next/dynamic";
import { useEffect, useCallback } from "react";
import type { BoundaryRings } from "@/components/Map/CampusMap";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import HeroButton from "@/components/HeroButton";

const GuessMap = dynamic(() => import("@/components/Map/GuessMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-sm text-muted">
      Loading map…
    </div>
  ),
});

export type MapGuessSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  center: LatLngExpression;
  boundary?: BoundaryRings;
  maxBounds?: LatLngBoundsExpression;
  reveal?: {
    actual: LatLngExpression;
    guess: LatLngExpression | null;
  };
  onPinChange?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  submitLabel?: string;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  submitting?: boolean;
  hint?: string;
};

export default function MapGuessSheet({
  open,
  onOpenChange,
  center,
  boundary,
  maxBounds,
  reveal,
  onPinChange,
  readOnly = false,
  submitLabel = "Submit guess",
  onSubmit,
  submitDisabled = false,
  submitting = false,
  hint,
}: MapGuessSheetProps) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        className={`map-sheet-backdrop ${open ? "map-sheet-backdrop-open" : "map-sheet-backdrop-closed"}`}
        onClick={close}
        aria-hidden={!open}
      />

      <div
        className={`map-sheet-panel ${open ? "map-sheet-panel-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-niner-green/10 px-4 py-3">
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-niner-green hover:bg-niner-green/5"
          >
            Close
          </button>
          <span className="text-sm font-medium text-niner-green">
            {readOnly ? "Round result" : "Drop your pin"}
          </span>
          <div className="w-16" />
        </div>

        <div className="relative h-[min(42dvh,320px)] w-full shrink-0 sm:h-[min(55vh,420px)]">
          {open && (
            <GuessMap
              center={center}
              boundary={boundary}
              maxBounds={maxBounds}
              reveal={reveal}
              onChange={readOnly ? undefined : onPinChange}
            />
          )}
        </div>

        {!readOnly && onSubmit && (
          <div className="border-t border-niner-green/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {hint && (
              <p className="mb-2 text-center text-sm text-niner-green/60">{hint}</p>
            )}
            <HeroButton
              variant="primary"
              fullWidth
              onClick={onSubmit}
              disabled={submitDisabled || submitting}
            >
              {submitting ? "Submitting…" : submitLabel}
            </HeroButton>
          </div>
        )}
      </div>
    </>
  );
}
