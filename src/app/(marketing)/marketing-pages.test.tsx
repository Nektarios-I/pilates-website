import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AboutPage, { metadata as aboutMetadata } from "./about/page";
import BlogPage, { metadata as blogMetadata } from "./blog/page";
import ClassesPage, { metadata as classesMetadata } from "./classes/page";
import ContactPage, { metadata as contactMetadata } from "./contact/page";
import FaqPage, { metadata as faqMetadata } from "./faq/page";
import HomePage, { metadata as homeMetadata } from "./page";
import InstructorsPage, { metadata as instructorsMetadata } from "./instructors/page";
import PricingPage, { metadata as pricingMetadata } from "./pricing/page";

const marketingPages = [
  {
    name: "home",
    Page: HomePage,
    heading: "Where movement comes home.",
    metadata: homeMetadata,
    expectedTitle: "Home",
  },
  {
    name: "about",
    Page: AboutPage,
    heading: "Studio story placeholder",
    metadata: aboutMetadata,
    expectedTitle: "About",
  },
  {
    name: "classes",
    Page: ClassesPage,
    heading: "Reformer and mat",
    metadata: classesMetadata,
    expectedTitle: "Classes",
  },
  {
    name: "pricing",
    Page: PricingPage,
    heading: "Class packages",
    metadata: pricingMetadata,
    expectedTitle: "Pricing",
  },
  {
    name: "instructors",
    Page: InstructorsPage,
    heading: "The team",
    metadata: instructorsMetadata,
    expectedTitle: "Instructors",
  },
  {
    name: "contact",
    Page: ContactPage,
    heading: "Get in touch",
    metadata: contactMetadata,
    expectedTitle: "Contact",
  },
  {
    name: "faq",
    Page: FaqPage,
    heading: "Before your visit",
    metadata: faqMetadata,
    expectedTitle: "FAQ",
  },
  {
    name: "blog",
    Page: BlogPage,
    heading: "Article index placeholder",
    metadata: blogMetadata,
    expectedTitle: "Blog",
  },
] as const;

describe("marketing routes", () => {
  it.each(marketingPages)(
    "renders the $name page with a page heading",
    ({ Page, heading }) => {
      render(<Page />);

      expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    },
  );

  it.each(marketingPages)(
    "defines page metadata for the $name route",
    ({ metadata, expectedTitle }) => {
      expect(metadata.title).toBe(expectedTitle);
      expect(metadata.description).toEqual(expect.any(String));
    },
  );
});
