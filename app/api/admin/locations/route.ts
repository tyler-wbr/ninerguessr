import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createLocationSchema } from "@/lib/schemas";

export async function GET() {
  const { user, profile } = await getServerUser();
  if (!user || !profile?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("locations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ locations: data ?? [] });
}

export async function POST(req: Request) {
  const { user, profile } = await getServerUser();
  if (!user || !profile?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const parsed = createLocationSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("locations")
    .insert({ ...parsed.data, created_by: user.id })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ location: data });
}
