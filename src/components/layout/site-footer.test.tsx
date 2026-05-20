import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";

import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("renders footer studio context and footer navigation", () => {
    render(<SiteFooter />);

    const footer = screen.getByRole("contentinfo");
    const footerNav = within(footer).getByRole("navigation", { name: "Footer navigation" });

    expect(within(footer).getByText(siteConfig.name)).toBeInTheDocument();
    expect(within(footer).getByText(/placeholder contact details/i)).toBeInTheDocument();
    expect(within(footerNav).getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });
});
