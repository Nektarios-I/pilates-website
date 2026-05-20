import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BlogPostPage, { generateMetadata } from "./page";

describe("blog article placeholder route", () => {
  it("renders a readable placeholder for the requested slug", async () => {
    render(await BlogPostPage({ params: Promise.resolve({ slug: "sample-entry" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Article placeholder" })).toBeInTheDocument();
    expect(screen.getByText(/sample entry/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to blog" })).toHaveAttribute("href", "/blog");
  });

  it("generates slug-aware placeholder metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "sample-entry" }),
    });

    expect(metadata.title).toBe("Blog Article");
    expect(metadata.alternates).toMatchObject({
      canonical: "/blog/sample-entry",
    });
  });
});
