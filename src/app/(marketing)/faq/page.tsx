import { FaqAccordion } from '@/components/sections/faq-accordion';
import { ButtonLink } from '@/components/ui/button-link';
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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24">
      <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] opacity-80">
        {site_content.faq_preview.section_label}
      </p>
      <h1
        className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-[#2D3A1F] mb-12 mt-3"
        id="faq-page-heading"
      >
        {site_content.faq_preview.heading}
      </h1>
      <p className="font-sans text-lg md:text-xl leading-relaxed text-[#2D3A1F] max-w-3xl mb-12">
        {site_content.faq_preview.intro_text}
      </p>

      <FaqAccordion items={site_content.faq_preview.items} />

      <section aria-labelledby="additional-questions-heading" className="mt-16 max-w-3xl mx-auto">
        <h2
          className="font-serif font-medium text-2xl md:text-4xl leading-snug text-[#2D3A1F] mb-8"
          id="additional-questions-heading"
        >
          Additional information
        </h2>
        <div className="space-y-8">
          <div id="rules">
            <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F]">
              Studio rules
            </h3>
            <p className="mt-3 font-sans text-[17px] leading-relaxed text-[#2D3A1F]">
              {site_content.pricing_preview.policies_short}
            </p>
          </div>
          <div>
            <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F]">
              Still have questions?
            </h3>
            <p className="mt-3 font-sans text-[17px] leading-relaxed text-[#2D3A1F]">
              Call {site_content.contact_preview.phone} for help with booking or memberships.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-cta-heading" className="mt-16">
        <div className="max-w-6xl mx-auto bg-[#E8E2D0] rounded-3xl py-24 px-8 md:px-16 flex flex-col items-center text-center">
          <h2
            className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-[#2D3A1F]"
            id="faq-cta-heading"
          >
            Ready to book?
          </h2>
          <p className="mt-6 font-sans text-lg md:text-xl leading-relaxed text-[#2D3A1F]">
            Book a class or review pricing and studio hours.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href={site_content.primary_cta.href}>
              {site_content.primary_cta.label}
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Contact us
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
