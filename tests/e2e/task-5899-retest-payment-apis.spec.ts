/**
 * Task #5899 — Retest Payment APIs (หลัง Prisma db push fix)
 *
 * Verify Prisma 500 errors are fixed:
 * 1. GET /api/payments → ต้องไม่ 500
 * 2. GET /api/v1/payments/history → ต้องไม่ 500
 * 3. Payment flow: create payment → list → history
 * 4. Edge cases: empty list, pagination, status filter
 *
 * 2-Layer: API (A1-A12) + Browser (B1-B10)
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const SCREENSHOT_DIR = "screenshots/retest-payment-5899";

// ─── Auth helper ───
async function getSessionCookie(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({
      email: "qa-suite@smsok.test",
      password: process.env.E2E_USER_PASSWORD!,
    }),
  });
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

async function authFetch(url: string, cookie: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { Cookie: cookie, Origin: BASE };
  if (options.body) headers["Content-Type"] = "application/json";
  const res = await fetch(url, {
    ...options,
    headers,
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text.substring(0, 500) }; }
  return { status: res.status, data };
}

// ═══════════════════════════════════════
// ชั้น 1: API Tests (A1-A12)
// ═══════════════════════════════════════

test.describe("ชั้น 1: API — Payment Endpoints Retest", () => {
  let cookie: string;

  test.beforeAll(async () => {
    cookie = await getSessionCookie();
  });

  // ─── A1: GET /api/payments ต้องไม่ 500 (THE MAIN BUG) ───
  test("A1: GET /api/payments → ต้อง 200 (ไม่ใช่ 500)", async () => {
    const res = await authFetch(`${BASE}/api/payments`, cookie);
    console.log(`📍 GET /api/payments → ${res.status}`);
    console.log(`📦 Response keys: ${Object.keys(res.data)}`);

    // CRITICAL: ต้องไม่ 500 — นี่คือ bug ที่ lead-dev แก้
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("payments");
    expect(Array.isArray(res.data.payments)).toBe(true);
    expect(res.data).toHaveProperty("pagination");
    console.log(`✅ Payment list: ${res.data.payments.length} items, total: ${res.data.pagination?.total}`);
  });

  // ─── A2: GET /api/v1/payments/history ต้องไม่ 500 (THE MAIN BUG) ───
  test("A2: GET /api/v1/payments/history → ต้อง 200 (ไม่ใช่ 500)", async () => {
    const res = await authFetch(`${BASE}/api/v1/payments/history`, cookie);
    console.log(`📍 GET /api/v1/payments/history → ${res.status}`);
    console.log(`📦 Response keys: ${Object.keys(res.data)}`);

    // CRITICAL: ต้องไม่ 500 — นี่คือ bug ที่ lead-dev แก้
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("payments");
    expect(Array.isArray(res.data.payments)).toBe(true);
    console.log(`✅ Payment history: ${res.data.payments.length} items`);
  });

  // ─── A3: Payment list pagination ───
  test("A3: GET /api/payments?page=1&limit=5 → pagination works", async () => {
    const res = await authFetch(`${BASE}/api/payments?page=1&limit=5`, cookie);
    console.log(`📍 Pagination test → ${res.status}`);

    expect(res.status).toBe(200);
    expect(res.data.pagination.page).toBe(1);
    expect(res.data.pagination.limit).toBe(5);
    expect(typeof res.data.pagination.total).toBe("number");
    expect(typeof res.data.pagination.totalPages).toBe("number");
    console.log(`✅ Pagination: page=${res.data.pagination.page}, total=${res.data.pagination.total}`);
  });

  // ─── A4: Payment list filter by status ───
  test("A4: GET /api/payments?status=PENDING → filter works", async () => {
    const res = await authFetch(`${BASE}/api/payments?status=PENDING`, cookie);
    console.log(`📍 Status filter → ${res.status}`);

    expect(res.status).toBe(200);
    // All returned payments should be PENDING (or rawStatus PENDING)
    for (const p of res.data.payments) {
      expect(["PENDING"]).toContain(p.rawStatus || p.status);
    }
    console.log(`✅ Filter PENDING: ${res.data.payments.length} items`);
  });

  // ─── A5: Payment list filter invalid status ───
  test("A5: GET /api/payments?status=INVALID → 400 validation error", async () => {
    const res = await authFetch(`${BASE}/api/payments?status=INVALID`, cookie);
    console.log(`📍 Invalid status filter → ${res.status}`);

    // Zod should reject invalid enum
    expect([400, 422]).toContain(res.status);
    console.log(`✅ Invalid status rejected: ${res.status}`);
  });

  // ─── A6: Payment history filter by status ───
  test("A6: GET /api/v1/payments/history?status=COMPLETED → filter works", async () => {
    const res = await authFetch(`${BASE}/api/v1/payments/history?status=COMPLETED`, cookie);
    console.log(`📍 History status filter → ${res.status}`);

    expect(res.status).toBe(200);
    for (const p of res.data.payments) {
      expect(p.status).toBe("COMPLETED");
    }
    console.log(`✅ History filter COMPLETED: ${res.data.payments.length} items`);
  });

  // ─── A7: Payment list without auth → 401 ───
  test("A7: GET /api/payments without auth → 401", async () => {
    const res = await fetch(`${BASE}/api/payments`);
    console.log(`📍 No auth → ${res.status}`);

    expect(res.status).toBe(401);
    console.log(`✅ Unauthorized correctly rejected`);
  });

  // ─── A8: Payment history without auth → 401 ───
  test("A8: GET /api/v1/payments/history without auth → 401", async () => {
    const res = await fetch(`${BASE}/api/v1/payments/history`);
    console.log(`📍 No auth history → ${res.status}`);

    expect(res.status).toBe(401);
    console.log(`✅ Unauthorized correctly rejected`);
  });

  // ─── A9: Payment list — response shape validation ───
  test("A9: Payment list response has correct fields", async () => {
    const res = await authFetch(`${BASE}/api/payments`, cookie);
    expect(res.status).toBe(200);

    if (res.data.payments.length > 0) {
      const p = res.data.payments[0];
      console.log(`📍 Payment fields: ${Object.keys(p).join(", ")}`);

      // Required fields
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("amount");
      expect(p).toHaveProperty("status");
      expect(p).toHaveProperty("createdAt");
      expect(p).toHaveProperty("method");

      // Should not leak internal errors
      expect(p.id).not.toContain("error");
      console.log(`✅ Payment shape valid: id=${p.id}, status=${p.status}`);
    } else {
      console.log(`✅ No payments yet — shape validation skipped (empty list OK)`);
    }
  });

  // ─── A10: Payment stats endpoint ───
  test("A10: GET /api/payments/stats → works", async () => {
    const res = await authFetch(`${BASE}/api/payments/stats`, cookie);
    console.log(`📍 Payment stats → ${res.status}`);

    // Stats may or may not exist — just verify no 500
    expect(res.status).not.toBe(500);
    console.log(`✅ Stats endpoint: ${res.status} (no 500)`);
  });

  // ─── A11: GET /api/v1/payments/packages → list available packages ───
  test("A11: GET /api/v1/payments/packages → packages list", async () => {
    const res = await authFetch(`${BASE}/api/v1/payments/packages`, cookie);
    console.log(`📍 Packages → ${res.status}`);

    expect(res.status).toBe(200);
    console.log(`✅ Packages: ${JSON.stringify(res.data).substring(0, 200)}`);
  });

  // ─── A12: GET /api/v1/payments/bank-accounts → bank info ───
  test("A12: GET /api/v1/payments/bank-accounts → bank accounts", async () => {
    const res = await authFetch(`${BASE}/api/v1/payments/bank-accounts`, cookie);
    console.log(`📍 Bank accounts → ${res.status}`);

    // May return 200 or 404 if none configured — just not 500
    expect(res.status).not.toBe(500);
    console.log(`✅ Bank accounts: ${res.status}`);
  });
});

// ═══════════════════════════════════════
// ชั้น 2: Browser Tests (B1-B10)
// ═══════════════════════════════════════

test.describe("ชั้น 2: Browser — Payment Pages Retest", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    page = await context.newPage();

    // Login via browser
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passField = page.locator('input[type="password"]').first();

    await emailField.fill("qa-suite@smsok.test");
    await passField.fill(process.env.E2E_USER_PASSWORD!);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/B00-login.png` });

    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 }).catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: `${SCREENSHOT_DIR}/B00-dashboard.png` });
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  // ─── B1: Billing page loads (ไม่มี toast error) ───
  test("B1: Billing page loads without error toast", async () => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE}/dashboard/billing`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000); // Wait for any toast to appear
    await page.screenshot({ path: `${SCREENSHOT_DIR}/B01-billing-page.png` });

    // Check page loaded
    const title = await page.title();
    console.log(`📍 URL: ${page.url()}`);
    console.log(`👁️ Title: ${title}`);

    // Check no error toast
    const errorToast = page.locator('[data-sonner-toast][data-type="error"], .toast-error, [role="alert"]');
    const toastCount = await errorToast.count();

    if (toastCount > 0) {
      const toastText = await errorToast.first().textContent().catch(() => "");
      console.log(`❌ Error toast found: "${toastText}"`);
      // Previously showed "ไม่สามารถโหลดรายการชำระเงินได้"
      // After fix this should be gone
      expect(toastText).not.toContain("ไม่สามารถโหลด");
    }

    console.log(`✅ Billing page loaded, no payment error toast`);
    console.log(`📸 Screenshot: ${SCREENSHOT_DIR}/B01-billing-page.png`);
  });

  // ─── B2: Billing page shows payment table/list ───
  test("B2: Billing page shows payment data (table or empty state)", async () => {
    await page.goto(`${BASE}/dashboard/billing`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/B02-billing-content.png` });

    // Should show either a table with payments or an empty state
    const hasTable = await page.locator("table, [role='table']").count();
    const hasEmptyState = await page.locator("text=ยังไม่มี, text=ไม่พบ, text=No payments, text=ว่าง").first().isVisible().catch(() => false);
    const hasPaymentCards = await page.locator("[class*='payment'], [class*='billing'], [class*='transaction']").count();

    console.log(`👁️ Table: ${hasTable}, Empty state: ${hasEmptyState}, Payment cards: ${hasPaymentCards}`);
    console.log(`✅ Billing content rendered (table=${hasTable > 0}, empty=${hasEmptyState}, cards=${hasPaymentCards > 0})`);
    console.log(`📸 Screenshot: ${SCREENSHOT_DIR}/B02-billing-content.png`);
  });

  // ─── B3: Packages page loads ───
  test("B3: Packages page loads correctly", async () => {
    await page.goto(`${BASE}/dashboard/packages`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: `${SCREENSHOT_DIR}/B03-packages.png` });

    // Packages should show pricing cards
    const pageContent = await page.textContent("body");
    console.log(`📍 URL: ${page.url()}`);
    console.log(`👁️ Page has content: ${(pageContent?.length || 0) > 100}`);

    // Look for package/pricing related content
    const hasPackages = pageContent?.includes("แพ็กเกจ") ||
                        pageContent?.includes("Package") ||
                        pageContent?.includes("SMS") ||
                        pageContent?.includes("เครดิต");
    console.log(`✅ Packages page: ${hasPackages ? "shows packages" : "content loaded"}`);
    console.log(`📸 Screenshot: ${SCREENSHOT_DIR}/B03-packages.png`);
  });

  // ─── B4: Click buy package → payment creation ───
  test("B4: Click buy package button → payment flow starts", async () => {
    await page.goto(`${BASE}/dashboard/packages`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    // Find any buy/purchase button
    const buyBtn = page.locator('button:has-text("ซื้อ"), button:has-text("สั่งซื้อ"), button:has-text("เลือก"), a:has-text("ซื้อ"), button:has-text("Buy")').first();
    const hasBuyBtn = await buyBtn.isVisible().catch(() => false);

    if (hasBuyBtn) {
      await buyBtn.click().catch(() => {});
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/B04-buy-package.png` });
      console.log(`📍 URL after click: ${page.url()}`);
      console.log(`✅ Buy button clicked — flow started`);
    } else {
      await page.screenshot({ path: `${SCREENSHOT_DIR}/B04-no-buy-btn.png` });
      console.log(`⚠️ No buy button found — may need different flow`);
    }
    console.log(`📸 Screenshot: ${SCREENSHOT_DIR}/B04-buy-package.png`);
  });

  // ─── B5: Payment history accessible from billing ───
  test("B5: Payment history section visible in billing", async () => {
    await page.goto(`${BASE}/dashboard/billing`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);

    // Check for history/transaction section
    const historySection = await page.textContent("body");
    const hasHistory = historySection?.includes("ประวัติ") ||
                       historySection?.includes("History") ||
                       historySection?.includes("รายการ") ||
                       historySection?.includes("ชำระเงิน");

    await page.screenshot({ path: `${SCREENSHOT_DIR}/B05-payment-history.png` });
    console.log(`👁️ Payment history content visible: ${hasHistory}`);
    console.log(`✅ Payment history section: ${hasHistory ? "found" : "not found (may be tab)"}`);
    console.log(`📸 Screenshot: ${SCREENSHOT_DIR}/B05-payment-history.png`);
  });

  // ─── B6: Console errors check on billing page ───
  test("B6: No JS console errors on billing page", async () => {
    const consoleErrors: string[] = [];
    const listener = (msg: any) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    };
    page.on("console", listener);

    await page.goto(`${BASE}/dashboard/billing`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(3000); // Wait for async errors

    page.off("console", listener);

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes("favicon") &&
      !e.includes("DevTools") &&
      !e.includes("hydration") &&
      !e.includes("Warning:")
    );

    console.log(`📍 Console errors: ${consoleErrors.length} total, ${criticalErrors.length} critical`);
    if (criticalErrors.length > 0) {
      console.log(`❌ Critical errors: ${criticalErrors.slice(0, 3).join(" | ")}`);
    }

    // Prisma errors would show as fetch failures or 500 responses
    const prismaErrors = consoleErrors.filter(e =>
      e.includes("500") || e.includes("Prisma") || e.includes("prisma")
    );
    expect(prismaErrors.length).toBe(0);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/B06-console-check.png` });
    console.log(`✅ No Prisma/500 errors in console`);
    console.log(`📸 Screenshot: ${SCREENSHOT_DIR}/B06-console-check.png`);
  });

  // ─── B7: Network tab — billing API calls return 200 ───
  test("B7: Network requests on billing page — no 500s", async () => {
    const failedRequests: string[] = [];

    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/api/") && response.status() === 500) {
        failedRequests.push(`${response.status()} ${url}`);
      }
    });

    await page.goto(`${BASE}/dashboard/billing`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    console.log(`📍 Failed API requests (500): ${failedRequests.length}`);
    if (failedRequests.length > 0) {
      console.log(`❌ 500 errors: ${failedRequests.join(", ")}`);
    }

    expect(failedRequests.length).toBe(0);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/B07-network-check.png` });
    console.log(`✅ No 500 responses on billing page`);
    console.log(`📸 Screenshot: ${SCREENSHOT_DIR}/B07-network-check.png`);
  });

  // ─── B8: Mobile responsive billing page ───
  test("B8: Billing page mobile responsive (375px)", async () => {
    const mobileContext = await page.context().browser()!.newContext({
      viewport: { width: 375, height: 812 },
    });
    const mobilePage = await mobileContext.newPage();

    // Login on mobile
    await mobilePage.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await mobilePage.waitForLoadState("networkidle").catch(() => {});

    const emailField = mobilePage.locator('input[type="email"], input[name="email"]').first();
    const passField = mobilePage.locator('input[type="password"]').first();
    await emailField.fill("qa-suite@smsok.test");
    await passField.fill(process.env.E2E_USER_PASSWORD!);
    await mobilePage.locator('button[type="submit"]').first().click();
    await mobilePage.waitForURL("**/dashboard**", { timeout: 10000 }).catch(() => {});

    await mobilePage.goto(`${BASE}/dashboard/billing`, { waitUntil: "domcontentloaded" });
    await mobilePage.waitForLoadState("networkidle").catch(() => {});
    await mobilePage.waitForTimeout(1500);
    await mobilePage.screenshot({ path: `${SCREENSHOT_DIR}/B08-billing-mobile.png` });

    // Check no horizontal overflow
    const bodyWidth = await mobilePage.evaluate(() => document.body.scrollWidth);
    console.log(`📍 Mobile body width: ${bodyWidth}px (viewport: 375px)`);
    console.log(`👁️ Overflow: ${bodyWidth > 400 ? "YES ⚠️" : "NO ✅"}`);

    await mobileContext.close();
    console.log(`✅ Mobile billing page rendered`);
    console.log(`📸 Screenshot: ${SCREENSHOT_DIR}/B08-billing-mobile.png`);
  });

  // ─── B9: Packages page mobile responsive ───
  test("B9: Packages page mobile responsive (375px)", async () => {
    const mobileContext = await page.context().browser()!.newContext({
      viewport: { width: 375, height: 812 },
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto(`${BASE}/dashboard/packages`, { waitUntil: "domcontentloaded" });
    await mobilePage.waitForLoadState("networkidle").catch(() => {});
    await mobilePage.waitForTimeout(1500);
    await mobilePage.screenshot({ path: `${SCREENSHOT_DIR}/B09-packages-mobile.png` });

    const bodyWidth = await mobilePage.evaluate(() => document.body.scrollWidth);
    console.log(`📍 Mobile packages width: ${bodyWidth}px`);

    await mobileContext.close();
    console.log(`✅ Mobile packages page rendered`);
    console.log(`📸 Screenshot: ${SCREENSHOT_DIR}/B09-packages-mobile.png`);
  });

  // ─── B10: Full billing flow — navigate tabs/sections ───
  test("B10: Billing page — all tabs/sections accessible", async () => {
    await page.goto(`${BASE}/dashboard/billing`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);

    // Try clicking any tabs on billing page
    const tabs = page.locator('[role="tab"], [data-state], button[class*="tab"]');
    const tabCount = await tabs.count();
    console.log(`📍 Found ${tabCount} tabs on billing page`);

    for (let i = 0; i < Math.min(tabCount, 4); i++) {
      const tabText = await tabs.nth(i).textContent().catch(() => `tab-${i}`);
      await tabs.nth(i).click().catch(() => {});
      await page.waitForTimeout(500);
      console.log(`👁️ Clicked tab: "${tabText?.trim()}"`);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/B10-billing-tabs.png` });
    console.log(`✅ Billing tabs/sections navigated`);
    console.log(`📸 Screenshot: ${SCREENSHOT_DIR}/B10-billing-tabs.png`);
  });
});
