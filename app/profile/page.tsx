import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import HeroLayout from "@/components/HeroLayout";
import HeroAuthButtons from "@/components/HeroAuthButtons";
import HeroButton from "@/components/HeroButton";
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
    <HeroLayout
      topRight={<HeroAuthButtons user={user} profile={profile} />}
    >
      <div className="flex min-h-[100dvh] flex-col px-6 py-20">
        <div className="mx-auto w-full max-w-3xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-niner-white sm:text-4xl">
              {profile?.display_name}
            </h1>
            <p className="mt-2 text-sm text-niner-white/70">{user.email}</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.difficulty}
                className="hero-glass border-t-4 border-t-niner-gold text-center sm:text-left"
              >
                <div className="text-xs uppercase tracking-wide text-niner-white/60">
                  {s.difficulty}
                </div>
                <div className="mt-2 text-3xl font-bold text-niner-gold">
                  {s.best.toLocaleString()}
                </div>
                <div className="text-xs text-niner-white/60">best single</div>
                <div className="mt-2 text-sm text-niner-white/80">
                  avg{" "}
                  <span className="font-semibold text-niner-gold">
                    {s.avg.toLocaleString()}
                  </span>{" "}
                  <span className="text-niner-white/50">({s.games} games)</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hero-glass mt-8">
            <h2 className="mb-4 text-lg font-semibold text-niner-white">
              Recent games
            </h2>
            <table className="w-full text-sm text-niner-white">
              <thead>
                <tr className="text-left text-niner-white/60">
                  <th className="py-2">Date</th>
                  <th>Difficulty</th>
                  <th className="text-right">Score</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {completed.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-niner-white/60"
                    >
                      No completed games yet.{" "}
                      <Link href="/" className="text-niner-gold hover:underline">
                        Play one
                      </Link>
                      .
                    </td>
                  </tr>
                )}
                {completed.slice(0, 20).map((g) => (
                  <tr key={g.id} className="border-t border-niner-white/10">
                    <td className="py-2.5">
                      {g.completed_at
                        ? new Date(g.completed_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="capitalize">{g.difficulty}</td>
                    <td className="text-right font-semibold text-niner-gold">
                      {g.total_score.toLocaleString()}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/results/${g.id}`}
                        className="text-xs text-niner-gold hover:underline"
                      >
                        view
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <HeroButton href="/" variant="primary">
              Play
            </HeroButton>
            <HeroButton href="/leaderboard" variant="secondary">
              Leaderboard
            </HeroButton>
          </div>
        </div>
      </div>
    </HeroLayout>
  );
}
