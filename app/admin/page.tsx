import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Location } from "@/lib/supabase/types";
import DeleteLocationButton from "./DeleteLocationButton";
import TogglePublishButton from "./TogglePublishButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = createAdminSupabaseClient();
  const { data: locations } = await admin
    .from("locations")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (locations as Location[] | null) ?? [];
  const byDifficulty = {
    easy: list.filter((l) => l.difficulty === "easy"),
    medium: list.filter((l) => l.difficulty === "medium"),
    hard: list.filter((l) => l.difficulty === "hard"),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Locations</h1>
        <Link href="/admin/new" className="btn-primary">
          + New location
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8 text-center">
        {(["easy", "medium", "hard"] as const).map((d) => {
          const all = byDifficulty[d];
          const published = all.filter((l) => l.is_published).length;
          return (
            <div key={d} className="card border-t-4 border-t-niner-gold p-4">
              <div className="text-sm uppercase text-muted">{d}</div>
              <div className="text-2xl font-bold text-niner-green">
                {published}{" "}
                <span className="text-niner-gold text-base">/ {all.length}</span>
              </div>
              <div className="text-xs text-muted">published / total</div>
            </div>
          );
        })}
      </div>

      <table className="w-full text-sm">
        <thead className="table-head">
          <tr>
            <th className="py-2">Title</th>
            <th>Difficulty</th>
            <th>Coords</th>
            <th>Published</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map((l) => (
            <tr key={l.id} className="table-row">
              <td className="py-2">
                {l.title ?? <em className="text-muted">untitled</em>}
              </td>
              <td className="capitalize">{l.difficulty}</td>
              <td className="font-mono text-xs text-muted">
                {l.lat.toFixed(5)}, {l.lng.toFixed(5)}
              </td>
              <td>
                <TogglePublishButton id={l.id} isPublished={l.is_published} />
              </td>
              <td>
                <DeleteLocationButton id={l.id} />
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-muted">
                No locations yet. Add your first one!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
