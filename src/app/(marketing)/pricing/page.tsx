import { PreviewCardGrid } from '@/components/sections/preview-card';
import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { site_content } from '@/config/site_content';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Pricing',
  description:
    'View our Pilates class pricing including intro offers, single classes, class packs, and memberships.',
  path: '/pricing',
});

export default function PricingPage() {
  const pricing_items = [
    {
      title: site_content.pricing_preview.intro_offer.title,
      description: site_content.pricing_preview.intro_offer.description,
      meta: site_content.pricing_preview.intro_offer.price,
      eyebrow: 'New client offer',
    },
    ...site_content.pricing_preview.plans.map((plan) => ({
      title: plan.name,
      description: plan.description,
      meta: plan.price,
    })),
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

      <Section aria-labelledby="pricing-options-heading" className="bg-muted">
        <Container>
          <h2 className="sr-only" id="pricing-options-heading">
            Pricing options
          </h2>
          <PreviewCardGrid items={pricing_items} />
        </Container>
      </Section>

      <Section aria-labelledby="pricing-details-heading" className="bg-background">
        <Container>
          <div className="max-w-3xl">
            <h2
              className="text-3xl font-semibold tracking-normal text-stone-950"
              id="pricing-details-heading"
            >
              Pricing details
            </h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">Policies</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {site_content.pricing_preview.policies_short}
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">Cancellations</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {site_content.faq_preview.items[2]?.answer || 'TODO_FAQ_ANSWER'}
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">Getting started</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  New clients should start with our intro offer to experience the studio and decide
                  which ongoing package works best for their routine.
                </p>
              </div>
            </div>
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
              Ready to get started?
            </h2>
            <p className="mt-4 text-base leading-7 text-stone-200">
              Book your first class or explore our class offerings to find the right fit.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <ButtonLink
                className="border-white bg-white text-stone-950 hover:bg-stone-100"
                href={site_content.primary_cta.href}
              >
                {site_content.primary_cta.label}
              </ButtonLink>
              <ButtonLink
                className="border-stone-600 bg-transparent text-white hover:border-white"
                href="/classes"
                variant="secondary"
              >
                View classes
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
