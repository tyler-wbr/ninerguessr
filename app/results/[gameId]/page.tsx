import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { signPhotoUrl } from "@/lib/photoUrl";
import HeroLayout from "@/components/HeroLayout";
import HeroAuthButtons from "@/components/HeroAuthButtons";
import ResultsClient from "./ResultsClient";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: { gameId: string };
}) {
  const { user, profile } = await getServerUser();
  if (!user) redirect(`/login?next=/results/${params.gameId}`);

  const admin = createAdminSupabaseClient();
  const { data: game } = await admin
    .from("games")
    .select(
      "id, user_id, difficulty, game_mode, challenge_date, total_score, status, started_at",
    )
    .eq("id", params.gameId)
    .maybeSingle();

  if (!game) {
    return (
      <HeroLayout topRight={<HeroAuthButtons user={user} profile={profile} />}>
        <div className="flex min-h-[100dvh] items-center justify-center px-6 text-center">
          <p className="text-niner-white">Game not found.</p>
          <Link href="/" className="ml-2 text-niner-gold hover:underline">
            Home
          </Link>
        </div>
      </HeroLayout>
    );
  }

  if (game.user_id !== user.id) {
    return (
      <HeroLayout topRight={<HeroAuthButtons user={user} profile={profile} />}>
        <div className="flex min-h-[100dvh] items-center justify-center px-6 text-center text-niner-white">
          Not your game.
        </div>
      </HeroLayout>
    );
  }

  const { data: rounds } = await admin
    .from("game_rounds")
    .select(
      "round_number, location_id, round_difficulty, guess_lat, guess_lng, distance_m, distance_points, time_ms, points",
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
      return {
        round_number: r.round_number,
        round_difficulty: r.round_difficulty,
        guess_lat: r.guess_lat,
        guess_lng: r.guess_lng,
        distance_m: r.distance_m,
        distance_points: r.distance_points,
        time_ms: r.time_ms,
        points: r.points,
        photoUrl,
        loc: loc
          ? { lat: loc.lat, lng: loc.lng, title: loc.title }
          : null,
      };
    }),
  );

  return (
    <HeroLayout topRight={<HeroAuthButtons user={user} profile={profile} />}>
      <ResultsClient
        gameMode={game.game_mode}
        difficulty={game.difficulty}
        challengeDate={game.challenge_date}
        totalScore={game.total_score}
        rounds={enriched}
      />
    </HeroLayout>
  );
}
