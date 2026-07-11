import { defineConfig, devices } from "@playwright/test";

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function load_env_file(relative_path: string) {
  const absolute_path = resolve(process.cwd(), relative_path);
  if (!existsSync(absolute_path)) return;

  for (const line of readFileSync(absolute_path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

load_env_file(".env.local");
load_env_file(".env");

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      testIgnore: ["**/booking-flow.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-320",
      testIgnore: ["**/booking-flow.spec.ts"],
      use: {
        browserName: "chromium",
        viewport: { width: 320, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "mobile-375",
      testIgnore: ["**/booking-flow.spec.ts"],
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "mobile-390",
      testIgnore: ["**/booking-flow.spec.ts"],
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "mobile-412",
      testIgnore: ["**/booking-flow.spec.ts"],
      use: {
        browserName: "chromium",
        viewport: { width: 412, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "authenticated-booking",
      testMatch: ["**/booking-flow.spec.ts"],
      timeout: 60_000,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
