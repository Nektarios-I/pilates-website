import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteHeaderView } from "@/components/layout/site-header-view";
import MarketingLayout from "./layout";
import HomePage from "./page";
import { homeContent } from "@/features/home/home-content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
}));

vi.mock("@/components/layout/use-header-auth", () => ({
  useHeaderAuth: (auth: unknown) => auth,
}));

vi.mock("@/components/layout/site-header", () => ({
  SiteHeader: () => (
    <SiteHeaderView
      auth={{ is_signed_in: false, is_staff: false, is_admin_or_owner: false, display_name: null }}
    />
  ),
}));

describe("HomePage", () => {
  it("renders inside the shared marketing landmarks", () => {
    render(
      <MarketingLayout>
        <HomePage />
      </MarketingLayout>,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders the homepage shell sections with a clear heading structure", () => {
    render(<HomePage />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: homeContent.hero.title,
      }),
    ).toBeInTheDocument();

    const sectionHeadings = [
      homeContent.studio_overview.title,
      homeContent.classes.title,
      homeContent.pricing.title,
      homeContent.instructors.title,
      homeContent.contact.title,
      homeContent.faq.title,
    ];

    for (const heading of sectionHeadings) {
      expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
    }

    expect(screen.getByRole("heading", { level: 3, name: "Reformer" })).toBeInTheDocument();
    expect(screen.getByText("Panayiota")).toBeInTheDocument();
    expect(screen.getByText("Irene")).toBeInTheDocument();
  });

  it("shows the primary CTA in the main homepage content", () => {
    render(
      <MarketingLayout>
        <HomePage />
      </MarketingLayout>,
    );

    const main = screen.getByRole("main");
    expect(within(main).getAllByRole("link", { name: "Book Now" }).length).toBeGreaterThan(0);
  });
});
