import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

type SectionTone = "default" | "muted";

type SectionWrapperProps = {
  children: ReactNode;
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  tone?: SectionTone;
};

const toneClasses: Record<SectionTone, string> = {
  default: "bg-background",
  muted: "bg-surface",
};

export function SectionWrapper({
  children,
  id,
  eyebrow,
  title,
  description,
  tone = "default",
}: SectionWrapperProps) {
  const headingId = `${id}-heading`;

  return (
    <Section aria-labelledby={headingId} className={["py-0", toneClasses[tone]].filter(Boolean).join(" ")} id={id}>
      <Container className="w-full max-w-7xl mx-auto px-4 md:px-8 py-14 md:py-20">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground opacity-80">
              {eyebrow}
            </p>
          ) : null}
          <h2
            className="mt-3 font-serif font-medium text-2xl md:text-4xl leading-snug text-foreground"
            id={headingId}
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-4 font-sans text-lg md:text-xl leading-relaxed text-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <div className="mt-8">{children}</div>
      </Container>
    </Section>
  );
}
