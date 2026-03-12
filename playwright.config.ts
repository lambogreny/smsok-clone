import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  globalSetup: "./tests/e2e/global-setup.ts",
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/user.json",
      },
      testIgnore: /auth\.spec\.ts/,
    },
    {
      name: "chromium-no-auth",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /auth\.spec\.ts/,
    },
    // Mobile tests disabled until chromium suite is 100% green
    // {
    //   name: "mobile-chrome",
    //   use: {
    //     ...devices["iPhone 13"],
    //     storageState: "tests/e2e/.auth/user.json",
    //   },
    // },
  ],
  webServer: {
    command: "bun dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
