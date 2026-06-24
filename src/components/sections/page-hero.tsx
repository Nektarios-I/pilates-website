import { ButtonLink } from "@/components/ui/button-link";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";

type PageHeroCta = {
  label: string;
  href: "/" | `/${string}`;
};

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryCta: PageHeroCta;
  secondaryCta?: PageHeroCta;
};

export function PageHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
}: PageHeroProps) {
  return (
    <section aria-labelledby="home-hero-heading">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-24 md:pt-24 md:pb-32 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div>
          {eyebrow ? (
            <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] opacity-80">
              {eyebrow}
            </p>
          ) : null}
          <h1
            className="font-serif font-bold text-5xl md:text-8xl leading-[1.1] tracking-tight text-[#2D3A1F] mb-6"
            id="home-hero-heading"
          >
            {title}
          </h1>
          <p className="font-sans text-lg md:text-xl leading-relaxed text-[#2D3A1F]">
            {description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink>
            {secondaryCta ? (
              <ButtonLink href={secondaryCta.href} variant="secondary">
                {secondaryCta.label}
              </ButtonLink>
            ) : null}
          </div>
        </div>
        <ImagePlaceholder className="aspect-[4/5]" />
      </div>
    </section>
  );
}
