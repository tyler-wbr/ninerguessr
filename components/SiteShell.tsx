"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import type { Profile } from "@/lib/supabase/types";

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
  const isHome = pathname === "/";

  if (isHome) {
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
