import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import GameClient from "./GameClient";
import type { Difficulty } from "@/lib/supabase/types";

const VALID: readonly Difficulty[] = ["easy", "medium", "hard"];

export default async function PlayPage({
  searchParams,
}: {
  searchParams: { difficulty?: string };
}) {
  const { user } = await getServerUser();
  if (!user) {
    const next = `/play?difficulty=${searchParams.difficulty ?? "easy"}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const difficulty = (searchParams.difficulty ?? "") as Difficulty;
  if (!VALID.includes(difficulty)) {
    redirect("/");
  }

  return <GameClient mode="casual" difficulty={difficulty} />;
}
