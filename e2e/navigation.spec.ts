import { expect, test } from "@playwright/test";

async function openMobileNavigation(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Open menu" }).click();
  return page.getByRole("navigation", { name: "Mobile navigation" });
}

async function navigateFromHeader(page: import("@playwright/test").Page, label: string) {
  const route_by_label: Record<string, string> = {
    Classes: "/classes",
    Pricing: "/pricing",
    Contact: "/contact",
  };
  const expected_path = route_by_label[label];
  const width = page.viewportSize()?.width ?? 1280;

  if (width < 1024) {
    const mobileNavigation = await openMobileNavigation(page);
    await mobileNavigation.getByRole("link", { name: label }).click();
    await page.waitForURL(expected_path, { timeout: 10_000 });
    return;
  }

  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: label })
    .click();
  await page.waitForURL(expected_path, { timeout: 10_000 });
}

test("loads the homepage and navigates through primary routes", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Where movement comes home.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: "Book Now" }).first(),
  ).toHaveAttribute("href", "/book");

  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    const mobileNavigation = await openMobileNavigation(page);
    await expect(mobileNavigation.getByRole("link", { name: "Classes" })).toHaveAttribute(
      "href",
      "/classes",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  }

  await navigateFromHeader(page, "Classes");
  await expect(
    page.getByRole("heading", { level: 1, name: "Reformer and mat" }),
  ).toBeVisible();

  await navigateFromHeader(page, "Pricing");
  await expect(
    page.getByRole("heading", { level: 1, name: "Class packages" }),
  ).toBeVisible();

  await navigateFromHeader(page, "Contact");
  await expect(
    page.getByRole("heading", { level: 1, name: "Get in touch" }),
  ).toBeVisible();
});

test("keeps key routes overflow-free with a compact mobile header", async ({ page }, testInfo) => {
  const routes = ["/", "/classes", "/pricing", "/contact", "/login", "/book"];

  for (const route of routes) {
    await page.goto(route);

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
      headerHeight: Math.round(document.querySelector("header")?.getBoundingClientRect().height ?? 0),
      headerSmallTargets: Array.from(document.querySelectorAll("header a, header button"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return {
            display: style.display,
            visibility: style.visibility,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        })
        .filter(
          (target) =>
            target.display !== "none" &&
            target.visibility !== "hidden" &&
            target.width > 0 &&
            target.height > 0 &&
            (target.width < 44 || target.height < 44),
        ),
    }));

    expect(metrics.scrollWidth, `${route} should not horizontally overflow`).toBeLessThanOrEqual(
      metrics.clientWidth + 1,
    );

    if (testInfo.project.name.startsWith("mobile-")) {
      expect(metrics.headerHeight, `${route} mobile header should stay compact`).toBeLessThanOrEqual(
        96,
      );
      expect(metrics.headerSmallTargets, `${route} header tap targets`).toEqual([]);
    }
  }
});

test("serves indexing endpoints", async ({ request }) => {
  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.ok()).toBe(true);
  const robotsText = await robotsResponse.text();
  expect(robotsText).toContain("User-Agent: *");
  expect(robotsText).toContain("Sitemap: http://localhost:3000/sitemap.xml");

  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const sitemapText = await sitemapResponse.text();
  expect(sitemapText).toContain("<loc>http://localhost:3000/classes</loc>");
  expect(sitemapText).toContain("<loc>http://localhost:3000/contact</loc>");
  expect(sitemapText).toContain("<loc>http://localhost:3000/about</loc>");
  expect(sitemapText).toContain("<loc>http://localhost:3000/book</loc>");
});
