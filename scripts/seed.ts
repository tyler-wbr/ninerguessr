/**
 * Local/dev seed: creates an admin user and inserts placeholder locations.
 *
 *   npm run seed
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY set. Idempotent — re-running won't duplicate
 * the admin user or the seed objects.
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { SEED_LOCATIONS } from "./placeholders";

config({ path: resolve(process.cwd(), ".env.local") });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "location-photos";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Passw0rd!";

if (!URL || !KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set these in .env.local first.",
  );
  process.exit(1);
}

const supabase = createClient(URL, KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function ensureBucket() {
  const { data: existing } = await supabase.storage.getBucket(BUCKET);
  if (existing) return;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
  });
  if (error) throw new Error(`createBucket: ${error.message}`);
  console.log(`Created bucket "${BUCKET}".`);
}

async function ensureAdmin(): Promise<string> {
  // listUsers paginates; the seed only ever has a few users, so first page is fine.
  const { data: list } = await supabase.auth.admin.listUsers();
  const found = list.users.find((u) => u.email === ADMIN_EMAIL);
  let userId: string;
  if (found) {
    userId = found.id;
    console.log(`Admin user ${ADMIN_EMAIL} already exists (${userId}).`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: "Admin" },
    });
    if (error || !data.user) {
      throw new Error(`createUser: ${error?.message ?? "unknown"}`);
    }
    userId = data.user.id;
    console.log(`Created admin user ${ADMIN_EMAIL} (${userId}).`);
  }

  // Promote to admin in profiles. The trigger should have inserted a row;
  // upsert just in case.
  const { error: upErr } = await supabase
    .from("profiles")
    .upsert({ id: userId, display_name: "Admin", is_admin: true });
  if (upErr) throw new Error(`profiles upsert: ${upErr.message}`);
  return userId;
}

async function uploadPlaceholder(key: string, svg: string) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, new Blob([svg], { type: "image/svg+xml" }), {
      upsert: true,
      contentType: "image/svg+xml",
    });
  if (error) throw new Error(`upload ${key}: ${error.message}`);
}

async function seedLocations(adminId: string) {
  for (const p of SEED_LOCATIONS) {
    await uploadPlaceholder(p.key, p.svg);

    // Avoid duplicates if seed is re-run: skip rows whose image_path already exists.
    const { data: existing } = await supabase
      .from("locations")
      .select("id")
      .eq("image_path", p.key)
      .maybeSingle();
    if (existing) continue;

    const { error } = await supabase.from("locations").insert({
      image_path: p.key,
      lat: p.lat,
      lng: p.lng,
      difficulty: p.difficulty,
      title: p.title,
      is_published: true,
      created_by: adminId,
    });
    if (error) throw new Error(`insert location ${p.title}: ${error.message}`);
    console.log(`+ ${p.difficulty}: ${p.title}`);
  }
}

async function main() {
  console.log("Seeding Niner Guessr…");
  await ensureBucket();
  const adminId = await ensureAdmin();
  await seedLocations(adminId);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
