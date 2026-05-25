import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import GameClient from "../../play/GameClient";

export default async function ChallengePlayPage() {
  const { user } = await getServerUser();
  if (!user) {
    redirect("/login?next=/challenge/play");
  }

  return <GameClient mode="daily" />;
}
