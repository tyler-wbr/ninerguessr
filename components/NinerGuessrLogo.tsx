import Image from "next/image";
import Link from "next/link";

export type LogoVariant = "stacked" | "horizontal" | "icon";

const LOGO = {
  stacked: {
    src: "/images/logos/logo-stacked.png",
    width: 780,
    height: 820,
    className: "h-auto w-56 sm:w-64",
  },
  horizontal: {
    src: "/images/logos/logo-horizontal.png",
    width: 880,
    height: 380,
    className: "h-16 w-auto sm:h-[4.75rem]",
  },
  icon: {
    src: "/images/logos/logo-icon.png",
    width: 520,
    height: 520,
    className: "h-9 w-9 sm:h-10 sm:w-10",
  },
} as const;

export default function NinerGuessrLogo({
  variant = "stacked",
  linked = true,
  priority = false,
  className = "",
}: {
  variant?: LogoVariant;
  linked?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const config = LOGO[variant];

  const image = (
    <Image
      src={config.src}
      alt="Niner Guessr"
      width={config.width}
      height={config.height}
      priority={priority}
      className={`logo-on-dark ${config.className} ${className}`.trim()}
    />
  );

  if (!linked) return image;

  return (
    <Link href="/" className="inline-block shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-niner-gold/80 rounded-sm">
      {image}
    </Link>
  );
}
