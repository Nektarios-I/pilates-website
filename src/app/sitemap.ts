import type { MetadataRoute } from "next";

import { primaryNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";

const additional_public_routes = ["/about", "/book"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const nav_paths = primaryNavigation.map((item) => (item.href === "/" ? "" : item.href));
  const paths = [...new Set([...nav_paths, ...additional_public_routes])];

  return paths.map((path) => ({
    url: `${siteConfig.siteUrl}${path}`,
    lastModified,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/book" ? 0.9 : 0.7,
  }));
}
