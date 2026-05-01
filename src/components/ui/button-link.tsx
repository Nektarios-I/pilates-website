import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type ButtonLinkVariant = "primary" | "secondary";

type ButtonLinkProps = {
  children: ReactNode;
  href: string;
  variant?: ButtonLinkVariant;
  className?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href">;

const variants: Record<ButtonLinkVariant, string> = {
  primary: "border-stone-950 bg-stone-950 text-white hover:bg-stone-800",
  secondary: "border-stone-300 bg-white text-stone-950 hover:border-stone-500",
};

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-md border px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950",
        variants[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </Link>
  );
}
