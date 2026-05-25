import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";

const variantClass: Record<Variant, string> = {
  primary: "hero-btn-gold",
  secondary: "hero-btn-outline",
  ghost: "hero-btn-ghost",
};

type BaseProps = {
  variant?: Variant;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

type LinkProps = BaseProps & {
  href: string;
  onClick?: never;
  disabled?: never;
  type?: never;
};

type ButtonProps = BaseProps & {
  href?: never;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
};

export default function HeroButton(props: LinkProps | ButtonProps) {
  const {
    variant = "primary",
    fullWidth = false,
    className = "",
    children,
  } = props;

  const classes = [
    "hero-btn",
    variantClass[variant],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
