import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { site_content } from '@/config/site_content';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'FAQ',
  description:
    'Frequently asked questions about our Pilates classes, studio policies, and what to expect.',
  path: '/faq',
});

export default function FaqPage() {
  return (
    <>
      <Section aria-labelledby="faq-page-heading" className="bg-background">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              {site_content.faq_preview.section_label}
            </p>
            <h1
              className="mt-4 text-4xl font-semibold tracking-normal text-stone-950 sm:text-5xl"
              id="faq-page-heading"
            >
              {site_content.faq_preview.heading}
            </h1>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              {site_content.faq_preview.intro_text}
            </p>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="faq-list-heading" className="bg-muted">
        <Container>
          <div className="max-w-3xl">
            <h2 className="sr-only" id="faq-list-heading">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {site_content.faq_preview.items.map((item, index) => (
                <div key={index} className="rounded-md border border-border bg-surface p-6">
                  <h3 className="text-lg font-semibold text-stone-950">{item.question}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-700">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="additional-questions-heading" className="bg-background">
        <Container>
          <div className="max-w-3xl">
            <h2
              className="text-3xl font-semibold tracking-normal text-stone-950"
              id="additional-questions-heading"
            >
              Additional information
            </h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">Studio policies</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {site_content.pricing_preview.policies_short}
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">First-time visitors</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  New clients are welcome to start with any class that matches their comfort level.
                  Our intro offer provides the best value for trying the studio.
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">Still have questions?</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  Contact us directly for any additional questions not covered here.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="faq-cta-heading" className="bg-stone-950 text-white">
        <Container>
          <div className="max-w-3xl text-center">
            <h2
              className="text-3xl font-semibold tracking-normal text-white sm:text-4xl"
              id="faq-cta-heading"
            >
              Ready to book?
            </h2>
            <p className="mt-4 text-base leading-7 text-stone-200">
              Start with our intro offer or explore our full class schedule and pricing.
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
                href="/contact"
                variant="secondary"
              >
                Contact us
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
