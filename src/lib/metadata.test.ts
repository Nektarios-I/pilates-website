import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";
import { site_content } from "@/config/site_content";

import { createPageMetadata, siteMetadata } from "./metadata";

describe("metadata helpers", () => {
  it("provides site-wide metadata defaults", () => {
    expect(siteMetadata.metadataBase?.toString()).toBe(`${siteConfig.siteUrl}/`);
    expect(siteMetadata.description).toBe(siteConfig.defaultDescription);
    expect(siteMetadata.applicationName).toBe(siteConfig.name);
    expect(siteMetadata.keywords).toEqual(site_content.seo.keywords);
    expect(siteMetadata.openGraph).toMatchObject({
      title: siteConfig.defaultTitle,
      description: siteConfig.defaultDescription,
      siteName: siteConfig.name,
      url: `${siteConfig.siteUrl}/`,
      locale: "en_GB",
      images: [
        {
          url: "/images/seo/corehouse_logo.png",
          width: 571,
          height: 347,
          alt: "corehouse Pilates Studio logo",
        },
      ],
    });
    expect(siteMetadata.icons).toMatchObject({
      icon: [
        { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
        { url: '/images/seo/favicon-192.png', sizes: '192x192', type: 'image/png' },
      ],
      shortcut: ['/favicon.ico'],
    });
    expect(siteMetadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: siteConfig.defaultTitle,
      description: siteConfig.defaultDescription,
    });
  });

  it("creates route metadata with canonical and Open Graph URL", () => {
    const metadata = createPageMetadata({
      title: "Classes",
      description: "Class overview metadata description.",
      path: "/classes",
    });

    expect(metadata).toMatchObject({
      title: "Classes",
      description: "Class overview metadata description.",
      alternates: {
        canonical: "/classes",
      },
      openGraph: {
        title: "Classes",
        description: "Class overview metadata description.",
        siteName: siteConfig.name,
        type: "website",
        url: `${siteConfig.siteUrl}/classes`,
      },
    });
  });
});
