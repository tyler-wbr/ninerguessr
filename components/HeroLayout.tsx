"use client";

import Image from "next/image";

export default function HeroLayout({
  children,
  topRight,
  showBackground = true,
  className = "",
}: {
  children: React.ReactNode;
  topRight?: React.ReactNode;
  showBackground?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative min-h-[100dvh] overflow-hidden ${className}`}>
      {showBackground && (
        <>
          <Image
            src="/images/campus-hero.jpg"
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-niner-green/85 via-niner-green/75 to-niner-green/90"
            aria-hidden
          />
        </>
      )}

      {topRight && (
        <div className="absolute right-4 top-4 z-30 pt-[env(safe-area-inset-top)] sm:right-8 sm:top-8">
          {topRight}
        </div>
      )}

      <div className="relative z-10 min-h-[100dvh]">{children}</div>
    </div>
  );
}
