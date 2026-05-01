import type { ComponentPropsWithoutRef } from "react";

type SectionProps = ComponentPropsWithoutRef<"section">;

export function Section({ className, ...props }: SectionProps) {
  return (
    <section
      className={["py-12 sm:py-16 lg:py-20", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
