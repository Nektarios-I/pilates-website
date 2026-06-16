import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

type CtaBlockCta = {
  label: string;
  href: "/" | `/${string}`;
};

type CtaBlockProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryCta: CtaBlockCta;
  secondaryCta?: CtaBlockCta;
};

export function CtaBlock({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
}: CtaBlockProps) {
  return (
    <Section aria-labelledby="home-final-cta-heading" className="bg-stone-950 text-white">
      <Container>
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-300">
              {eyebrow}
            </p>
          ) : null}
          <h2
            className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl"
            id="home-final-cta-heading"
          >
            {title}
          </h2>
          <p className="mt-4 text-base leading-7 text-stone-200">{description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              className="border-white bg-white text-stone-950 hover:bg-stone-100"
              href={primaryCta.href}
            >
              {primaryCta.label}
            </ButtonLink>
            {secondaryCta ? (
              <ButtonLink
                className="border-stone-600 bg-transparent text-white hover:border-white"
                href={secondaryCta.href}
                variant="secondary"
              >
                {secondaryCta.label}
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}
