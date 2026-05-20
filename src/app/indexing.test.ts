import { describe, expect, it } from "vitest";

import { primaryNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";

import robots from "./robots";
import sitemap from "./sitemap";

describe("indexing routes", () => {
  it("allows public crawling and points to the sitemap", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
      },
      sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
    });
  });

  it("includes each primary marketing navigation route in the sitemap", () => {
    const entries = sitemap();

    expect(entries).toHaveLength(primaryNavigation.length);

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
  });
});
