import { test as base, expect, type Page } from "@playwright/test";

// Test data
export const TEST_USER = {
  email: "demo@smsok.local",
  password: "Password123!",
};

export const TEST_ADMIN = {
  email: "admin@smsok.com",
  password: "admin1234",
};

// Dismiss cookie consent banner if present
async function dismissCookieConsent(page: Page) {
  const acceptBtn = page.getByText("ยอมรับทั้งหมด");
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
    await acceptBtn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
}

// Login helper (for tests that need explicit login, e.g. auth tests)
// Returns the post-login URL path (e.g. "/dashboard" or "/2fa?token=...")
async function loginAs(page: Page, email: string, password: string): Promise<string> {
  await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await dismissCookieConsent(page);

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.click();
  await emailInput.fill(email);
  await passwordInput.click();
  await passwordInput.fill(password);

  // Wait for React Hook Form validation to enable submit button
  const submitBtn = page.locator('button[type="submit"]');
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 10000 }
  ).catch(async () => {
    // Retry with type() to trigger React onChange events
    await emailInput.clear();
    await emailInput.type(email);
    await passwordInput.clear();
    await passwordInput.type(password);
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 5000 }
    );
  });
  await submitBtn.click();

  // Wait for navigation to dashboard OR 2FA challenge
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 30000 });
  return new URL(page.url()).pathname;
}

// Authenticated test fixture — uses globalSetup storageState (no re-login)
// The storageState is set in playwright.config.ts, so `page` is already authenticated
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, run) => {
    // storageState already applied — just verify we're auth'd by going to dashboard
    await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    // If redirected to login, storageState expired — skip test
    if (page.url().includes("/login")) {
      throw new Error("Auth storageState expired. Re-run: npx playwright test --project=chromium");
    }
    await run(page);
  },
});

export { expect, loginAs, dismissCookieConsent };

// Helper: assert page loads without error
export async function expectPageLoads(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  expect(response?.status()).toBe(200);
  await page.locator("body").waitFor({ state: "visible" });
  const body = await page.textContent("body");
  expect(body).not.toContain("Something went wrong");
  expect(body).not.toContain("Application error");
  expect(body).not.toContain("Internal Server Error");
  expect(body!.length).toBeGreaterThan(100);
}

// Helper: collect console errors
export async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });
  return errors;
}

// Helper: reset credits via dev API
export async function resetCredits(page: Page, amount: number = 0) {
  const devSecret = process.env.E2E_DEV_SECRET || process.env.DEV_SECRET;
  const response = await page.request.post("/api/dev/reset-credits", {
    data: { credits: amount },
    headers: devSecret ? { "x-dev-secret": devSecret } : undefined,
  });
  return response.status();
}
