import { ContactForm } from '@/components/sections/contact-form';
import { ButtonLink } from '@/components/ui/button-link';
import { site_content } from '@/config/site_content';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Contact',
  description:
    'Get in touch with our studio. Find our location, contact details, and studio hours.',
  path: '/contact',
});

export default function ContactPage() {
  const { contact_preview } = site_content;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        <div>
          <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] opacity-80">
            {contact_preview.section_label}
          </p>
          <h1
            className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-[#2D3A1F] mb-6 mt-3"
            id="contact-page-heading"
          >
            {contact_preview.heading}
          </h1>
          <p className="font-sans text-lg md:text-xl leading-relaxed text-[#2D3A1F]">
            {contact_preview.intro_text}
          </p>

          <dl className="mt-10 space-y-6">
            <div>
              <dt className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] mb-2">
                Phone
              </dt>
              <dd>
                <a
                  className="font-sans text-[17px] leading-relaxed text-[#2D3A1F] hover:text-[#B8A678] transition-colors"
                  href={`tel:${contact_preview.phone_href}`}
                >
                  {contact_preview.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] mb-2">
                Location
              </dt>
              <dd className="font-sans text-[17px] leading-relaxed text-[#2D3A1F]">
                {contact_preview.country}
              </dd>
              {contact_preview.google_maps_url ? (
                <dd className="mt-2">
                  <a
                    className="font-sans text-[17px] leading-relaxed text-[#2D3A1F] hover:text-[#B8A678] transition-colors underline underline-offset-4"
                    href={contact_preview.google_maps_url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open in Google Maps
                  </a>
                </dd>
              ) : null}
            </div>
            <div>
              <dt className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] mb-2">
                Studio hours
              </dt>
              <dd className="font-sans text-[17px] leading-relaxed text-[#2D3A1F]">
                {contact_preview.hours.weekday}
              </dd>
              <dd className="font-sans text-[17px] leading-relaxed text-[#2D3A1F]">
                {contact_preview.hours.saturday}
              </dd>
              <dd className="font-sans text-[17px] leading-relaxed text-[#2D3A1F]">
                {contact_preview.hours.sunday}
              </dd>
              {contact_preview.hours.note ? (
                <dd className="mt-2 font-sans text-[17px] leading-relaxed text-[#2D3A1F]">
                  {contact_preview.hours.note}
                </dd>
              ) : null}
            </div>
          </dl>
        </div>

        <ContactForm />
      </div>

      <section aria-labelledby="contact-cta-heading" className="mt-16">
        <div className="max-w-6xl mx-auto bg-[#E8E2D0] rounded-3xl py-24 px-8 md:px-16 flex flex-col items-center text-center">
          <h2
            className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-[#2D3A1F]"
            id="contact-cta-heading"
          >
            Ready to visit?
          </h2>
          <p className="mt-6 font-sans text-lg md:text-xl leading-relaxed text-[#2D3A1F]">
            Book your first class or view our FAQ for answers to common questions.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href={site_content.primary_cta.href}>
              {site_content.primary_cta.label}
            </ButtonLink>
            <ButtonLink href="/faq" variant="secondary">
              View FAQ
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
