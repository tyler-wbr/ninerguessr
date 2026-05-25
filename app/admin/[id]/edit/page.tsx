import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Location } from "@/lib/supabase/types";
import { signPhotoUrl } from "@/lib/photoUrl";
import EditLocationForm from "./EditLocationForm";

export const dynamic = "force-dynamic";

export default async function EditLocationPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminSupabaseClient();
  const { data: location } = await admin
    .from("locations")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!location) notFound();

  let photoUrl: string | null = null;
  if (location.image_path) {
    try {
      photoUrl = await signPhotoUrl(location.image_path);
    } catch {
      photoUrl = null;
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <EditLocationForm
        location={location as Location}
        photoUrl={photoUrl}
      />
    </div>
  );
}
