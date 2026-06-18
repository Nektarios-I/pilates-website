import { PreviewCardGrid } from '@/components/sections/preview-card';
import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { site_content } from '@/config/site_content';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Pricing',
  description: 'Reformer and mat Pilates pricing — single classes and monthly packages at corehouse.',
  path: '/pricing',
});

function plan_cards(
  plans: ReadonlyArray<{ name: string; price: string; description: string }>,
  eyebrow?: string,
) {
  return plans.map((plan) => ({
    title: plan.name,
    description: plan.description,
    meta: plan.price,
    eyebrow,
  }));
}

export default function PricingPage() {
  const { mat, reformer } = site_content.pricing_preview;

  const pricing_groups = [
    {
      title: 'Reformer Pilates',
      description: 'Equipment-based classes with small-group capacity and precise spring resistance.',
      accent: 'bg-stone-950 text-white',
      sections: [
        { title: 'Single class', items: plan_cards([reformer.single], 'Reformer drop-in') },
        { title: '1 month packages', items: plan_cards(reformer.one_month, 'Reformer · 30 days') },
        { title: '3 month packages', items: plan_cards(reformer.three_month, 'Reformer · 90 days') },
      ],
    },
    {
      title: 'Mat Pilates',
      description: 'Floor-based classes for core strength, mobility, and breath-led control.',
      accent: 'bg-amber-100 text-stone-950',
      sections: [
        { title: 'Single class', items: plan_cards([mat.single], 'Mat drop-in') },
        { title: '1 month packages', items: plan_cards(mat.one_month, 'Mat · 30 days') },
        { title: '3 month packages', items: plan_cards(mat.three_month, 'Mat · 90 days') },
      ],
    },
  ];

  return (
    <>
      <Section aria-labelledby="pricing-page-heading" className="bg-background">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              {site_content.pricing_preview.section_label}
            </p>
            <h1
              className="mt-4 text-4xl font-semibold tracking-normal text-stone-950 sm:text-5xl"
              id="pricing-page-heading"
            >
              {site_content.pricing_preview.heading}
            </h1>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              {site_content.pricing_preview.intro_text}
            </p>
          </div>
        </Container>
      </Section>

      {pricing_groups.map((group) => (
        <Section
          key={group.title}
          aria-labelledby={`pricing-${group.title}`}
          className="bg-muted even:bg-background"
        >
          <Container>
            <div className="mb-8 rounded-lg border border-border bg-surface p-6">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${group.accent}`}>
                {group.title}
              </span>
              <h2
                className="mt-4 text-2xl font-semibold text-stone-950"
                id={`pricing-${group.title}`}
              >
                {group.title} packages
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                {group.description}
              </p>
            </div>

            <div className="space-y-10">
              {group.sections.map((section) => (
                <div key={`${group.title}-${section.title}`}>
                  <h3 className="mb-4 text-lg font-semibold text-stone-950">{section.title}</h3>
                  <PreviewCardGrid items={section.items} />
                </div>
              ))}
            </div>
          </Container>
        </Section>
      ))}

      <Section aria-labelledby="pricing-details-heading" className="bg-background">
        <Container>
          <div className="max-w-3xl">
            <h2
              className="text-3xl font-semibold tracking-normal text-stone-950"
              id="pricing-details-heading"
            >
              Policies
            </h2>
            <p className="mt-6 text-sm leading-6 text-stone-700">
              {site_content.pricing_preview.policies_short}
            </p>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="pricing-cta-heading" className="bg-stone-950 text-white">
        <Container>
          <div className="max-w-3xl text-center">
            <h2
              className="text-3xl font-semibold tracking-normal text-white sm:text-4xl"
              id="pricing-cta-heading"
            >
              Ready to book?
            </h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <ButtonLink
                className="border-white bg-white text-stone-950 hover:bg-stone-100"
                href={site_content.primary_cta.href}
              >
                {site_content.primary_cta.label}
              </ButtonLink>
              <ButtonLink
                className="border-stone-600 bg-transparent text-white hover:border-white"
                href="/contact"
                variant="secondary"
              >
                Contact
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
