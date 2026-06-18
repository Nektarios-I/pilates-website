import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteHeaderView } from "./site-header-view";

describe("SiteHeader", () => {
  it("shows the studio identity, primary navigation, and booking action", () => {
    render(
      <SiteHeaderView
        auth={{ is_signed_in: false, is_staff: false, is_admin_or_owner: false, display_name: null }}
      />,
    );

    const header = screen.getByRole("banner");
    const primaryNav = within(header).getByRole("navigation", {
      name: "Primary navigation",
    });

    expect(
      within(header).getByLabelText("corehouse Pilates Studio home"),
    ).toHaveAttribute("href", "/");
    expect(within(primaryNav).getByRole("link", { name: "Classes" })).toHaveAttribute(
      "href",
      "/classes",
    );
    expect(within(header).getByRole("link", { name: "Book Now" })).toHaveAttribute("href", "/book");
    expect(within(header).getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
