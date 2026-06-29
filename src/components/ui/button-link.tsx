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
  primary:
    "border-0 bg-[#2D3A1F] text-[#F4F1E8] px-8 py-4 rounded-full font-sans font-semibold text-[13px] uppercase tracking-widest transition-all duration-200 hover:bg-[#B8A678]",
  secondary:
    "border border-[#CDD2C9] text-[#2D3A1F] px-8 py-4 rounded-full font-sans font-semibold text-[13px] uppercase tracking-widest bg-transparent hover:bg-[#E8E2D0] transition-all duration-200",
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
        "inline-flex min-h-11 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8A678]",
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
