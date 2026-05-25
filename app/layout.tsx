import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getServerUser } from "@/lib/supabase/server";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Niner Guessr",
  description:
    "A GeoGuessr-style game for the UNC Charlotte campus. Drop pins, score points, climb the leaderboard.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getServerUser();

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <SiteShell user={user} profile={profile}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
