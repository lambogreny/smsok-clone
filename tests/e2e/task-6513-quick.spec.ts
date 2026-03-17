/**
 * Task #6513 — Quick health check: app loads?
 */
import { test as base } from "@playwright/test";

const SS = "tests/screenshots/task-6513";

base.describe("Quick Health Check", () => {
  base("Homepage loads", async ({ page }) => {
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/01-homepage.png`, fullPage: true });
    console.log(`Homepage URL: ${page.url()}`);
    console.log(`Body length: ${(await page.textContent("body"))?.length}`);
  });

  base("Login page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/02-login.png`, fullPage: true });
    const body = await page.textContent("body");
    console.log(`Login page has form: ${body?.includes("เข้าสู่ระบบ")}`);
    console.log(`Has error: ${body?.includes("error") || body?.includes("Prisma") || body?.includes("ไม่สามารถ")}`);
  });

  base("Dashboard (no auth) — redirect check", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/03-dashboard-noauth.png`, fullPage: true });
    console.log(`Final URL: ${page.url()}`);
    console.log(`Redirected to login: ${page.url().includes("/login")}`);
  });
});
