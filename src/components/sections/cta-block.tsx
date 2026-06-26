import { ButtonLink } from "@/components/ui/button-link";

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
    <section aria-labelledby="home-final-cta-heading" className="w-full px-4 md:px-8 my-24">
      <div className="max-w-6xl mx-auto bg-surface rounded-3xl py-24 px-8 md:px-16 flex flex-col items-center text-center">
        {eyebrow ? (
          <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground opacity-80">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className="mt-3 font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-foreground mb-6"
          id="home-final-cta-heading"
        >
          {title}
        </h2>
        <p className="font-sans text-lg md:text-xl leading-relaxed text-foreground mb-10 max-w-2xl">
          {description}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink>
          {secondaryCta ? (
            <ButtonLink href={secondaryCta.href} variant="secondary">
              {secondaryCta.label}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </section>
  );
}
