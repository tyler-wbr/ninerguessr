import Link from "next/link";
import { getServerUser } from "@/lib/supabase/server";
import HeroLayout from "@/components/HeroLayout";
import HeroAuthButtons from "@/components/HeroAuthButtons";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const { user, profile } = await getServerUser();

  return (
    <HeroLayout
      topRight={
        user ? (
          <HeroAuthButtons user={user} profile={profile} />
        ) : (
          <Link href="/" className="hero-pill hero-pill-outline">
            Home
          </Link>
        )
      }
    >
      <div className="flex min-h-[100dvh] items-center justify-center px-6 py-20">
        <div className="hero-glass w-full max-w-md">
          <h1 className="mb-6 text-center text-2xl font-bold text-niner-white">
            Log in
          </h1>
          <LoginForm next={searchParams.next ?? "/"} />
        </div>
      </div>
    </HeroLayout>
  );
}
