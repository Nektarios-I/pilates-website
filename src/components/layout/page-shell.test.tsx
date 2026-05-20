import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { primaryNavigation } from "@/config/navigation";

import { PageShell } from "./page-shell";

describe("PageShell", () => {
  it("renders the shared marketing landmarks around page content", () => {
    render(
      <PageShell>
        <h1>Page content</h1>
      </PageShell>,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toContainElement(
      screen.getByRole("heading", { level: 1, name: "Page content" }),
    );
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders configured navigation links in the primary navigation", () => {
    render(
      <PageShell>
        <h1>Page content</h1>
      </PageShell>,
    );

    const primaryNav = screen.getByRole("navigation", { name: "Primary navigation" });

    for (const item of primaryNavigation) {
      expect(within(primaryNav).getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    }
  });
});
