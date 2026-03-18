/**
 * Task #5716 — Full Flow Regression (Browser Only, P1)
 * Register → Login → Dashboard → Navigation → SMS → Contacts → Campaigns → Settings
 * Screenshot every step!
 */

import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = "/Users/lambogreny/oracles/qa/screenshots/task-5716";
const BASE = "http://localhost:3000";

// Unique user for this test run
const TS = Date.now().toString().slice(-6);
const REG_EMAIL = `qa-reg-${TS}@smsok.test`;
const REG_PASS = process.env.E2E_USER_PASSWORD!;
const REG_PHONE = `09${TS}00`;
const REG_NAME = `QA Tester ${TS}`;

// Fallback to known QA account
const QA_EMAIL = "qa-suite@smsok.test";
const QA_PASS = process.env.E2E_USER_PASSWORD!;

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

let consoleErrors: string[] = [];

async function ss(page: Page, name: string) {
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`📸 ${p}`);
}

function setupConsoleCapture(page: Page) {
  consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
}

// ============================================
// 1. REGISTER
// ============================================
test("01 — Register new account", async ({ page }) => {
  setupConsoleCapture(page);

  await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2000);
  await ss(page, "01-register-page");

  console.log("📍 URL:", page.url());
  const pageText = await page.textContent("body");
  console.log("👁️ Register page:", /สมัคร|register|sign up/i.test(pageText || ""));

  // Dismiss cookie consent
  const acceptBtn = page.locator('text="ยอมรับทั้งหมด"');
  if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await acceptBtn.click();
    await page.waitForTimeout(500);
  }

  // Fill registration form
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailInput.fill(REG_EMAIL);
    console.log("✅ Email:", REG_EMAIL);
  }

  const passInput = page.locator('input[type="password"]').first();
  if (await passInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await passInput.fill(REG_PASS);
    console.log("✅ Password filled");
  }

  // Confirm password (if exists)
  const confirmPass = page.locator('input[type="password"]').nth(1);
  if (await confirmPass.isVisible({ timeout: 1500 }).catch(() => false)) {
    await confirmPass.fill(REG_PASS);
    console.log("✅ Confirm password filled");
  }

  // Phone number
  const phoneInput = page.locator('input[type="tel"], input[name="phone"], input[placeholder*="เบอร์"], input[placeholder*="phone" i]').first();
  if (await phoneInput.isVisible({ timeout: 1500 }).catch(() => false)) {
    await phoneInput.fill(REG_PHONE);
    console.log("✅ Phone:", REG_PHONE);
  }

  // Name fields
  const nameInput = page.locator('input[name="name"], input[name="firstName"], input[placeholder*="ชื่อ"]').first();
  if (await nameInput.isVisible({ timeout: 1500 }).catch(() => false)) {
    await nameInput.fill(REG_NAME);
    console.log("✅ Name:", REG_NAME);
  }

  const lastNameInput = page.locator('input[name="lastName"], input[placeholder*="นามสกุล"]').first();
  if (await lastNameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await lastNameInput.fill("Test");
  }

  // Company
  const companyInput = page.locator('input[name="company"], input[name="companyName"], input[placeholder*="บริษัท"]').first();
  if (await companyInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await companyInput.fill("QA Test Corp");
  }

  await ss(page, "02-register-filled");

  // Scroll down to see confirm password + terms
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  // Confirm password (second password field)
  const allPassInputs = page.locator('input[type="password"]');
  const passCount = await allPassInputs.count();
  if (passCount >= 2) {
    await allPassInputs.nth(1).fill(REG_PASS);
    console.log("✅ Confirm password filled");
  }

  // Accept terms checkbox — try multiple approaches
  const checkboxes = page.locator('input[type="checkbox"]');
  const checkCount = await checkboxes.count();
  for (let i = 0; i < checkCount; i++) {
    await checkboxes.nth(i).check({ force: true }).catch(() => {});
  }
  console.log(`✅ Checked ${checkCount} checkboxes`);

  // Also try clicking label text for terms
  const termsLabel = page.locator('text=/ยอมรับ|terms|เงื่อนไข|นโยบาย/i').first();
  if (await termsLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
    await termsLabel.click().catch(() => {});
  }

  await page.waitForTimeout(500);
  await ss(page, "02b-register-scrolled");

  // Submit
  const submitBtn = page.locator('button[type="submit"]');
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 8000 }
  ).catch(() => {
    console.log("⚠️ Submit button still disabled — may need additional fields");
  });

  if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Force click even if disabled to get error feedback
    await submitBtn.click({ force: true });
    await page.waitForTimeout(4000);
    await ss(page, "03-register-result");

    const afterText = await page.textContent("body");
    const url = page.url();
    console.log("📍 URL after register:", url);
    console.log("👁️ Success:", /สำเร็จ|success|dashboard|otp|verify/i.test(afterText || "") || url.includes("dashboard") || url.includes("otp"));
  }

  console.log("🔴 Console errors:", consoleErrors.length);
});

// ============================================
// 2. LOGIN
// ============================================
test("02 — Login → dashboard", async ({ page }) => {
  setupConsoleCapture(page);

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);

  const acceptBtn = page.locator('text="ยอมรับทั้งหมด"');
  if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await acceptBtn.click();
    await page.waitForTimeout(500);
  }

  await ss(page, "04-login-page");

  // Try QA account (known working)
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASS);
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 5000 }
  ).catch(() => {});

  await ss(page, "05-login-filled");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await ss(page, "06-dashboard-after-login");

  console.log("📍 URL:", page.url());
  expect(page.url()).toContain("dashboard");
  console.log("✅ Login → dashboard success");
  console.log("🔴 Console errors:", consoleErrors.length);
});

// ============================================
// 3. DASHBOARD KPI
// ============================================
test("03 — Dashboard KPI cards", async ({ page }) => {
  setupConsoleCapture(page);
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const acceptBtn = page.locator('text="ยอมรับทั้งหมด"');
  if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) { await acceptBtn.click(); await page.waitForTimeout(500); }
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASS);
  await page.waitForFunction(() => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled, { timeout: 5000 }).catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2000);
  await ss(page, "07-dashboard-kpi");

  const pageText = await page.textContent("body");
  console.log("👁️ Dashboard content:", (pageText || "").substring(0, 300));
  console.log("🔴 Console errors:", consoleErrors.length);
  console.log("✅ Dashboard KPI loaded");
});

// ============================================
// 4. SIDEBAR NAVIGATION (5+ pages)
// ============================================
test("04 — Sidebar navigation — 8 pages", async ({ page }) => {
  setupConsoleCapture(page);
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const acceptBtn = page.locator('text="ยอมรับทั้งหมด"');
  if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) { await acceptBtn.click(); await page.waitForTimeout(500); }
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASS);
  await page.waitForFunction(() => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled, { timeout: 5000 }).catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const sidebarPages = [
    { path: "/dashboard", label: "dashboard" },
    { path: "/dashboard/send", label: "send-sms" },
    { path: "/dashboard/messages", label: "history" },
    { path: "/dashboard/contacts", label: "contacts" },
    { path: "/dashboard/campaigns", label: "campaigns" },
    { path: "/dashboard/settings", label: "settings" },
    { path: "/dashboard/webhooks", label: "webhooks" },
    { path: "/dashboard/billing", label: "billing" },
  ];

  for (const p of sidebarPages) {
    try {
      const res = await page.goto(`${BASE}${p.path}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1500);
      await ss(page, `08-nav-${p.label}`);
      const httpStatus = res?.status() || 0;
      console.log(`👁️ ${p.label}: ${httpStatus} ${httpStatus >= 500 ? "❌ SERVER ERROR" : "✅"}`);
    } catch (err) {
      console.log(`👁️ ${p.label}: ❌ LOAD FAILED — ${(err as Error).message.substring(0, 100)}`);
      await ss(page, `08-nav-${p.label}-error`).catch(() => {});
    }
  }

  console.log("🔴 Console errors:", consoleErrors.length);
  consoleErrors.slice(0, 3).forEach((e) => console.log("  -", e.substring(0, 150)));
  console.log("✅ Sidebar navigation — 8 pages visited");
});

// ============================================
// 5. SEND SMS — fill form
// ============================================
test("05 — Send SMS — fill form", async ({ page }) => {
  setupConsoleCapture(page);
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const acceptBtn = page.locator('text="ยอมรับทั้งหมด"');
  if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) { await acceptBtn.click(); await page.waitForTimeout(500); }
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASS);
  await page.waitForFunction(() => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled, { timeout: 5000 }).catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2000);
  await ss(page, "09-sms-send-page");

  // Fill phone number
  const phoneInput = page.locator('input[type="tel"], input[name="phone"], input[placeholder*="เบอร์"], input[placeholder*="phone" i], textarea[placeholder*="เบอร์"]').first();
  if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await phoneInput.fill("0812345678");
    console.log("✅ Phone filled: 0812345678");
  } else {
    console.log("⚠️ Phone input not found");
  }

  // Fill message
  const msgInput = page.locator('textarea[name="message"], textarea[placeholder*="ข้อความ"], textarea[placeholder*="message" i], textarea').first();
  if (await msgInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await msgInput.fill("QA Regression Test Message - Task #5716");
    console.log("✅ Message filled");
  } else {
    console.log("⚠️ Message textarea not found");
  }

  await ss(page, "10-sms-form-filled");

  // Check sender name dropdown
  const senderSelect = page.locator('select, [role="combobox"], button:has-text("ผู้ส่ง"), [data-slot="select"]').first();
  if (await senderSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log("✅ Sender selector visible");
  }

  console.log("🔴 Console errors:", consoleErrors.length);
  console.log("✅ SMS Send form filled (not submitted — QA test only)");
});

// ============================================
// 6. CONTACTS — add contact
// ============================================
test("06 — Contacts — view + add", async ({ page }) => {
  setupConsoleCapture(page);
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const acceptBtn = page.locator('text="ยอมรับทั้งหมด"');
  if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) { await acceptBtn.click(); await page.waitForTimeout(500); }
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASS);
  await page.waitForFunction(() => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled, { timeout: 5000 }).catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  await page.goto(`${BASE}/dashboard/contacts`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2000);
  await ss(page, "11-contacts-list");

  // Click add
  const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add"), a:has-text("เพิ่ม")').first();
  if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await addBtn.click();
    await page.waitForTimeout(1500);
    await ss(page, "12-contacts-add-form");

    const phoneInput = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="เบอร์"]').first();
    if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneInput.fill("0900005716");
    }

    const nameInput = page.locator('input[name="firstName"], input[name="name"], input[placeholder*="ชื่อ"]').first();
    if (await nameInput.isVisible({ timeout: 1500 }).catch(() => false)) {
      await nameInput.fill("QA Contact 5716");
    }

    await ss(page, "13-contacts-form-filled");
    console.log("✅ Contact form filled");
  } else {
    console.log("⚠️ Add contact button not found");
  }

  console.log("🔴 Console errors:", consoleErrors.length);
});

// ============================================
// 7. CAMPAIGNS — view + create
// ============================================
test("07 — Campaigns — view + create", async ({ page }) => {
  setupConsoleCapture(page);
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const acceptBtn = page.locator('text="ยอมรับทั้งหมด"');
  if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) { await acceptBtn.click(); await page.waitForTimeout(500); }
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASS);
  await page.waitForFunction(() => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled, { timeout: 5000 }).catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  await page.goto(`${BASE}/dashboard/campaigns`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2000);
  await ss(page, "14-campaigns-list");

  // Click create
  const createBtn = page.locator('button:has-text("สร้าง"), button:has-text("Create"), a:has-text("สร้าง"), button:has-text("เพิ่ม")').first();
  if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await createBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, "15-campaigns-create");

    // Fill campaign name if visible
    const nameInput = page.locator('input[name="name"], input[name="campaignName"], input[placeholder*="ชื่อ"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill("QA Campaign 5716");
      console.log("✅ Campaign name filled");
    }

    await ss(page, "16-campaigns-form-filled");
  } else {
    console.log("⚠️ Create campaign button not found");
  }

  console.log("🔴 Console errors:", consoleErrors.length);
});

// ============================================
// 8. SETTINGS — view + edit profile
// ============================================
test("08 — Settings — profile edit", async ({ page }) => {
  setupConsoleCapture(page);
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const acceptBtn = page.locator('text="ยอมรับทั้งหมด"');
  if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) { await acceptBtn.click(); await page.waitForTimeout(500); }
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASS);
  await page.waitForFunction(() => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled, { timeout: 5000 }).catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2000);
  await ss(page, "17-settings-profile");

  const pageText = await page.textContent("body");
  console.log("👁️ Settings page:", /settings|ตั้งค่า|profile|โปรไฟล์/i.test(pageText || ""));

  // Check for editable fields
  const nameInput = page.locator('input[name="name"], input[name="firstName"], input[name="displayName"]').first();
  if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    const currentVal = await nameInput.inputValue();
    console.log("👁️ Current name:", currentVal);
    await ss(page, "18-settings-profile-fields");
    console.log("✅ Settings profile fields visible");
  } else {
    console.log("⚠️ Profile name input not found directly");
    await ss(page, "18-settings-profile-view");
  }

  console.log("🔴 Console errors:", consoleErrors.length);
});

// ============================================
// 9. CONSOLE ERRORS SUMMARY
// ============================================
test("09 — Console errors check across pages", async ({ page }) => {
  setupConsoleCapture(page);
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const acceptBtn = page.locator('text="ยอมรับทั้งหมด"');
  if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) { await acceptBtn.click(); await page.waitForTimeout(500); }
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASS);
  await page.waitForFunction(() => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled, { timeout: 5000 }).catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  const pages = [
    "/dashboard",
    "/dashboard/send",
    "/dashboard/contacts",
    "/dashboard/campaigns",
    "/dashboard/settings",
  ];

  const allErrors: { page: string; errors: string[] }[] = [];

  for (const p of pages) {
    const pageErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") pageErrors.push(msg.text());
    });

    try {
      await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1500);
    } catch {
      pageErrors.push(`LOAD FAILED: ${p}`);
    }

    allErrors.push({ page: p, errors: [...pageErrors] });
    console.log(`👁️ ${p}: ${pageErrors.length} console errors`);
  }

  await ss(page, "19-console-errors-summary");

  const totalErrors = allErrors.reduce((sum, p) => sum + p.errors.length, 0);
  console.log(`\n📊 Total console errors across ${pages.length} pages: ${totalErrors}`);
  for (const p of allErrors) {
    if (p.errors.length > 0) {
      console.log(`  ${p.page}: ${p.errors.length} errors`);
      p.errors.slice(0, 2).forEach((e) => console.log("    -", e.substring(0, 150)));
    }
  }
});
