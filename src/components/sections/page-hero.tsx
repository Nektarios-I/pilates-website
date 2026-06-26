import { ButtonLink } from "@/components/ui/button-link";
import { ContentImage } from "@/components/ui/content-image";
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
  imageSrc?: string;
  imageAlt?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  imageSrc,
  imageAlt,
}: PageHeroProps) {
  return (
    <section aria-labelledby="home-hero-heading">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-14 pb-20 md:pt-20 md:pb-28 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div>
          {eyebrow ? (
            <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground opacity-80">
              {eyebrow}
            </p>
          ) : null}
          <h1
            className="font-serif font-bold text-5xl md:text-7xl leading-[1.1] tracking-tight text-foreground mb-6"
            id="home-hero-heading"
          >
            {title}
          </h1>
          <p className="font-sans text-lg md:text-xl leading-relaxed text-foreground">
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
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface">
          {imageSrc && imageAlt ? (
            <ContentImage
              alt={imageAlt}
              imageClassName="transition-transform duration-500"
              priority
              sizes="(max-width: 768px) 100vw, 40vw"
              src={imageSrc}
            />
          ) : (
            <ImagePlaceholder className="aspect-[4/5]" />
          )}
        </div>
      </div>
    </section>
  );
}
