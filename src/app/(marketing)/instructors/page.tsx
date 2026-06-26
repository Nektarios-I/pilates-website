import { ButtonLink } from '@/components/ui/button-link';
import { ContentImage } from '@/components/ui/content-image';
import { site_content } from '@/config/site_content';
import { site_images } from '@/config/site_images';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Instructors',
  description:
    'Meet the corehouse Pilates teaching team — attentive instruction in a calm, welcoming studio.',
  path: '/instructors',
});

export default function InstructorsPage() {
  const instructor_names = site_content.instructors_preview.items.map((item) => item.name);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24">
      <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground opacity-80">
        {site_content.instructors_preview.section_label}
      </p>
      <h1
        className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-foreground mt-3 mb-4"
        id="instructors-page-heading"
      >
        {site_content.instructors_preview.heading}
      </h1>
      <p className="font-sans text-lg md:text-xl leading-relaxed text-foreground max-w-3xl">
        {site_content.instructors_preview.intro_text}
      </p>

      <section aria-labelledby="instructors-feature-heading" className="mt-16">
        <h2 className="sr-only" id="instructors-feature-heading">
          Our instructors
        </h2>
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-surface">
          <ContentImage
            alt={site_images.instructors.page_feature.alt}
            sizes="(max-width: 768px) 100vw, 80vw"
            src={site_images.instructors.page_feature.src}
          />
        </div>
        <ul className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
          {instructor_names.map((name) => (
            <li
              key={name}
              className="font-serif font-medium text-2xl md:text-3xl leading-normal text-foreground"
            >
              {name}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="teaching-approach-heading" className="mt-16 max-w-3xl">
        <h2
          className="font-serif font-medium text-2xl md:text-4xl leading-snug text-foreground mb-8"
          id="teaching-approach-heading"
        >
          Our teaching approach
        </h2>
        <div className="space-y-8">
          <div>
            <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-foreground">
              Personalized guidance
            </h3>
            <p className="mt-3 font-sans text-[17px] leading-relaxed text-foreground">
              Our instructors provide individual attention and modifications to support your
              practice, regardless of experience level.
            </p>
          </div>
          <div>
            <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-foreground">
              Safe progression
            </h3>
            <p className="mt-3 font-sans text-[17px] leading-relaxed text-foreground">
              Classes focus on proper form, controlled movement, and building strength safely over
              time.
            </p>
          </div>
          <div>
            <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-foreground">
              Supportive environment
            </h3>
            <p className="mt-3 font-sans text-[17px] leading-relaxed text-foreground">
              We maintain small class sizes and a welcoming atmosphere where questions are
              encouraged.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="instructors-cta-heading" className="mt-16">
        <div className="max-w-6xl mx-auto bg-surface rounded-3xl py-24 px-8 md:px-16 flex flex-col items-center text-center">
          <h2
            className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-foreground"
            id="instructors-cta-heading"
          >
            Experience our approach
          </h2>
          <p className="mt-6 font-sans text-lg md:text-xl leading-relaxed text-foreground">
            Book a class to work with our instructors and discover the right practice for you.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href={site_content.primary_cta.href}>
              {site_content.primary_cta.label}
            </ButtonLink>
            <ButtonLink href="/classes" variant="secondary">
              View classes
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
