import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { site_content } from '@/config/site_content';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Contact',
  description:
    'Get in touch with our studio. Find our location, contact details, and studio hours.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <>
      <Section aria-labelledby="contact-page-heading" className="bg-background">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              {site_content.contact_preview.section_label}
            </p>
            <h1
              className="mt-4 text-4xl font-semibold tracking-normal text-stone-950 sm:text-5xl"
              id="contact-page-heading"
            >
              {site_content.contact_preview.heading}
            </h1>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              {site_content.contact_preview.intro_text}
            </p>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="contact-details-heading" className="bg-muted">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-md border border-border bg-surface p-6">
              <h2
                className="text-xl font-semibold tracking-normal text-stone-950"
                id="contact-details-heading"
              >
                Contact details
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-stone-950">Phone</dt>
                  <dd className="mt-1 text-stone-700">
                    <a
                      className="transition-colors hover:text-stone-950"
                      href={`tel:${site_content.contact_preview.phone_href}`}
                    >
                      {site_content.contact_preview.phone}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-md border border-border bg-surface p-6">
              <h2 className="text-xl font-semibold tracking-normal text-stone-950">Location</h2>
              <p className="mt-4 text-sm leading-6 text-stone-700">
                {site_content.contact_preview.country}
              </p>
              {site_content.contact_preview.google_maps_url ? (
                <a
                  className="mt-3 inline-block text-sm font-medium text-stone-700 underline underline-offset-4 hover:text-stone-950"
                  href={site_content.contact_preview.google_maps_url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open in Google Maps
                </a>
              ) : null}
            </div>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="studio-hours-heading" className="bg-background">
        <Container>
          <div className="max-w-3xl">
            <h2
              className="text-3xl font-semibold tracking-normal text-stone-950"
              id="studio-hours-heading"
            >
              Studio hours
            </h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">Weekdays</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {site_content.contact_preview.hours.weekday}
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">Saturday</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {site_content.contact_preview.hours.saturday}
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">Sunday</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {site_content.contact_preview.hours.sunday}
                </p>
              </div>
              {site_content.contact_preview.hours.note && (
                <div className="rounded-md border border-border bg-surface p-6">
                  <h3 className="text-base font-semibold text-stone-950">Note</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    {site_content.contact_preview.hours.note}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="contact-cta-heading" className="bg-stone-950 text-white">
        <Container>
          <div className="max-w-3xl text-center">
            <h2
              className="text-3xl font-semibold tracking-normal text-white sm:text-4xl"
              id="contact-cta-heading"
            >
              Ready to visit?
            </h2>
            <p className="mt-4 text-base leading-7 text-stone-200">
              Book your first class or view our FAQ for answers to common questions.
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
                href="/faq"
                variant="secondary"
              >
                View FAQ
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
