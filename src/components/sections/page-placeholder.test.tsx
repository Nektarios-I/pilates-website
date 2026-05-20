import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PagePlaceholder } from "./page-placeholder";

describe("PagePlaceholder", () => {
  it("renders the page shell copy and default contact action", () => {
    render(
      <PagePlaceholder
        description="A concise scaffold description for the current page."
        eyebrow="Scaffold"
        title="Placeholder title"
      />,
    );

    expect(screen.getByText("Scaffold")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Placeholder title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("A concise scaffold description for the current page.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact the studio" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("supports a route-specific next step", () => {
    render(
      <PagePlaceholder
        description="A concise scaffold description for the current page."
        eyebrow="Scaffold"
        nextStep={{ label: "View classes", href: "/classes" }}
        title="Placeholder title"
      />,
    );

    expect(screen.getByRole("link", { name: "View classes" })).toHaveAttribute(
      "href",
      "/classes",
    );
  });
});
