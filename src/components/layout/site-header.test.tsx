import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("shows the studio identity, primary navigation, and contact action", () => {
    render(<SiteHeader />);

    const header = screen.getByRole("banner");
    const primaryNav = within(header).getByRole("navigation", {
      name: "Primary navigation",
    });

    expect(within(header).getByRole("link", { name: siteConfig.name })).toHaveAttribute(
      "href",
      "/",
    );
    expect(within(primaryNav).getByRole("link", { name: "Classes" })).toHaveAttribute(
      "href",
      "/classes",
    );
    expect(within(header).getAllByRole("link", { name: "Contact" }).at(-1)).toHaveAttribute(
      "href",
      "/contact",
    );
  });
});
