import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { signPhotoUrl } from "@/lib/photoUrl";
import ResultsMap from "./ResultsMap";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: { gameId: string };
}) {
  const { user } = await getServerUser();
  if (!user) redirect(`/login?next=/results/${params.gameId}`);

  const admin = createAdminSupabaseClient();
  const { data: game } = await admin
    .from("games")
    .select("id, user_id, difficulty, total_score, status, started_at")
    .eq("id", params.gameId)
    .maybeSingle();
  if (!game) {
    return <div className="p-8 text-center text-niner-green">Game not found.</div>;
  }
  if (game.user_id !== user.id) {
    return <div className="p-8 text-center text-niner-green">Not your game.</div>;
  }

  const { data: rounds } = await admin
    .from("game_rounds")
    .select(
      "round_number, location_id, guess_lat, guess_lng, distance_m, points",
    )
    .eq("game_id", game.id)
    .order("round_number", { ascending: true });

  const locationIds = (rounds ?? []).map((r) => r.location_id);
  const { data: locs } = await admin
    .from("locations")
    .select("id, lat, lng, title, image_path")
    .in("id", locationIds);
  const locById = new Map((locs ?? []).map((l) => [l.id, l]));

  const enriched = await Promise.all(
    (rounds ?? []).map(async (r) => {
      const loc = locById.get(r.location_id);
      const photoUrl = loc ? await signPhotoUrl(loc.image_path) : null;
      return { ...r, loc, photoUrl };
    }),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="text-center mb-8">
        <div className="text-sm uppercase tracking-wide text-muted">
          {game.difficulty} game complete
        </div>
        <div className="text-5xl font-bold mt-2 text-niner-gold">
          {game.total_score.toLocaleString()}
        </div>
        <div className="text-muted">total points</div>
        <div className="mt-4 flex justify-center gap-3 text-sm">
          <Link
            href={`/play?difficulty=${game.difficulty}`}
            className="btn-primary"
          >
            Play again
          </Link>
          <Link href="/leaderboard" className="btn-outline">
            Leaderboard
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {enriched.map((r) => (
          <div
            key={r.round_number}
            className="card overflow-hidden grid sm:grid-cols-2"
          >
            <div className="bg-niner-green aspect-video sm:aspect-auto sm:h-56 flex items-center justify-center">
              {r.photoUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={r.photoUrl}
                  alt={`Round ${r.round_number}`}
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>
            <div className="flex flex-col">
              <div className="px-4 py-2 flex items-center justify-between border-b border-niner-green/10">
                <div className="text-sm text-niner-green">
                  <span className="font-bold">Round {r.round_number}</span>
                  {r.loc?.title && (
                    <span className="text-muted"> · {r.loc.title}</span>
                  )}
                </div>
                <div className="text-sm font-semibold text-niner-gold">
                  {r.points?.toLocaleString() ?? 0} pts
                </div>
              </div>
              <div className="flex-1 h-48 sm:h-auto min-h-[12rem]">
                {r.loc && (
                  <ResultsMap
                    actual={{ lat: r.loc.lat, lng: r.loc.lng }}
                    guess={
                      r.guess_lat != null && r.guess_lng != null
                        ? { lat: r.guess_lat, lng: r.guess_lng }
                        : null
                    }
                  />
                )}
              </div>
              <div className="px-4 py-2 text-xs text-muted border-t border-niner-green/10">
                {r.distance_m != null
                  ? `${Math.round(r.distance_m).toLocaleString()} m away`
                  : "no guess submitted"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
