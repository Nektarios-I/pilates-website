const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_STUDIO_NAME ?? "Corehouse Pilates Studio",
  siteUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  defaultTitle: "Corehouse Pilates Studio",
  defaultDescription:
    "Corehouse Pilates Studio is preparing a calm, accessible, and mobile-first website for Pilates classes, pricing, instructors, and contact information.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@example.com",
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+357-00-000000",
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL ?? "/contact",
  socialLinks: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com/example",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://facebook.com/example",
  },
  mapEmbedUrl:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ??
    "https://www.google.com/maps/embed?pb=REPLACE_ME",
} as const;

export type SiteConfig = typeof siteConfig;
