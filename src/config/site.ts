import { site_content } from "@/config/site_content";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_STUDIO_NAME ?? "corehouse Pilates Studio",
  siteUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  defaultTitle: "corehouse Pilates Studio",
  defaultDescription: site_content.seo.site_description,
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+35799954286",
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL ?? "/contact",
  socialLinks: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://www.instagram.com/corehouse.pilates.s/',
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? '',
  },
  mapEmbedUrl:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ??
    "https://www.google.com/maps/embed?pb=REPLACE_ME",
} as const;

export type SiteConfig = typeof siteConfig;
