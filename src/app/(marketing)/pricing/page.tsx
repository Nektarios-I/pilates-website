import { PricingTierCard } from '@/components/sections/pricing-tier-card';
import { ButtonLink } from '@/components/ui/button-link';
import { site_content } from '@/config/site_content';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Pricing',
  description: 'Reformer and mat Pilates pricing — single classes and monthly packages at corehouse.',
  path: '/pricing',
});

type Plan = {
  name: string;
  price: string;
  description: string;
};

function plan_cards(plans: readonly Plan[], meta?: string) {
  return plans.map((plan, index) => ({
    title: plan.name,
    price: plan.price,
    description: plan.description,
    meta,
    featured: plans.length > 1 && index === 1,
  }));
}

export default function PricingPage() {
  const { mat, reformer } = site_content.pricing_preview;

  const pricing_groups = [
    {
      title: 'Reformer Pilates',
      description: 'Equipment-based classes with small-group capacity and precise spring resistance.',
      sections: [
        { title: 'Single class', items: plan_cards([reformer.single], 'Reformer drop-in') },
        { title: '1 month packages', items: plan_cards(reformer.one_month, 'Reformer · 30 days') },
        { title: '3 month packages', items: plan_cards(reformer.three_month, 'Reformer · 90 days') },
      ],
    },
    {
      title: 'Mat Pilates',
      description: 'Floor-based classes for core strength, mobility, and breath-led control.',
      sections: [
        { title: 'Single class', items: plan_cards([mat.single], 'Mat drop-in') },
        { title: '1 month packages', items: plan_cards(mat.one_month, 'Mat · 30 days') },
        { title: '3 month packages', items: plan_cards(mat.three_month, 'Mat · 90 days') },
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24">
      <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground opacity-80">
        {site_content.pricing_preview.section_label}
      </p>
      <h1
        className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-foreground mb-4 mt-3"
        id="pricing-page-heading"
      >
        {site_content.pricing_preview.heading}
      </h1>
      <p className="font-sans text-lg md:text-xl leading-relaxed text-foreground max-w-3xl">
        {site_content.pricing_preview.intro_text}
      </p>

      <div className="flex flex-col gap-16 mt-16">
        {pricing_groups.map((group) => (
          <section key={group.title} aria-labelledby={`pricing-${group.title}`}>
            <h2
              className="font-serif font-medium text-2xl md:text-4xl leading-snug text-foreground mb-4"
              id={`pricing-${group.title}`}
            >
              {group.title}
            </h2>
            <p className="font-sans text-[17px] leading-relaxed text-foreground max-w-2xl mb-8">
              {group.description}
            </p>

            <div className="flex flex-col gap-16">
              {group.sections.map((section) => (
                <div key={`${group.title}-${section.title}`}>
                  <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-foreground mb-8">
                    {section.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                    {section.items.map((item) => (
                      <PricingTierCard
                        key={`${item.title}-${item.price}`}
                        ctaHref={site_content.primary_cta.href}
                        ctaLabel={site_content.primary_cta.label}
                        description={item.description}
                        featured={item.featured}
                        meta={item.meta}
                        price={item.price}
                        title={item.title}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section aria-labelledby="pricing-details-heading" className="mt-16 max-w-3xl">
        <h2
          className="font-serif font-medium text-2xl md:text-4xl leading-snug text-foreground mb-8"
          id="pricing-details-heading"
        >
          Policies
        </h2>
        <p className="font-sans text-[17px] leading-relaxed text-foreground">
          {site_content.pricing_preview.policies_short}
        </p>
      </section>

      <section aria-labelledby="pricing-cta-heading" className="mt-16">
        <div className="max-w-6xl mx-auto bg-surface rounded-3xl py-24 px-8 md:px-16 flex flex-col items-center text-center">
          <h2
            className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-foreground"
            id="pricing-cta-heading"
          >
            Ready to book?
          </h2>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href={site_content.primary_cta.href}>
              {site_content.primary_cta.label}
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Contact
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
