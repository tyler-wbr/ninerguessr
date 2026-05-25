"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import type { Profile } from "@/lib/supabase/types";

function isImmersiveRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/login" || pathname === "/register") return true;
  if (pathname === "/leaderboard" || pathname === "/profile") return true;
  if (pathname === "/challenge" || pathname.startsWith("/challenge/")) return true;
  if (pathname.startsWith("/play")) return true;
  if (pathname.startsWith("/results/")) return true;
  return false;
}

export default function SiteShell({
  children,
  user,
  profile,
}: {
  children: React.ReactNode;
  user: { id: string; email: string | null } | null;
  profile: Profile | null;
}) {
  const pathname = usePathname();

  if (isImmersiveRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader user={user} profile={profile} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
