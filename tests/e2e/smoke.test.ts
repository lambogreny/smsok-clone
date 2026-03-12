import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SMSOK/i);
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type='email'], input[name='phone'], input[type='tel']").first()).toBeVisible();
  });

  // NOTE: This test is covered by auth.spec.ts TC-008 (in chromium-no-auth project)
  // In chromium project with storageState, user is already authenticated
  test.skip("dashboard redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });

  // NOTE: /admin not implemented — admin uses backoffice on :3001
  test.skip("admin dashboard loads", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=Admin")).toBeVisible();
  });

  test("health endpoint returns healthy", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("healthy");
    expect(body.checks.database.status).toBe("ok");
    expect(body.checks.redis.status).toBe("ok");
  });

  test("health live endpoint returns alive", async ({ request }) => {
    const response = await request.get("/api/health/live");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.alive).toBe(true);
  });
});
