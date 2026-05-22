import "server-only";
import { createAdminSupabaseClient, STORAGE_BUCKET } from "@/lib/supabase/admin";

const PHOTO_URL_TTL_SECONDS = 60 * 10;

/**
 * Mint a short-lived signed URL for a location photo. Throws if the object
 * doesn't exist or Storage returns an error.
 */
export async function signPhotoUrl(imagePath: string): Promise<string> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(imagePath, PHOTO_URL_TTL_SECONDS);
  if (error || !data) {
    throw new Error(`Failed to sign photo URL: ${error?.message ?? "unknown"}`);
  }
  return data.signedUrl;
}
