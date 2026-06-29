import { expect, test } from "@playwright/test";

test.describe("public smoke", () => {
  test("login page loads for unauthenticated visitors", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("book page prompts sign-in when logged out", async ({ page }) => {
    await page.goto("/book");
    await expect(page.getByRole("heading", { level: 1, name: /book a session/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in to book/i })).toBeVisible();
  });

  test("contact page shows the contact form", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { level: 1, name: /get in touch/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /send message/i })).toBeVisible();
  });
});

test.describe("protected route smoke", () => {
  test("staff day bookings redirects to login when logged out", async ({ page }) => {
    await page.goto("/staff/day-bookings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("staff booking history redirects to login when logged out", async ({ page }) => {
    await page.goto("/staff/bookings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("account area redirects to login when logged out", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("removed debug endpoints", () => {
  test("test supabase API route is not available", async ({ request }) => {
    const response = await request.get("/api/test-supabase");
    expect(response.status()).toBe(404);
  });
});
