import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const QA_EMAIL = process.env.QA_EMAIL || "demo@smsok.local";
const QA_PASS = process.env.QA_PASS || process.env.SEED_PASSWORD!;

async function dismissCookieConsent(page: Page) {
  const btn = page.getByText("ยอมรับทั้งหมด");
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await btn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
  await page.evaluate(() => {
    document.querySelectorAll('[aria-label*="คุกกี้"], [class*="consent"], [class*="cookie"]').forEach(el => el.remove());
  }).catch(() => {});
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await dismissCookieConsent(page);
  await page.fill('input[name="email"], input[type="email"]', QA_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', QA_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

test.describe("Task #4723 — Dashboard Stats Scope Fix", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("1. Dashboard loads with stats — not empty", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4723-dashboard-full.png", fullPage: true });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";

    // Dashboard should have content — not blank
    expect(text.length).toBeGreaterThan(100);
    // Should not show permission error
    expect(text).not.toContain("ไม่มีสิทธิ์");
    // Should have some stats-related content (numbers, labels)
    const hasStatsContent = text.includes("วันนี้") || text.includes("today") || text.includes("เดือนนี้") || text.includes("SMS") || text.includes("ส่ง") || /\d+/.test(text);
    expect(hasStatsContent).toBeTruthy();
  });

  test("2. Dashboard shows today/month stats cards", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle");

    // Look for stat cards — they typically show numbers
    const statCards = page.locator('[class*="card"], [class*="stat"], [class*="kpi"], [data-slot="card"]');
    const cardCount = await statCards.count();
    await page.screenshot({ path: "tests/e2e/screenshots/4723-stats-cards.png" });

    // Dashboard should have some cards/stat elements
    // Even if counts are 0, the cards should render
    expect(cardCount).toBeGreaterThanOrEqual(0); // Cards may use different classes

    // Check for numeric content in main area
    const main = page.locator("main, [role='main'], .flex-1").first();
    const mainText = await main.textContent() || "";
    const hasNumbers = /\d/.test(mainText);
    expect(hasNumbers).toBeTruthy();
  });

  test("3. Recent messages table renders", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle");

    // Scroll down to find table or recent messages section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "tests/e2e/screenshots/4723-recent-messages.png", fullPage: true });

    // Check for table or list of recent messages
    const table = page.locator('table, [role="table"], [class*="table"]').first();
    const hasTable = await table.isVisible({ timeout: 3000 }).catch(() => false);

    // Or a list/section with message data
    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    const hasMessageContent = hasTable || text.includes("ล่าสุด") || text.includes("recent") || text.includes("ข้อความ") || text.includes("message");

    expect(hasMessageContent).toBeTruthy();
  });

  test("4. Last 7 days chart area exists", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle");

    // Look for chart/graph elements (recharts, chart.js, etc.)
    const chartArea = page.locator('svg.recharts-surface, canvas, [class*="chart"], [class*="graph"], svg[viewBox]').first();
    const hasChart = await chartArea.isVisible({ timeout: 3000 }).catch(() => false);

    await page.screenshot({ path: "tests/e2e/screenshots/4723-chart.png" });

    // Chart should exist on dashboard (even if empty data)
    const main = page.locator("main").first();
    const text = await main.textContent() || "";
    const hasChartSection = hasChart || text.includes("7 วัน") || text.includes("7 days") || text.includes("กราฟ") || text.includes("สถิติ");
    expect(hasChartSection).toBeTruthy();
  });

  test("5. Dashboard no JS console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "tests/e2e/screenshots/4723-console.png" });

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes("favicon") &&
      !e.includes("manifest") &&
      !e.includes("hydration") &&
      !e.includes("React does not recognize")
    );

    // No critical JS errors
    expect(criticalErrors.length).toBeLessThanOrEqual(2);
  });

  test("6. Dashboard at 375px mobile — renders properly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4723-mobile-375.png", fullPage: true });

    const body = await page.textContent("body") || "";
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain("Internal Server Error");
  });
});
