import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteHeaderView } from "./site-header-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
}));

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

    expect(within(header).getByRole("link", { name: /core\s*house/i })).toHaveAttribute("href", "/");
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

  it("shows the Account menu when signed in", () => {
    render(
      <SiteHeaderView
        auth={{
          is_signed_in: true,
          is_staff: false,
          is_admin_or_owner: false,
          display_name: "Alex",
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /account/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
  });

  it("opens an accessible mobile navigation menu", () => {
    render(
      <SiteHeaderView
        auth={{ is_signed_in: false, is_staff: false, is_admin_or_owner: false, display_name: null }}
      />,
    );

    const menuButton = screen.getByRole("button", { name: "Open menu" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const mobileNavigation = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(within(mobileNavigation).getByRole("link", { name: "Classes" })).toHaveAttribute(
      "href",
      "/classes",
    );
  });
});
