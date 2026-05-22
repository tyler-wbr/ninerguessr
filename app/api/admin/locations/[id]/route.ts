import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { createAdminSupabaseClient, STORAGE_BUCKET } from "@/lib/supabase/admin";
import { updateLocationSchema } from "@/lib/schemas";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { user, profile } = await getServerUser();
  if (!user || !profile?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const parsed = updateLocationSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("locations")
    .update(parsed.data)
    .eq("id", params.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ location: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { user, profile } = await getServerUser();
  if (!user || !profile?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const admin = createAdminSupabaseClient();
  const { data: loc } = await admin
    .from("locations")
    .select("image_path")
    .eq("id", params.id)
    .maybeSingle();

  const { error } = await admin.from("locations").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (loc?.image_path) {
    await admin.storage.from(STORAGE_BUCKET).remove([loc.image_path]);
  }
  return NextResponse.json({ ok: true });
}
