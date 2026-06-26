import { PreviewCardGrid } from '@/components/sections/preview-card';
import { ButtonLink } from '@/components/ui/button-link';
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
    imageSrc: item.image_src,
    imageAlt: item.image_alt,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24">
      <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground opacity-80">
        {site_content.classes_preview.section_label}
      </p>
      <h1
        className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-foreground mt-3 mb-4"
        id="classes-page-heading"
      >
        {site_content.classes_preview.heading}
      </h1>
      <p className="font-sans text-lg md:text-xl leading-relaxed text-foreground max-w-3xl">
        {site_content.classes_preview.intro_text}
      </p>

      <section aria-labelledby="classes-grid-heading" className="mt-16">
        <h2 className="sr-only" id="classes-grid-heading">
          Available classes
        </h2>
        <PreviewCardGrid items={classes_items} />
      </section>

      <section aria-labelledby="class-details-heading" className="mt-16 max-w-3xl">
        <h2
          className="font-serif font-medium text-2xl md:text-4xl leading-snug text-foreground mb-8"
          id="class-details-heading"
        >
          What to know before you book
        </h2>
        <div className="space-y-8">
          <div>
            <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-foreground">
              Who are these classes for?
            </h3>
            <p className="mt-3 font-sans text-[17px] leading-relaxed text-foreground">
              Classes are designed for all levels, from complete beginners to experienced
              practitioners.
            </p>
          </div>
          <div>
            <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-foreground">
              What should I bring?
            </h3>
            <p className="mt-3 font-sans text-[17px] leading-relaxed text-foreground">
              {site_content.faq_preview.items[0]?.answer || 'TODO_FAQ_ANSWER'}
            </p>
          </div>
          <div>
            <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-foreground">
              How early should I arrive?
            </h3>
            <p className="mt-3 font-sans text-[17px] leading-relaxed text-foreground">
              {site_content.faq_preview.items[1]?.answer || 'TODO_FAQ_ANSWER'}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="classes-cta-heading" className="mt-16">
        <div className="max-w-6xl mx-auto bg-surface rounded-3xl py-24 px-8 md:px-16 flex flex-col items-center text-center">
          <h2
            className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-foreground"
            id="classes-cta-heading"
          >
            Ready to start?
          </h2>
          <p className="mt-6 font-sans text-lg md:text-xl leading-relaxed text-foreground">
            Book your first class or view our pricing to find the right package for you.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href={site_content.primary_cta.href}>
              {site_content.primary_cta.label}
            </ButtonLink>
            <ButtonLink href="/pricing" variant="secondary">
              View pricing
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
