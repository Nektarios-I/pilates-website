import type { Metadata } from "next";

import { site_content } from "@/config/site_content";
import { siteConfig } from "@/config/site";
import { brand_seo_images } from "@/lib/seo/brand-images";

type PageMetadataInput = {
  title: string;
  description: string;
  path?: "/" | `/${string}`;
};

const absoluteUrl = (path: string) => new URL(path, siteConfig.siteUrl).toString();

const shared_open_graph = {
  siteName: siteConfig.name,
  type: "website" as const,
  locale: "en_GB",
};

const shared_social_image = [
  {
    url: brand_seo_images.logo.path,
    width: brand_seo_images.logo.width,
    height: brand_seo_images.logo.height,
    alt: brand_seo_images.logo.alt,
  },
];

const shared_twitter = {
  card: "summary_large_image" as const,
  title: siteConfig.defaultTitle,
  description: siteConfig.defaultDescription,
  images: shared_social_image,
};

export const siteMetadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.defaultTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.defaultDescription,
  applicationName: siteConfig.name,
  keywords: [...site_content.seo.keywords],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: brand_seo_images.favicon.path, sizes: '48x48', type: 'image/x-icon' },
      {
        url: brand_seo_images.icon_png.path,
        sizes: `${brand_seo_images.icon_png.width}x${brand_seo_images.icon_png.height}`,
        type: brand_seo_images.icon_png.type,
      },
    ],
    apple: [
      {
        url: brand_seo_images.apple_icon.path,
        sizes: `${brand_seo_images.apple_icon.width}x${brand_seo_images.apple_icon.height}`,
        type: brand_seo_images.apple_icon.type,
      },
    ],
    shortcut: [brand_seo_images.favicon.path],
  },
  openGraph: {
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    ...shared_open_graph,
    url: absoluteUrl("/"),
    images: shared_social_image,
  },
  twitter: {
    ...shared_twitter,
  },
  category: "health",
};

export const createPageMetadata = ({
  title,
  description,
  path = "/",
}: PageMetadataInput): Metadata => ({
  title,
  description,
  alternates: {
    canonical: path,
  },
  openGraph: {
    title,
    description,
    url: absoluteUrl(path),
    ...shared_open_graph,
    images: shared_social_image,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: shared_social_image,
  },
});
