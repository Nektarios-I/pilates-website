import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MarketingLayout from "./layout";
import HomePage from "./page";

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
        name: "A calm starting point for Pilates studio information",
      }),
    ).toBeInTheDocument();

    const sectionHeadings = [
      "Designed to explain the studio clearly",
      "Class paths ready for confirmed details",
      "A place for reviewed teacher profiles",
      "Prepared for verified proof points",
      "Start with a simple studio inquiry",
    ];

    for (const heading of sectionHeadings) {
      expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
    }

    expect(screen.getByRole("heading", { level: 3, name: "Reformer Pilates" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Lead instructor profile" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Testimonials pending" }),
    ).toBeInTheDocument();
  });

  it("shows the primary CTA in the main homepage content", () => {
    render(
      <MarketingLayout>
        <HomePage />
      </MarketingLayout>,
    );

    const main = screen.getByRole("main");
    const contactActions = within(main).getAllByRole("link", { name: "Contact the studio" });

    expect(contactActions).toHaveLength(2);
    for (const action of contactActions) {
      expect(action).toHaveAttribute("href", "/contact");
    }
  });
});
