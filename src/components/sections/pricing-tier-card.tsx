import { ButtonLink } from "@/components/ui/button-link";

type PricingTierCardProps = {
  title: string;
  price: string;
  description: string;
  meta?: string;
  featured?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
};

export function PricingTierCard({
  title,
  price,
  description,
  meta,
  featured = false,
  ctaHref = "/book",
  ctaLabel = "Book Now",
}: PricingTierCardProps) {
  if (featured) {
    return (
      <article className="bg-inverse rounded-3xl p-8 md:p-10 flex flex-col h-full transition-transform duration-300 hover:-translate-y-1">
        {meta ? (
          <p className="font-sans font-medium text-xs tracking-wide text-accent">{meta}</p>
        ) : null}
        <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-primary-foreground">
          {title}
        </h3>
        <p className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-primary-foreground my-4">
          {price}
        </p>
        <ul className="flex flex-col gap-3 mb-8 flex-grow">
          <li className="font-sans text-[17px] leading-relaxed text-primary-foreground">{description}</li>
        </ul>
        <ButtonLink
          className="border-0 bg-accent text-primary hover:bg-primary-foreground w-full justify-center"
          href={ctaHref}
        >
          {ctaLabel}
        </ButtonLink>
      </article>
    );
  }

  return (
    <article className="bg-surface rounded-3xl p-8 md:p-10 flex flex-col h-full transition-transform duration-300 hover:-translate-y-1">
      {meta ? (
        <p className="font-sans font-medium text-xs tracking-wide text-foreground">{meta}</p>
      ) : null}
      <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-foreground">
        {title}
      </h3>
      <p className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-foreground my-4">
        {price}
      </p>
      <ul className="flex flex-col gap-3 mb-8 flex-grow">
        <li className="font-sans text-[17px] leading-relaxed text-foreground">{description}</li>
      </ul>
      <ButtonLink className="w-full justify-center" href={ctaHref}>
        {ctaLabel}
      </ButtonLink>
    </article>
  );
}
