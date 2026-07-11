import { describe, expect, it } from "vitest";

import { primaryNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";

import robots from "./robots";
import sitemap from "./sitemap";

const additional_public_routes = ["/about", "/book"] as const;

describe("indexing routes", () => {
  it("allows public crawling and points to the sitemap", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/staff/", "/account/", "/login", "/auth/", "/design"],
      },
      sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
    });
  });

  it("includes primary navigation routes plus about and book", () => {
    const entries = sitemap();
    const expected_count = primaryNavigation.length + additional_public_routes.length;

    expect(entries).toHaveLength(expected_count);

    for (const item of primaryNavigation) {
      const expectedUrl = `${siteConfig.siteUrl}${item.href === "/" ? "" : item.href}`;

      expect(entries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            url: expectedUrl,
            changeFrequency: item.href === "/" ? "weekly" : "monthly",
            priority: item.href === "/" ? 1 : 0.7,
          }),
        ]),
      );
    }

    for (const path of additional_public_routes) {
      expect(entries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            url: `${siteConfig.siteUrl}${path}`,
          }),
        ]),
      );
    }
  });
});
