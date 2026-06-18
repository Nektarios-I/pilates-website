import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("renders footer studio context and footer navigation", () => {
    render(<SiteFooter />);

    const footer = screen.getByRole("contentinfo");

    expect(within(footer).getByLabelText("corehouse Pilates Studio home")).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "Classes" })).toHaveAttribute(
      "href",
      "/classes",
    );
    expect(within(footer).getByRole("link", { name: "Rules" })).toHaveAttribute(
      "href",
      "/faq#rules",
    );
    expect(within(footer).getByRole("link", { name: "+357 99 954286" })).toHaveAttribute(
      "href",
      "tel:+35799954286",
    );
  });
});
