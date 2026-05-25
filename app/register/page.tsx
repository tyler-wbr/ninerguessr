import Link from "next/link";
import { getServerUser } from "@/lib/supabase/server";
import HeroLayout from "@/components/HeroLayout";
import HeroAuthButtons from "@/components/HeroAuthButtons";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
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
            Create your account
          </h1>
          <RegisterForm />
        </div>
      </div>
    </HeroLayout>
  );
}
