import { site_content } from "@/config/site_content";

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
      meta: `${item.duration} • ${item.level} • ${item.capacity}`,
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
    intro_offer: {
      title: site_content.pricing_preview.intro_offer.title,
      price: site_content.pricing_preview.intro_offer.price,
      description: site_content.pricing_preview.intro_offer.description,
    },
    items: [
      {
        title: site_content.pricing_preview.intro_offer.title,
        description: site_content.pricing_preview.intro_offer.description,
        meta: site_content.pricing_preview.intro_offer.price,
        cta: {
          label: site_content.pricing_preview.cta_label,
          href: site_content.pricing_preview.cta_href as "/" | `/${string}`,
        },
      },
      ...site_content.pricing_preview.plans.map((plan) => ({
        title: plan.name,
        description: plan.description,
        meta: plan.price,
        cta: {
          label: site_content.pricing_preview.cta_label,
          href: site_content.pricing_preview.cta_href as "/" | `/${string}`,
        },
      })),
    ],
  },
  instructors: {
    id: "instructors-preview",
    eyebrow: site_content.instructors_preview.section_label,
    title: site_content.instructors_preview.heading,
    description: site_content.instructors_preview.intro_text,
    cta_label: site_content.instructors_preview.cta_label,
    cta_href: site_content.instructors_preview.cta_href,
    items: site_content.instructors_preview.items.map((item) => ({
      title: item.name,
      description: item.bio,
      meta: item.role,
      cta: {
        label: site_content.instructors_preview.cta_label,
        href: site_content.instructors_preview.cta_href as "/" | `/${string}`,
      },
    })),
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
        title: "Address",
        description: `${site_content.contact_preview.address_line_1}, ${site_content.contact_preview.city} ${site_content.contact_preview.postcode}`,
      },
      {
        title: "Contact",
        description: `Phone: ${site_content.contact_preview.phone} • Email: ${site_content.contact_preview.email}`,
      },
      {
        title: "Hours",
        description: `Weekdays: ${site_content.contact_preview.hours.weekday} • Saturdays: ${site_content.contact_preview.hours.saturday} • Sundays: ${site_content.contact_preview.hours.sunday}`,
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
    items: site_content.faq_preview.items.map((item) => ({
      title: item.question,
      description: item.answer,
    })),
  },
} as const;
