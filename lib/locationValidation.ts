import type { Difficulty } from "@/lib/supabase/types";

export type LocationWriteInput = {
  image_path?: string | null;
  lat?: number | null;
  lng?: number | null;
  difficulty?: Difficulty;
  title?: string | null;
  hint?: string | null;
  is_published?: boolean;
};

export type LocationRecord = {
  image_path: string | null;
  lat: number | null;
  lng: number | null;
  is_published: boolean;
};

export function isLocationComplete(
  loc: Pick<LocationRecord, "image_path" | "lat" | "lng">,
): boolean {
  return (
    !!loc.image_path &&
    loc.lat != null &&
    loc.lng != null &&
    Number.isFinite(loc.lat) &&
    Number.isFinite(loc.lng)
  );
}

export function validateLocationWrite(
  input: LocationWriteInput,
  existing?: LocationRecord | null,
): { ok: true } | { ok: false; error: string } {
  const merged = {
    image_path:
      input.image_path !== undefined ? input.image_path : existing?.image_path ?? null,
    lat: input.lat !== undefined ? input.lat : existing?.lat ?? null,
    lng: input.lng !== undefined ? input.lng : existing?.lng ?? null,
    is_published:
      input.is_published !== undefined
        ? input.is_published
        : existing?.is_published ?? false,
  };

  const hasPhoto = !!merged.image_path;
  const hasLat = merged.lat != null;
  const hasLng = merged.lng != null;

  if (hasPhoto !== hasLat || hasPhoto !== hasLng) {
    return {
      ok: false,
      error: "Photo and map coordinates must be set together.",
    };
  }

  if (merged.is_published && !isLocationComplete(merged)) {
    return {
      ok: false,
      error: "Publish requires a photo and map pin.",
    };
  }

  if (!hasPhoto && merged.is_published) {
    return {
      ok: false,
      error: "Draft locations cannot be published until a photo is added.",
    };
  }

  return { ok: true };
}
