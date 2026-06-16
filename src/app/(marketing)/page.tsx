import { PageHero } from "@/components/sections/page-hero";
import { PreviewCardGrid } from "@/components/sections/preview-card";
import { SectionWrapper } from "@/components/sections/section-wrapper";
import { ButtonLink } from "@/components/ui/button-link";
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

      <SectionWrapper
        description={homeContent.studio_overview.description}
        eyebrow={homeContent.studio_overview.eyebrow}
        id={homeContent.studio_overview.id}
        title={homeContent.studio_overview.title}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {homeContent.studio_overview.items.map((item, index) => (
            <div key={index} className="rounded-md border border-border bg-surface p-6">
              <p className="text-sm leading-6 text-stone-700">{item.description}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper
        description={homeContent.classes.description}
        eyebrow={homeContent.classes.eyebrow}
        id={homeContent.classes.id}
        title={homeContent.classes.title}
        tone="muted"
      >
        <PreviewCardGrid items={homeContent.classes.items} />
        <div className="mt-6 flex justify-center">
          <ButtonLink href={homeContent.classes.cta_href as "/" | `/${string}`}>
            {homeContent.classes.cta_label}
          </ButtonLink>
        </div>
      </SectionWrapper>

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

      <SectionWrapper
        description={homeContent.instructors.description}
        eyebrow={homeContent.instructors.eyebrow}
        id={homeContent.instructors.id}
        title={homeContent.instructors.title}
        tone="muted"
      >
        <PreviewCardGrid items={homeContent.instructors.items} />
        <div className="mt-6 flex justify-center">
          <ButtonLink href={homeContent.instructors.cta_href as "/" | `/${string}`}>
            {homeContent.instructors.cta_label}
          </ButtonLink>
        </div>
      </SectionWrapper>

      <SectionWrapper
        description={homeContent.contact.description}
        eyebrow={homeContent.contact.eyebrow}
        id={homeContent.contact.id}
        title={homeContent.contact.title}
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
