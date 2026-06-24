import Link from "next/link";

import { PageHero } from "@/components/sections/page-hero";
import { PreviewCardGrid } from "@/components/sections/preview-card";
import { SectionWrapper } from "@/components/sections/section-wrapper";
import { ButtonLink } from "@/components/ui/button-link";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { site_content } from "@/config/site_content";
import { homeContent } from "@/features/home/home-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Home",
  description: site_content.seo.site_description,
});

export default function HomePage() {
  return (
    <>
      <PageHero {...homeContent.hero} />

      <section
        aria-labelledby={`${homeContent.studio_overview.id}-heading`}
        className="w-full bg-[#E8E2D0] py-24"
        id={homeContent.studio_overview.id}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] opacity-80">
            {homeContent.studio_overview.eyebrow}
          </p>
          <h2
            className="mt-3 mb-4 font-serif font-medium text-2xl md:text-4xl leading-snug text-[#2D3A1F]"
            id={`${homeContent.studio_overview.id}-heading`}
          >
            {homeContent.studio_overview.title}
          </h2>
          <p className="mb-16 font-sans text-lg md:text-xl leading-relaxed text-[#2D3A1F]">
            {homeContent.studio_overview.description}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {homeContent.studio_overview.items.map((item, index) => (
              <div key={index} className="flex flex-col gap-4">
                <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F]">
                  {item.title}
                </h3>
                <p className="font-sans text-[17px] leading-relaxed text-[#2D3A1F]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby={`${homeContent.classes.id}-heading`}
        className="w-full bg-[#F4F1E8] py-24"
        id={homeContent.classes.id}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div className="max-w-3xl">
              <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] opacity-80">
                {homeContent.classes.eyebrow}
              </p>
              <h2
                className="mt-3 font-serif font-medium text-2xl md:text-4xl leading-snug text-[#2D3A1F]"
                id={`${homeContent.classes.id}-heading`}
              >
                {homeContent.classes.title}
              </h2>
              <p className="mt-4 font-sans text-lg md:text-xl leading-relaxed text-[#2D3A1F]">
                {homeContent.classes.description}
              </p>
            </div>
            <Link
              className="mt-6 md:mt-0 shrink-0 font-sans font-medium text-[#2D3A1F] border-b border-[#B8A678] pb-0.5 transition-colors duration-200 hover:text-[#B8A678]"
              href={homeContent.classes.cta_href as "/" | `/${string}`}
            >
              {homeContent.classes.cta_label}
            </Link>
          </div>
          <PreviewCardGrid items={homeContent.classes.items} />
        </div>
      </section>

      <SectionWrapper
        description={homeContent.pricing.description}
        eyebrow={homeContent.pricing.eyebrow}
        id={homeContent.pricing.id}
        title={homeContent.pricing.title}
      >
        <PreviewCardGrid items={homeContent.pricing.items} />
        <div className="mt-6 flex justify-center">
          <ButtonLink href={homeContent.pricing.cta_href as "/" | `/${string}`}>
            {homeContent.pricing.cta_label}
          </ButtonLink>
        </div>
      </SectionWrapper>

      <section
        aria-labelledby={`${homeContent.instructors.id}-heading`}
        className="w-full bg-[#F4F1E8] py-24"
        id={homeContent.instructors.id}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] opacity-80">
            {homeContent.instructors.eyebrow}
          </p>
          <h2
            className="mt-3 mb-4 font-serif font-medium text-2xl md:text-4xl leading-snug text-[#2D3A1F]"
            id={`${homeContent.instructors.id}-heading`}
          >
            {homeContent.instructors.title}
          </h2>
          <p className="mb-12 font-sans text-lg md:text-xl leading-relaxed text-[#2D3A1F]">
            {homeContent.instructors.description}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {homeContent.instructors.items.map((item) => (
              <article
                key={`${item.title}-${item.description}`}
                className="flex flex-col group cursor-pointer"
              >
                <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[#E8E2D0] mb-4">
                  <ImagePlaceholder className="h-full w-full rounded-2xl transition-transform duration-500 group-hover:scale-105" />
                </div>
                <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F]">
                  {item.title}
                </h3>
                {item.meta ? (
                  <p className="font-sans text-sm leading-normal text-[#2D3A1F] opacity-70">
                    {item.meta}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <ButtonLink href={homeContent.instructors.cta_href as "/" | `/${string}`}>
              {homeContent.instructors.cta_label}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="home-testimonials-heading"
        className="w-full bg-[#2D3A1F] py-32 flex flex-col items-center justify-center text-center px-4"
      >
        <h2 className="sr-only" id="home-testimonials-heading">
          Client testimonials
        </h2>
        <blockquote className="max-w-4xl font-serif font-medium text-2xl md:text-4xl leading-snug text-[#F4F1E8] mb-8">
          &ldquo;Every session feels intentional — precise instruction in a calm space that makes
          movement feel natural again.&rdquo;
        </blockquote>
        <p className="font-sans font-medium text-xs tracking-wide text-[#B8A678] uppercase">
          Studio member
        </p>
        <div aria-hidden="true" className="w-px h-16 bg-[#F4F1E8]/20 mx-auto my-16" />
        <blockquote className="max-w-4xl font-serif font-medium text-2xl md:text-4xl leading-snug text-[#F4F1E8] mb-8">
          &ldquo;The reformer classes are small, focused, and welcoming — exactly what I wanted
          from a boutique studio.&rdquo;
        </blockquote>
        <p className="font-sans font-medium text-xs tracking-wide text-[#B8A678] uppercase">
          Reformer regular
        </p>
      </section>

      <section aria-labelledby="home-final-cta-heading" className="w-full px-4 md:px-8 my-24">
        <div className="max-w-6xl mx-auto bg-[#E8E2D0] rounded-3xl py-24 px-8 md:px-16 flex flex-col items-center text-center">
          <h2
            className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-[#2D3A1F] mb-6"
            id="home-final-cta-heading"
          >
            Ready to begin?
          </h2>
          <p className="font-sans text-lg md:text-xl leading-relaxed text-[#2D3A1F] mb-10 max-w-2xl">
            {homeContent.hero.description}
          </p>
          <ButtonLink href={homeContent.hero.primaryCta.href}>
            {homeContent.hero.primaryCta.label}
          </ButtonLink>
        </div>
      </section>

      <SectionWrapper
        description={homeContent.contact.description}
        eyebrow={homeContent.contact.eyebrow}
        id={homeContent.contact.id}
        title={homeContent.contact.title}
        tone="muted"
      >
        <PreviewCardGrid items={homeContent.contact.items} />
        <div className="mt-6 flex justify-center">
          <ButtonLink href={homeContent.contact.cta_href as "/" | `/${string}`}>
            {homeContent.contact.cta_label}
          </ButtonLink>
        </div>
      </SectionWrapper>

      <SectionWrapper
        description={homeContent.faq.description}
        eyebrow={homeContent.faq.eyebrow}
        id={homeContent.faq.id}
        title={homeContent.faq.title}
        tone="muted"
      >
        <PreviewCardGrid items={homeContent.faq.items} />
        <div className="mt-6 flex justify-center">
          <ButtonLink href={homeContent.faq.cta_href as "/" | `/${string}`}>
            {homeContent.faq.cta_label}
          </ButtonLink>
        </div>
      </SectionWrapper>
    </>
  );
}
