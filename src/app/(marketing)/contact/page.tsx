import { ContactForm } from '@/components/sections/contact-form';
import { ButtonLink } from '@/components/ui/button-link';
import { site_content } from '@/config/site_content';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Contact',
  description:
    'Contact corehouse Pilates Studio in Cyprus. Find studio hours, location, and send us a message.',
  path: '/contact',
});

export default function ContactPage() {
  const { contact_preview } = site_content;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        <div>
          <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground opacity-80">
            {contact_preview.section_label}
          </p>
          <h1
            className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-foreground mb-6 mt-3"
            id="contact-page-heading"
          >
            {contact_preview.heading}
          </h1>
          <p className="font-sans text-lg md:text-xl leading-relaxed text-foreground">
            {contact_preview.intro_text}
          </p>

          <dl className="mt-10 space-y-6">
            <div>
              <dt className="font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground mb-2">
                Phone
              </dt>
              <dd>
                <a
                  className="inline-flex min-h-11 items-center font-sans text-[17px] leading-relaxed text-foreground hover:text-accent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  href={`tel:${contact_preview.phone_href}`}
                >
                  {contact_preview.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground mb-2">
                Location
              </dt>
              <dd className="font-sans text-[17px] leading-relaxed text-foreground">
                {contact_preview.country}
              </dd>
              {contact_preview.google_maps_url ? (
                <dd className="mt-2">
                  <a
                    className="inline-flex min-h-11 items-center font-sans text-[17px] leading-relaxed text-foreground hover:text-accent transition-colors underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
              <dt className="font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground mb-2">
                Studio hours
              </dt>
              <dd className="font-sans text-[17px] leading-relaxed text-foreground">
                {contact_preview.hours.weekday}
              </dd>
              <dd className="font-sans text-[17px] leading-relaxed text-foreground">
                {contact_preview.hours.saturday}
              </dd>
              <dd className="font-sans text-[17px] leading-relaxed text-foreground">
                {contact_preview.hours.sunday}
              </dd>
              {contact_preview.hours.note ? (
                <dd className="mt-2 font-sans text-[17px] leading-relaxed text-foreground">
                  {contact_preview.hours.note}
                </dd>
              ) : null}
            </div>
          </dl>
        </div>

        <ContactForm />
      </div>

      <section aria-labelledby="contact-cta-heading" className="mt-16">
        <div className="max-w-6xl mx-auto bg-surface rounded-3xl py-24 px-8 md:px-16 flex flex-col items-center text-center">
          <h2
            className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-foreground"
            id="contact-cta-heading"
          >
            Ready to visit?
          </h2>
          <p className="mt-6 font-sans text-lg md:text-xl leading-relaxed text-foreground">
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
