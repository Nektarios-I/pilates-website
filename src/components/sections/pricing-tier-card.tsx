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
      <article className="bg-[#2D3A1F] rounded-3xl p-8 md:p-10 flex flex-col h-full transition-transform duration-300 hover:-translate-y-1">
        {meta ? (
          <p className="font-sans font-medium text-xs tracking-wide text-[#B8A678]">{meta}</p>
        ) : null}
        <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-[#F4F1E8]">
          {title}
        </h3>
        <p className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-[#F4F1E8] my-4">
          {price}
        </p>
        <ul className="flex flex-col gap-3 mb-8 flex-grow">
          <li className="font-sans text-[17px] leading-relaxed text-[#F4F1E8]">{description}</li>
        </ul>
        <ButtonLink
          className="border-0 bg-[#B8A678] text-[#2D3A1F] hover:bg-[#F4F1E8] w-full justify-center"
          href={ctaHref}
        >
          {ctaLabel}
        </ButtonLink>
      </article>
    );
  }

  return (
    <article className="bg-[#E8E2D0] rounded-3xl p-8 md:p-10 flex flex-col h-full transition-transform duration-300 hover:-translate-y-1">
      {meta ? (
        <p className="font-sans font-medium text-xs tracking-wide text-[#2D3A1F]">{meta}</p>
      ) : null}
      <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F]">
        {title}
      </h3>
      <p className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-[#2D3A1F] my-4">
        {price}
      </p>
      <ul className="flex flex-col gap-3 mb-8 flex-grow">
        <li className="font-sans text-[17px] leading-relaxed text-[#2D3A1F]">{description}</li>
      </ul>
      <ButtonLink className="w-full justify-center" href={ctaHref}>
        {ctaLabel}
      </ButtonLink>
    </article>
  );
}
