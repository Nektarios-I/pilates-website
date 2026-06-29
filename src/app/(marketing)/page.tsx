import Link from "next/link";

import { FaqAccordion } from "@/components/sections/faq-accordion";
import { PageHero } from "@/components/sections/page-hero";
import { PreviewCardGrid } from "@/components/sections/preview-card";
import { PricingTierCard } from "@/components/sections/pricing-tier-card";
import { SectionWrapper } from "@/components/sections/section-wrapper";
import { ButtonLink } from "@/components/ui/button-link";
import { ContentImage } from "@/components/ui/content-image";
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
        className="w-full bg-surface py-24"
        id={homeContent.studio_overview.id}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground opacity-80">
            {homeContent.studio_overview.eyebrow}
          </p>
          <h2
            className="mt-3 mb-4 font-serif font-medium text-2xl md:text-4xl leading-snug text-foreground"
            id={`${homeContent.studio_overview.id}-heading`}
          >
            {homeContent.studio_overview.title}
          </h2>
          <p className="mb-16 font-sans text-lg md:text-xl leading-relaxed text-foreground">
            {homeContent.studio_overview.description}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {homeContent.studio_overview.items.map((item, index) => (
              <div key={index} className="flex flex-col gap-4">
                <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-foreground">
                  {item.title}
                </h3>
                <p className="font-sans text-[17px] leading-relaxed text-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby={`${homeContent.classes.id}-heading`}
        className="w-full bg-background py-24"
        id={homeContent.classes.id}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div className="max-w-3xl">
              <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground opacity-80">
                {homeContent.classes.eyebrow}
              </p>
              <h2
                className="mt-3 font-serif font-medium text-2xl md:text-4xl leading-snug text-foreground"
                id={`${homeContent.classes.id}-heading`}
              >
                {homeContent.classes.title}
              </h2>
              <p className="mt-4 font-sans text-lg md:text-xl leading-relaxed text-foreground">
                {homeContent.classes.description}
              </p>
            </div>
            <Link
              className="mt-6 md:mt-0 inline-flex min-h-11 shrink-0 items-center font-sans font-medium text-foreground border-b border-accent pb-0.5 transition-colors duration-200 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {homeContent.pricing.items.map((plan) => (
            <PricingTierCard
              key={plan.title}
              ctaHref={homeContent.pricing.cta_href}
              ctaLabel={homeContent.pricing.cta_label}
              description={plan.description}
              featured={plan.featured}
              price={plan.price}
              title={plan.title}
            />
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <ButtonLink href={homeContent.pricing.cta_href as "/" | `/${string}`}>
            {homeContent.pricing.cta_label}
          </ButtonLink>
        </div>
      </SectionWrapper>

      <section
        aria-labelledby={`${homeContent.instructors.id}-heading`}
        className="w-full bg-background py-24"
        id={homeContent.instructors.id}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface">
              <ContentImage
                alt={homeContent.instructors.feature_image.alt}
                imageClassName="transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 40vw"
                src={homeContent.instructors.feature_image.src}
              />
            </div>
            <div>
              <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground opacity-80">
                {homeContent.instructors.eyebrow}
              </p>
              <h2
                className="mt-3 mb-4 font-serif font-medium text-2xl md:text-4xl leading-snug text-foreground"
                id={`${homeContent.instructors.id}-heading`}
              >
                {homeContent.instructors.title}
              </h2>
              <p className="font-sans text-lg md:text-xl leading-relaxed text-foreground">
                {homeContent.instructors.description}
              </p>
              <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {homeContent.instructors.names.map((name) => (
                  <li
                    key={name}
                    className="font-serif font-medium text-xl md:text-2xl leading-normal text-foreground"
                  >
                    {name}
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <ButtonLink href={homeContent.instructors.cta_href as "/" | `/${string}`}>
                  {homeContent.instructors.cta_label}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="home-testimonials-heading"
        className="w-full bg-inverse py-32 flex flex-col items-center justify-center text-center px-4"
      >
        <h2 className="sr-only" id="home-testimonials-heading">
          Client testimonials
        </h2>
        <blockquote className="max-w-4xl font-serif font-medium text-2xl md:text-4xl leading-snug text-primary-foreground mb-8">
          &ldquo;Every session feels intentional — precise instruction in a calm space that makes
          movement feel natural again.&rdquo;
        </blockquote>
        <p className="font-sans font-medium text-xs tracking-wide text-primary-foreground/80 uppercase">
          Studio member
        </p>
        <div aria-hidden="true" className="w-px h-16 bg-background/20 mx-auto my-16" />
        <blockquote className="max-w-4xl font-serif font-medium text-2xl md:text-4xl leading-snug text-primary-foreground mb-8">
          &ldquo;The reformer classes are small, focused, and welcoming — exactly what I wanted
          from a boutique studio.&rdquo;
        </blockquote>
        <p className="font-sans font-medium text-xs tracking-wide text-primary-foreground/80 uppercase">
          Reformer regular
        </p>
      </section>

      <section aria-labelledby="home-final-cta-heading" className="w-full px-4 md:px-8 my-24">
        <div className="max-w-6xl mx-auto bg-surface rounded-3xl py-24 px-8 md:px-16 flex flex-col items-center text-center">
          <h2
            className="font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-foreground mb-6"
            id="home-final-cta-heading"
          >
            Ready to begin?
          </h2>
          <p className="font-sans text-lg md:text-xl leading-relaxed text-foreground mb-10 max-w-2xl">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface">
            <ContentImage
              alt={homeContent.faq.image.alt}
              sizes="(max-width: 768px) 100vw, 40vw"
              src={homeContent.faq.image.src}
            />
          </div>
          <FaqAccordion items={homeContent.faq.items} />
        </div>
        <div className="mt-10 flex justify-center">
          <ButtonLink href={homeContent.faq.cta_href as "/" | `/${string}`}>
            {homeContent.faq.cta_label}
          </ButtonLink>
        </div>
      </SectionWrapper>
    </>
  );
}
