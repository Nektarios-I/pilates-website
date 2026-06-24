import { ButtonLink } from '@/components/ui/button-link';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { site_content } from '@/config/site_content';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Instructors',
  description:
    'Meet our Pilates instructors and learn about their experience, specialties, and approach to teaching.',
  path: '/instructors',
});

export default function InstructorsPage() {
  const instructors_items = site_content.instructors_preview.items;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24">
      <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] opacity-80">
        {site_content.instructors_preview.section_label}
      </p>
      <h1
        className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-[#2D3A1F] mt-3 mb-4"
        id="instructors-page-heading"
      >
        {site_content.instructors_preview.heading}
      </h1>
      <p className="font-sans text-lg md:text-xl leading-relaxed text-[#2D3A1F] max-w-3xl">
        {site_content.instructors_preview.intro_text}
      </p>

      <section aria-labelledby="instructors-grid-heading" className="mt-16">
        <h2 className="sr-only" id="instructors-grid-heading">
          Our instructors
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {instructors_items.map((item) => (
            <article key={item.name} className="flex flex-col group cursor-pointer">
              <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[#E8E2D0] mb-4">
                <ImagePlaceholder className="rounded-2xl" />
              </div>
              <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F]">
                {item.name}
              </h3>
              <p className="font-sans text-sm leading-normal text-[#2D3A1F]">{item.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="teaching-approach-heading" className="mt-16 max-w-3xl">
        <h2
          className="font-serif font-medium text-2xl md:text-4xl leading-snug text-[#2D3A1F] mb-8"
          id="teaching-approach-heading"
        >
          Our teaching approach
        </h2>
        <div className="space-y-8">
          <div>
            <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F]">
              Personalized guidance
            </h3>
            <p className="mt-3 font-sans text-[17px] leading-relaxed text-[#2D3A1F]">
              Our instructors provide individual attention and modifications to support your
              practice, regardless of experience level.
            </p>
          </div>
          <div>
            <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F]">
              Safe progression
            </h3>
            <p className="mt-3 font-sans text-[17px] leading-relaxed text-[#2D3A1F]">
              Classes focus on proper form, controlled movement, and building strength safely over
              time.
            </p>
          </div>
          <div>
            <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F]">
              Supportive environment
            </h3>
            <p className="mt-3 font-sans text-[17px] leading-relaxed text-[#2D3A1F]">
              We maintain small class sizes and a welcoming atmosphere where questions are
              encouraged.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="instructors-cta-heading" className="mt-16">
        <div className="max-w-6xl mx-auto bg-[#E8E2D0] rounded-3xl py-24 px-8 md:px-16 flex flex-col items-center text-center">
          <h2
            className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-[#2D3A1F]"
            id="instructors-cta-heading"
          >
            Experience our approach
          </h2>
          <p className="mt-6 font-sans text-lg md:text-xl leading-relaxed text-[#2D3A1F]">
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
