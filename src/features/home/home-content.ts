import { site_content } from "@/config/site_content";
import { site_images } from "@/config/site_images";

export type HomeCta = {
  label: string;
  href: "/" | `/${string}`;
};

export type HomeCard = {
  title: string;
  description: string;
  eyebrow?: string;
  meta?: string;
  cta?: HomeCta;
  imageSrc?: string;
  imageAlt?: string;
  graphicCard?: boolean;
};

export type HomePricingPlan = {
  title: string;
  price: string;
  description: string;
  featured?: boolean;
};

export type HomeSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  items: HomeCard[];
};

export const homeContent = {
  hero: {
    eyebrow: site_content.hero_content.eyebrow,
    title: site_content.hero_content.headline,
    description: site_content.hero_content.supporting_text,
    imageSrc: site_content.hero_content.image_src,
    imageAlt: site_content.hero_content.image_alt,
    primaryCta: {
      label: site_content.hero_content.primary_cta_label,
      href: site_content.hero_content.primary_cta_href as "/" | `/${string}`,
    },
    secondaryCta: {
      label: site_content.hero_content.secondary_cta_label,
      href: site_content.hero_content.secondary_cta_href as "/" | `/${string}`,
    },
  },
  studio_overview: {
    id: "studio-overview",
    eyebrow: site_content.studio_overview.section_label,
    title: site_content.studio_overview.heading,
    description: site_content.studio_overview.intro_text,
    items: site_content.studio_overview.highlights.map((highlight) => ({
      title: highlight,
      description: highlight,
    })),
  },
  classes: {
    id: "classes-preview",
    eyebrow: site_content.classes_preview.section_label,
    title: site_content.classes_preview.heading,
    description: site_content.classes_preview.intro_text,
    cta_label: site_content.classes_preview.cta_label,
    cta_href: site_content.classes_preview.cta_href,
    items: site_content.classes_preview.items.map((item) => ({
      title: item.name,
      description: item.description,
      meta: `${item.level} • ${item.capacity}`,
      imageSrc: item.image_src,
      imageAlt: item.image_alt,
      cta: {
        label: site_content.classes_preview.cta_label,
        href: site_content.classes_preview.cta_href as "/" | `/${string}`,
      },
    })),
  },
  pricing: {
    id: "pricing-preview",
    eyebrow: site_content.pricing_preview.section_label,
    title: site_content.pricing_preview.heading,
    description: site_content.pricing_preview.intro_text,
    cta_label: site_content.pricing_preview.cta_label,
    cta_href: site_content.pricing_preview.cta_href,
    items: site_content.pricing_preview.plans.map((plan, index) => ({
      title: plan.name,
      price: plan.price,
      description: plan.description,
      featured: index === 1,
    })),
  },
  instructors: {
    id: "instructors-preview",
    eyebrow: site_content.instructors_preview.section_label,
    title: site_content.instructors_preview.heading,
    description: site_content.instructors_preview.intro_text,
    cta_label: site_content.instructors_preview.cta_label,
    cta_href: site_content.instructors_preview.cta_href,
    feature_image: site_images.instructors.home_feature,
    names: site_content.instructors_preview.items.map((item) => item.name),
  },
  contact: {
    id: "contact-preview",
    eyebrow: site_content.contact_preview.section_label,
    title: site_content.contact_preview.heading,
    description: site_content.contact_preview.intro_text,
    cta_label: site_content.contact_preview.cta_label,
    cta_href: site_content.contact_preview.cta_href,
    items: [
      {
        title: "Contact us",
        description: site_content.contact_preview.phone,
        imageSrc: site_images.contact.contact_us.src,
        imageAlt: site_images.contact.contact_us.alt,
        graphicCard: true,
      },
      {
        title: "Studio schedule",
        description: `${site_content.contact_preview.hours.weekday} • ${site_content.contact_preview.hours.saturday} • ${site_content.contact_preview.hours.sunday}`,
        imageSrc: site_images.contact.schedule.src,
        imageAlt: site_images.contact.schedule.alt,
        graphicCard: true,
      },
    ],
  },
  faq: {
    id: "faq-preview",
    eyebrow: site_content.faq_preview.section_label,
    title: site_content.faq_preview.heading,
    description: site_content.faq_preview.intro_text,
    cta_label: site_content.faq_preview.cta_label,
    cta_href: site_content.faq_preview.cta_href,
    image: site_images.faq.equipment,
    items: site_content.faq_preview.items.map((item) => ({
      question: item.question,
      answer: item.answer,
    })),
  },
} as const;
