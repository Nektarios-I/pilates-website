import { expect, test } from "@playwright/test";

test("loads the homepage and navigates through primary routes", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Corehouse Pilates Studio" }),
  ).toBeVisible();

  const primaryNavigation = page.getByRole("navigation", { name: "Primary navigation" });

  await primaryNavigation.getByRole("link", { name: "Classes" }).click();
  await expect(page).toHaveURL("/classes");
  await expect(
    page.getByRole("heading", { level: 1, name: "Class overview placeholder" }),
  ).toBeVisible();

  await primaryNavigation.getByRole("link", { name: "Pricing" }).click();
  await expect(page).toHaveURL("/pricing");
  await expect(
    page.getByRole("heading", { level: 1, name: "Pricing placeholder" }),
  ).toBeVisible();

  await primaryNavigation.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL("/contact");
  await expect(
    page.getByRole("heading", { level: 1, name: "Contact placeholder" }),
  ).toBeVisible();
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
});
