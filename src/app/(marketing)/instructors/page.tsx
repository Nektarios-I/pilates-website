import { PreviewCardGrid } from '@/components/sections/preview-card';
import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { site_content } from '@/config/site_content';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Instructors',
  description:
    'Meet our Pilates instructors and learn about their experience, specialties, and approach to teaching.',
  path: '/instructors',
});

export default function InstructorsPage() {
  const instructors_items = site_content.instructors_preview.items.map((item) => ({
    title: item.name,
    description: item.bio,
    meta: item.role,
  }));

  return (
    <>
      <Section aria-labelledby="instructors-page-heading" className="bg-background">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              {site_content.instructors_preview.section_label}
            </p>
            <h1
              className="mt-4 text-4xl font-semibold tracking-normal text-stone-950 sm:text-5xl"
              id="instructors-page-heading"
            >
              {site_content.instructors_preview.heading}
            </h1>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              {site_content.instructors_preview.intro_text}
            </p>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="instructors-grid-heading" className="bg-muted">
        <Container>
          <h2 className="sr-only" id="instructors-grid-heading">
            Our instructors
          </h2>
          <PreviewCardGrid items={instructors_items} />
        </Container>
      </Section>

      <Section aria-labelledby="teaching-approach-heading" className="bg-background">
        <Container>
          <div className="max-w-3xl">
            <h2
              className="text-3xl font-semibold tracking-normal text-stone-950"
              id="teaching-approach-heading"
            >
              Our teaching approach
            </h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">Personalized guidance</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  Our instructors provide individual attention and modifications to support your
                  practice, regardless of experience level.
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">Safe progression</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  Classes focus on proper form, controlled movement, and building strength safely
                  over time.
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">Supportive environment</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  We maintain small class sizes and a welcoming atmosphere where questions are
                  encouraged.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="instructors-cta-heading" className="bg-stone-950 text-white">
        <Container>
          <div className="max-w-3xl text-center">
            <h2
              className="text-3xl font-semibold tracking-normal text-white sm:text-4xl"
              id="instructors-cta-heading"
            >
              Experience our approach
            </h2>
            <p className="mt-4 text-base leading-7 text-stone-200">
              Book a class to work with our instructors and discover the right practice for you.
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
