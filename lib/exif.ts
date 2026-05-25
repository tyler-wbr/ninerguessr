/** Extract GPS coordinates from image EXIF (JPEG/HEIC with location enabled). */
export async function readGpsFromImageFile(
  file: File,
): Promise<{ lat: number; lng: number } | null> {
  if (!file.type.startsWith("image/")) return null;

  try {
    const exifr = await import("exifr");
    const gps = await exifr.gps(file);
    if (
      gps &&
      typeof gps.latitude === "number" &&
      typeof gps.longitude === "number" &&
      Number.isFinite(gps.latitude) &&
      Number.isFinite(gps.longitude)
    ) {
      return { lat: gps.latitude, lng: gps.longitude };
    }
  } catch {
    // No EXIF or unreadable — fall back to manual pin drop.
  }
  return null;
}
