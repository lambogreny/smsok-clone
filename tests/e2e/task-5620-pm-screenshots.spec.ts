/**
 * Task #5620 — PM Verification Screenshots
 * Captures clear, labeled screenshots of every key page for PM to verify
 */

import { test, type Page, type BrowserContext } from "@playwright/test";
import fs from "fs";
import path from "path";

const DIR = "/Users/lambogreny/oracles/qa/screenshots/regression-2026-03-16";
const BASE = "http://localhost:3000";
const LOGIN_EMAIL = "qa-suite@smsok.test";
const LOGIN_PASS = process.env.E2E_USER_PASSWORD!;

test.beforeAll(() => {
  fs.mkdirSync(DIR, { recursive: true });
});

async function ss(page: Page, name: string) {
  const p = path.join(DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`📸 ${p}`);
}

async function loginBrowser(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);

  const acceptBtn = page.locator('text="ยอมรับทั้งหมด"');
  if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await acceptBtn.click();
    await page.waitForTimeout(500);
  }

  return page;
}

async function doLogin(page: Page) {
  await page.locator('input[type="email"]').fill(LOGIN_EMAIL);
  await page.locator('input[type="password"]').fill(LOGIN_PASS);
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 5000 }
  ).catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

async function gotoPage(page: Page, path: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
}

// 1. Login flow
test("01 — Login page", async ({ page }) => {
  await loginBrowser(page);
  await ss(page, "01-login-page");
  console.log("📍 Login page visible");
});

test("02 — Login กรอก credentials", async ({ page }) => {
  await loginBrowser(page);
  await page.locator('input[type="email"]').fill(LOGIN_EMAIL);
  await page.locator('input[type="password"]').fill(LOGIN_PASS);
  await page.waitForTimeout(500);
  await ss(page, "02-login-filled");
  console.log("📍 Credentials filled");
});

test("03 — Dashboard หลัง login", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await ss(page, "03-dashboard-after-login");
  console.log("📍 URL:", page.url());
});

// 2. Dashboard KPI
test("04 — Dashboard KPI cards", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard");
  await ss(page, "04-dashboard-kpi");
  const text = await page.textContent("body");
  console.log("📍 Dashboard content:", (text || "").substring(0, 300));
});

// 3. API Docs (no auth)
test("05 — API Docs (no login required)", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await gotoPage(page, "/dashboard/api-docs");
  await ss(page, "05-api-docs-no-auth");
  console.log("📍 URL:", page.url());
  await ctx.close();
});

test("06 — API Docs expanded", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await gotoPage(page, "/dashboard/api-docs");

  const expandBtn = page.locator('button:has-text("Expand All")').first();
  if (await expandBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await expandBtn.click();
    await page.waitForTimeout(1500);
  }
  await ss(page, "06-api-docs-expanded");
  await ctx.close();
});

// 4. Webhooks — list + create + delete
test("07 — Webhooks list", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/webhooks");
  await ss(page, "07-webhooks-list");
  console.log("📍 Webhooks page");
});

test("08 — Webhooks create modal", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/webhooks");

  const createBtn = page.locator('button:has-text("เพิ่ม Webhook"), button:has-text("สร้าง"), a:has-text("เพิ่ม")').first();
  if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await createBtn.click();
    await page.waitForTimeout(1500);

    // Fill URL
    const urlInput = page.locator('input[placeholder*="example.com"], input[placeholder*="webhook"], input[placeholder*="https"]').first();
    if (await urlInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await urlInput.clear();
      await urlInput.fill("https://httpbin.org/post");
    }

    // Select events
    const presetBtn = page.locator('text="Delivery events"').first();
    if (await presetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await presetBtn.click();
      await page.waitForTimeout(500);
    }
  }
  await ss(page, "08-webhooks-create-modal");
  console.log("📍 Create modal with form filled");
});

test("09 — Webhooks after create", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/webhooks");

  const createBtn = page.locator('button:has-text("เพิ่ม Webhook"), button:has-text("สร้าง"), a:has-text("เพิ่ม")').first();
  if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await createBtn.click();
    await page.waitForTimeout(1500);

    const urlInput = page.locator('input[placeholder*="example.com"], input[placeholder*="webhook"], input[placeholder*="https"]').first();
    if (await urlInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await urlInput.clear();
      await urlInput.fill("https://httpbin.org/post");
    }

    const presetBtn = page.locator('text="Delivery events"').first();
    if (await presetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await presetBtn.click();
      await page.waitForTimeout(500);
    }

    // Save inside dialog
    const dialogContent = page.locator('[data-slot="dialog-content"], [role="dialog"], dialog').first();
    if (await dialogContent.isVisible({ timeout: 1000 }).catch(() => false)) {
      await dialogContent.evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await page.waitForTimeout(500);
    }
    const saveBtn = dialogContent.locator('button:has-text("เพิ่ม Webhook"), button:has-text("สร้าง Webhook"), button:has-text("บันทึก"), button:has-text("Save"), button:has-text("สร้าง"), button[type="submit"]').first();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click({ force: true });
    }
    await page.waitForTimeout(3000);
  }
  await ss(page, "09-webhooks-created-success");

  // Close success dialog
  const doneBtn = page.locator('button:has-text("เสร็จสิ้น"), button:has-text("Close"), button:has-text("ตกลง")').first();
  if (await doneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await doneBtn.click();
    await page.waitForTimeout(1000);
  }
  await ss(page, "10-webhooks-list-after-create");
});

test("11 — Webhooks delete", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/webhooks");
  await ss(page, "11-webhooks-before-delete");

  const trashBtn = page.locator('tbody tr button').last();
  if (await trashBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await trashBtn.click();
    await page.waitForTimeout(1000);
    const confirmBtn = page.locator('button:has-text("ยืนยัน"), button:has-text("ลบ"), button:has-text("Confirm")').first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }
  }
  await ss(page, "12-webhooks-after-delete");
});

// 5. Contacts
test("13 — Contacts page", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/contacts");
  await ss(page, "13-contacts");
  console.log("📍 Contacts page");
});

// 6. Campaigns
test("14 — Campaigns page", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/campaigns");
  await ss(page, "14-campaigns");
  console.log("📍 Campaigns page");
});

// 7. SMS send + history
test("15 — SMS Send page", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/send");
  await ss(page, "15-sms-send");
  console.log("📍 SMS Send page");
});

test("16 — SMS History page", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/messages");
  await ss(page, "16-sms-history");
  console.log("📍 SMS History page");
});

// 8. Settings tabs
test("17 — Settings Profile", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/settings");
  await ss(page, "17-settings-profile");
});

test("18 — Settings Security", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/settings/security");
  await ss(page, "18-settings-security");
});

test("19 — Settings API Keys", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/api-keys");
  await ss(page, "19-settings-api-keys");
});

test("20 — Settings Notifications", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/settings/notifications");
  await ss(page, "20-settings-notifications");
});

test("21 — Settings Webhooks", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/webhooks");
  await ss(page, "21-settings-webhooks");
});

test("22 — Settings Billing", async ({ page }) => {
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/billing");
  await ss(page, "22-settings-billing");
});

// 9. Mobile responsive (375px)
test("23 — Mobile Dashboard 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard");
  await ss(page, "23-mobile-dashboard");
});

test("24 — Mobile Contacts 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/contacts");
  await ss(page, "24-mobile-contacts");
});

test("25 — Mobile Webhooks 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/webhooks");
  await ss(page, "25-mobile-webhooks");
});

test("26 — Mobile SMS Send 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await loginBrowser(page);
  await doLogin(page);
  await gotoPage(page, "/dashboard/send");
  await ss(page, "26-mobile-sms-send");
});
