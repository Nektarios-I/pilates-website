import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";

import { createPageMetadata, siteMetadata } from "./metadata";

describe("metadata helpers", () => {
  it("provides site-wide metadata defaults", () => {
    expect(siteMetadata.metadataBase?.toString()).toBe(`${siteConfig.siteUrl}/`);
    expect(siteMetadata.description).toBe(siteConfig.defaultDescription);
    expect(siteMetadata.applicationName).toBe(siteConfig.name);
    expect(siteMetadata.openGraph).toMatchObject({
      title: siteConfig.defaultTitle,
      description: siteConfig.defaultDescription,
      siteName: siteConfig.name,
      url: `${siteConfig.siteUrl}/`,
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
