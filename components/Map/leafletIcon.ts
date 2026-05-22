"use client";

import L from "leaflet";

// Fix the default-marker icon paths so Leaflet works under bundlers that
// don't auto-resolve the PNG assets. Uses jsdelivr-hosted images.
let patched = false;
export function patchLeafletIcons() {
  if (patched) return;
  patched = true;
  const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
  delete proto._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:
      "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
      "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}
