"use client";

import Image from "next/image";
import NinerGuessrLogo from "@/components/NinerGuessrLogo";

export default function HeroLayout({
  children,
  topLeft,
  topRight,
  showBackground = true,
  className = "",
}: {
  children: React.ReactNode;
  /** Pass `false` to hide the top-left logo (e.g. home hero). */
  topLeft?: React.ReactNode | false;
  topRight?: React.ReactNode;
  showBackground?: boolean;
  className?: string;
}) {
  const left = topLeft === false ? null : (topLeft ?? <NinerGuessrLogo variant="horizontal" />);

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

      {left && (
        <div className="absolute left-4 top-4 z-30 pt-[env(safe-area-inset-top)] sm:left-8 sm:top-8">
          {left}
        </div>
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
