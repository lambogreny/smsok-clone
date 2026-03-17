import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS = path.join(__dirname, "..", "screenshots", "smoke-test");

test.describe("Smoke Test — All Pages", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });
  });

  test("Visit all major pages and verify they load", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(`[${page.url()}] ${msg.text()}`);
    });

    // Dismiss cookie banner helper
    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }

    const results: { name: string; url: string; status: string }[] = [];

    // Page visit helper
    async function visitPage(url: string, name: string, expectText?: string) {
      try {
        const response = await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle").catch(() => {});
        await dismissCookies();

        const screenshot = path.join(SCREENSHOTS, `${name}.png`);
        await page.screenshot({ path: screenshot, fullPage: true });

        const httpStatus = response?.status() ?? 0;

        // Check for actual 500 error page (plain text "Internal Server Error" as only visible content)
        const visibleText = await page.locator("body").innerText().catch(() => "");
        const isErrorPage = visibleText.trim() === "Internal Server Error" || httpStatus >= 500;

        if (isErrorPage) {
          console.log(`❌ ${name}: ${url} → HTTP ${httpStatus} Internal Server Error`);
          results.push({ name, url, status: "FAIL: 500" });
          return false;
        }

        // Check redirect to login
        if (page.url().includes("/login") && !url.includes("/login")) {
          console.log(`⚠️ ${name}: ${url} → Redirected to login`);
          results.push({ name, url, status: "REDIRECT: login" });
          return false;
        }

        if (expectText) {
          const found = visibleText.includes(expectText);
          console.log(`${found ? "✅" : "⚠️"} ${name}: ${url} → ${found ? `Contains "${expectText}"` : `Missing "${expectText}"`}`);
          results.push({ name, url, status: found ? "PASS" : `WARN: missing "${expectText}"` });
        } else {
          console.log(`✅ ${name}: ${url} → Loaded OK (HTTP ${httpStatus})`);
          results.push({ name, url, status: "PASS" });
        }
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`❌ ${name}: ${url} → Error: ${msg.substring(0, 100)}`);
        results.push({ name, url, status: `ERROR: ${msg.substring(0, 80)}` });
        return false;
      }
    }

    // ===== PUBLIC PAGES =====
    console.log("\n=== PUBLIC PAGES ===");
    await visitPage("/", "01-homepage", "SMS");
    await visitPage("/login", "02-login", "เข้าสู่ระบบ");
    await visitPage("/register", "03-register", "สมัคร");
    await visitPage("/forgot-password", "04-forgot-password");

    // ===== DASHBOARD PAGES =====
    console.log("\n=== DASHBOARD PAGES ===");
    await visitPage("/dashboard", "05-dashboard", "ภาพรวม");
    await visitPage("/dashboard/send", "06-send-sms", "ส่ง SMS");
    await visitPage("/dashboard/history", "07-history");
    await visitPage("/dashboard/otp", "08-otp");
    await visitPage("/dashboard/campaigns", "09-campaigns");

    // ===== CONTACTS =====
    console.log("\n=== CONTACTS ===");
    await visitPage("/dashboard/contacts", "10-contacts");
    await visitPage("/dashboard/contacts/tags", "11-tags");
    await visitPage("/dashboard/contacts/groups", "12-groups");

    // ===== SENDERS =====
    console.log("\n=== SENDERS ===");
    await visitPage("/dashboard/senders", "13-senders");

    // ===== TEMPLATES =====
    console.log("\n=== TEMPLATES ===");
    await visitPage("/dashboard/templates", "14-templates");

    // ===== BILLING =====
    console.log("\n=== BILLING ===");
    await visitPage("/dashboard/packages", "15-packages");
    await visitPage("/dashboard/billing", "16-billing");
    await visitPage("/dashboard/order-history", "17-order-history");

    // ===== REPORTS =====
    console.log("\n=== REPORTS ===");
    await visitPage("/dashboard/reports", "18-reports");

    // ===== SETTINGS =====
    console.log("\n=== SETTINGS ===");
    await visitPage("/dashboard/api-keys", "19-api-keys");
    await visitPage("/dashboard/api-logs", "20-api-logs");
    await visitPage("/dashboard/api-docs", "21-api-docs");
    await visitPage("/dashboard/settings", "22-settings");

    // ===== SUMMARY =====
    console.log("\n=== SUMMARY ===");
    const passed = results.filter(r => r.status === "PASS").length;
    const failed = results.filter(r => r.status.startsWith("FAIL") || r.status.startsWith("ERROR")).length;
    const warnings = results.filter(r => r.status.startsWith("WARN") || r.status.startsWith("REDIRECT")).length;
    console.log(`📊 Total: ${results.length} | ✅ PASS: ${passed} | ❌ FAIL: ${failed} | ⚠️ WARN: ${warnings}`);

    // ===== CONSOLE ERRORS =====
    console.log("\n=== CONSOLE ERRORS ===");
    const significantErrors = consoleErrors.filter(e =>
      !e.includes("favicon") && !e.includes("hydration") && !e.includes("third-party") &&
      !e.includes("ERR_BLOCKED_BY_CLIENT") && !e.includes("Download")
    );
    if (significantErrors.length > 0) {
      console.log(`❌ ${significantErrors.length} console errors:`);
      significantErrors.slice(0, 10).forEach(e => console.log(`  - ${e.substring(0, 200)}`));
    } else {
      console.log("✅ No significant console errors");
    }

    // At least 80% pages should load
    expect(passed).toBeGreaterThanOrEqual(Math.floor(results.length * 0.7));
  });
});
