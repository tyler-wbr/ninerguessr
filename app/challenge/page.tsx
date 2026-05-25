import { getServerUser } from "@/lib/supabase/server";
import HeroLayout from "@/components/HeroLayout";
import HeroAuthButtons from "@/components/HeroAuthButtons";
import ChallengeHubClient from "./ChallengeHubClient";

export default async function ChallengePage() {
  const { user, profile } = await getServerUser();

  return (
    <HeroLayout topRight={<HeroAuthButtons user={user} profile={profile} />}>
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-[max(5rem,env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)] sm:px-6">
        <ChallengeHubClient />
      </div>
    </HeroLayout>
  );
}
