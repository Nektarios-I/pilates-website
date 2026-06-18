import { PreviewCardGrid } from '@/components/sections/preview-card';
import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { site_content } from '@/config/site_content';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Classes',
  description: 'Reformer and mat Pilates classes at corehouse Pilates Studio.',
  path: '/classes',
});

export default function ClassesPage() {
  const classes_items = site_content.classes_preview.items.map((item) => ({
    title: item.name,
    description: item.description,
    meta: `${item.duration} • ${item.level} • ${item.capacity}`,
  }));

  return (
    <>
      <Section aria-labelledby="classes-page-heading" className="bg-background">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              {site_content.classes_preview.section_label}
            </p>
            <h1
              className="mt-4 text-4xl font-semibold tracking-normal text-stone-950 sm:text-5xl"
              id="classes-page-heading"
            >
              {site_content.classes_preview.heading}
            </h1>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              {site_content.classes_preview.intro_text}
            </p>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="classes-grid-heading" className="bg-muted">
        <Container>
          <h2 className="sr-only" id="classes-grid-heading">
            Available classes
          </h2>
          <PreviewCardGrid items={classes_items} />
        </Container>
      </Section>

      <Section aria-labelledby="class-details-heading" className="bg-background">
        <Container>
          <div className="max-w-3xl">
            <h2
              className="text-3xl font-semibold tracking-normal text-stone-950"
              id="class-details-heading"
            >
              What to know before you book
            </h2>
            <div className="mt-6 space-y-4 text-base leading-7 text-stone-700">
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="font-semibold text-stone-950">Who are these classes for?</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  Classes are designed for all levels, from complete beginners to experienced
                  practitioners.
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="font-semibold text-stone-950">What should I bring?</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {site_content.faq_preview.items[0]?.answer || 'TODO_FAQ_ANSWER'}
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="font-semibold text-stone-950">How early should I arrive?</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {site_content.faq_preview.items[1]?.answer || 'TODO_FAQ_ANSWER'}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="classes-cta-heading" className="bg-stone-950 text-white">
        <Container>
          <div className="max-w-3xl text-center">
            <h2
              className="text-3xl font-semibold tracking-normal text-white sm:text-4xl"
              id="classes-cta-heading"
            >
              Ready to start?
            </h2>
            <p className="mt-4 text-base leading-7 text-stone-200">
              Book your first class or view our pricing to find the right package for you.
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
                href="/pricing"
                variant="secondary"
              >
                View pricing
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
