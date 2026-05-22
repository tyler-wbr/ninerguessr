import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getServerUser } from "@/lib/supabase/server";
import { createAdminSupabaseClient, STORAGE_BUCKET } from "@/lib/supabase/admin";
import { uploadUrlSchema } from "@/lib/schemas";

// Admin-only: middleware.ts gates /api/admin/*, but we still verify here in
// case the matcher misses an edge case.
export async function POST(req: Request) {
  const { user, profile } = await getServerUser();
  if (!user || !profile?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = uploadUrlSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { filename } = parsed.data;
  const ext = filename.includes(".") ? filename.split(".").pop() : "jpg";
  const objectPath = `${user.id}/${randomUUID()}.${ext}`;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(objectPath);
  if (error || !data) {
    return NextResponse.json({ error: "storage_error" }, { status: 500 });
  }

  return NextResponse.json({
    path: objectPath,
    signedUrl: data.signedUrl,
    token: data.token,
  });
}
