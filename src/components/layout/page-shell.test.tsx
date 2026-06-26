import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { primaryNavigation } from "@/config/navigation";

import { SiteHeaderView } from "./site-header-view";
import { PageShell } from "./page-shell";

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

vi.mock("./site-header", () => ({
  SiteHeader: () => (
    <SiteHeaderView
      auth={{ is_signed_in: false, is_staff: false, is_admin_or_owner: false, display_name: null }}
    />
  ),
}));

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
