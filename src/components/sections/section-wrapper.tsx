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
  default: "",
  muted: "bg-muted",
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
    <Section aria-labelledby={headingId} className={toneClasses[tone]} id={id}>
      <Container>
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              {eyebrow}
            </p>
          ) : null}
          <h2
            className="mt-3 text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl"
            id={headingId}
          >
            {title}
          </h2>
          {description ? <p className="mt-4 text-base leading-7 text-stone-700">{description}</p> : null}
        </div>
        <div className="mt-8">{children}</div>
      </Container>
    </Section>
  );
}
