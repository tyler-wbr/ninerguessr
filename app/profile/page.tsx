import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Difficulty } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

export default async function ProfilePage() {
  const { user, profile } = await getServerUser();
  if (!user) redirect("/login?next=/profile");

  const admin = createAdminSupabaseClient();
  const { data: games } = await admin
    .from("games")
    .select("id, difficulty, total_score, status, completed_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  const completed = games ?? [];
  const stats = DIFFICULTIES.map((d) => {
    const subset = completed.filter((g) => g.difficulty === d);
    const best = subset.reduce((m, g) => Math.max(m, g.total_score), 0);
    const avg = subset.length
      ? Math.round(subset.reduce((s, g) => s + g.total_score, 0) / subset.length)
      : 0;
    return { difficulty: d, games: subset.length, best, avg };
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="page-title mb-1">{profile?.display_name}</h1>
      <p className="text-sm text-muted mb-6">{user.email}</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.difficulty}
            className="card border-t-4 border-t-niner-gold p-4"
          >
            <div className="text-xs uppercase text-muted">{s.difficulty}</div>
            <div className="mt-2 text-3xl font-bold text-niner-gold">
              {s.best.toLocaleString()}
            </div>
            <div className="text-xs text-muted">best single</div>
            <div className="mt-2 text-sm text-niner-green">
              avg <span className="font-semibold">{s.avg.toLocaleString()}</span>{" "}
              <span className="text-muted">({s.games} games)</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-niner-green mb-2">Recent games</h2>
      <table className="w-full text-sm">
        <thead className="table-head">
          <tr>
            <th className="py-2">Date</th>
            <th>Difficulty</th>
            <th className="text-right">Score</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {completed.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-muted">
                No completed games yet.{" "}
                <Link href="/" className="link-brand">
                  Play one
                </Link>
                .
              </td>
            </tr>
          )}
          {completed.slice(0, 20).map((g) => (
            <tr key={g.id} className="table-row">
              <td className="py-2">
                {g.completed_at
                  ? new Date(g.completed_at).toLocaleDateString()
                  : "—"}
              </td>
              <td className="capitalize">{g.difficulty}</td>
              <td className="text-right font-semibold text-niner-gold">
                {g.total_score.toLocaleString()}
              </td>
              <td className="text-right">
                <Link href={`/results/${g.id}`} className="link-brand text-xs">
                  view
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
