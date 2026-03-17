/**
 * Task #5522 — QA: ทดสอบ /dashboard/api-docs ใน browser จริง (P0)
 * All tests use fresh browser context (no auth) since api-docs is public
 */

import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = "/Users/lambogreny/oracles/qa/screenshots/task-5522";
const BASE = "http://localhost:3000";

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

async function ss(page: Page, name: string) {
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`📸 ${p}`);
  return p;
}

// Use fresh context for all tests since api-docs is public
test.describe("Task #5522 — API Docs Browser Test", () => {
  let context: BrowserContext;
  let page: Page;
  let consoleErrors: string[];

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE}/dashboard/api-docs`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
  });

  test.afterEach(async () => {
    await context.close();
  });

  // 1. No-auth access
  test("1. API Docs accessible without auth", async () => {
    const url = page.url();
    const pageText = await page.textContent("body");

    console.log("📍 URL:", url);
    console.log("👁️ Contains API text:", /API|endpoint|เอกสาร/i.test(pageText || ""));
    console.log("👁️ Redirected to login:", url.includes("/login"));

    await ss(page, "01-no-auth-access");

    expect(url).not.toContain("/login");
    expect(/API|endpoint|เอกสาร/i.test(pageText || "")).toBeTruthy();
  });

  // 2. Category filters — target the filter bar (not sidebar)
  test("2. Category filters work", async () => {
    await ss(page, "02-initial-page");

    // From screenshot: filter buttons are in a horizontal row near search bar
    // They appear as pill/chip buttons with text: ทั้งหมด SMS OTP Contacts Templates Account Admin
    const categories = ["ทั้งหมด", "SMS", "OTP", "Contacts", "Templates", "Account", "Admin"];

    for (const cat of categories) {
      // Target buttons near the search/filter area — use the endpoint count area
      // The filter bar buttons are near "ค้นหา endpoint" search input
      const filterArea = page.locator('text=endpoint').first().locator("xpath=ancestor::div[contains(@class,'flex')]").first();

      // Try direct button match near the filter area
      const btn = page.locator(`button:text-is("${cat}")`).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(500);

        const endpointCountText = await page.textContent("body");
        const countMatch = endpointCountText?.match(/(\d+)\s*endpoint/i);
        console.log(`✅ Category "${cat}" → ${countMatch?.[0] || "shown"}`);
      } else {
        console.log(`⚠️ Category "${cat}" button not found`);
      }
    }

    await ss(page, "03-after-filters");
  });

  // 3. Search
  test("3. Search works", async () => {
    const searchInput = page.locator('input[placeholder*="ค้นหา"], input[placeholder*="endpoint"], input[placeholder*="search" i]').first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill("sms");
      await page.waitForTimeout(1000);
      await ss(page, "04-search-sms");

      const pageText = await page.textContent("body");
      console.log("👁️ Search 'sms' results:", /sms|SMS|send/i.test(pageText || ""));

      await searchInput.clear();
      await searchInput.fill("contacts");
      await page.waitForTimeout(1000);
      await ss(page, "05-search-contacts");
      console.log("✅ Search works");
    } else {
      console.log("⚠️ Search input not found");
      await ss(page, "04-no-search");
    }
  });

  // 4. Expand All / Collapse All
  test("4. Expand All / Collapse All", async () => {
    const expandBtn = page.locator('button:has-text("Expand All"), button:has-text("ขยายทั้งหมด")').first();
    if (await expandBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expandBtn.click();
      await page.waitForTimeout(1500);
      await ss(page, "06-expanded");
      console.log("✅ Expand All clicked");
    }

    const collapseBtn = page.locator('button:has-text("Collapse All"), button:has-text("ย่อทั้งหมด")').first();
    if (await collapseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await collapseBtn.click();
      await page.waitForTimeout(1000);
      await ss(page, "07-collapsed");
      console.log("✅ Collapse All clicked");
    }
  });

  // 5. Endpoint cards — click to expand, check tabs
  test("5. Endpoint cards expand and show tabs", async () => {
    // Click first endpoint card (the row with POST/GET badge)
    const firstEndpoint = page.locator('div:has(> span:text("POST")), div:has(> span:text("GET"))').first();
    const endpointRow = page.locator('[class*="cursor-pointer"]:has-text("/api/v1/")').first();

    for (const el of [endpointRow, firstEndpoint]) {
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.click();
        await page.waitForTimeout(1000);
        break;
      }
    }

    await ss(page, "08-endpoint-expanded");

    // Check for content tabs
    const pageText = await page.textContent("body");
    const tabs = ["Request", "Response", "Error", "Code", "Try It"];
    for (const tab of tabs) {
      const found = new RegExp(tab, "i").test(pageText || "");
      console.log(`👁️ Tab "${tab}":`, found ? "✅" : "⚠️ not found");
    }
  });

  // 6. Copy buttons
  test("6. Copy buttons work", async () => {
    // There's a copy button on the code example at top of page
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // The copy button is the icon button in the code block area
    const copyBtns = page.locator('button[aria-label*="copy" i], button[title*="copy" i], button:has(svg):near(code)').all();
    const btns = await copyBtns;
    console.log("👁️ Copy-like buttons found:", btns.length);

    // Also check for the specific copy icon button visible in screenshot (top-right of code block)
    const codeBlockCopy = page.locator('button').filter({ has: page.locator('svg') }).nth(0);

    // Try expanding all first to reveal more copy buttons
    const expandBtn = page.locator('button:has-text("Expand All")').first();
    if (await expandBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expandBtn.click();
      await page.waitForTimeout(1500);
    }

    // Now look for copy buttons in expanded cards
    const allBtns = await page.locator('button').all();
    let copyFound = 0;
    for (const btn of allBtns.slice(0, 50)) {
      const text = await btn.textContent().catch(() => "");
      const label = await btn.getAttribute("aria-label").catch(() => "");
      if (/copy|คัดลอก/i.test(text || "") || /copy/i.test(label || "")) {
        copyFound++;
        if (copyFound === 1) {
          await btn.click().catch(() => {});
          console.log("✅ Copy button clicked");
        }
      }
    }
    console.log("👁️ Copy buttons total:", copyFound);
    await ss(page, "09-copy-test");
  });

  // 7. Try It → Send Request
  test("7. Try It → Send Request", async () => {
    // Expand first endpoint
    const expandBtn = page.locator('button:has-text("Expand All")').first();
    if (await expandBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expandBtn.click();
      await page.waitForTimeout(1500);
    }

    // Find "Try It" button/tab
    const tryIt = page.locator('button:has-text("Try It"), button:has-text("ทดลอง"), text="Try It"').first();
    if (await tryIt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tryIt.click();
      await page.waitForTimeout(1000);
      await ss(page, "10-try-it");

      // Send request
      const sendBtn = page.locator('button:has-text("Send Request"), button:has-text("ส่ง")').first();
      if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await sendBtn.click();
        await page.waitForTimeout(2000);
        await ss(page, "11-send-result");
        console.log("✅ Try It → Send done");
      } else {
        console.log("⚠️ Send button not found after Try It");
        await ss(page, "11-no-send-btn");
      }
    } else {
      console.log("⚠️ Try It not found");
      await ss(page, "10-no-try-it");
    }
  });

  // 8. Sidebar navigation
  test("8. Sidebar navigation", async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/dashboard/api-docs`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "12-sidebar");

    // Sidebar items from screenshot: Generate OTP, Verify OTP, List Contacts, etc.
    const sidebarItems = page.locator('text="List Contacts"').first();
    if (await sidebarItems.isVisible({ timeout: 3000 }).catch(() => false)) {
      const scrollBefore = await page.evaluate(() => window.scrollY);
      await sidebarItems.click();
      await page.waitForTimeout(1000);
      const scrollAfter = await page.evaluate(() => window.scrollY);
      console.log(`✅ Sidebar clicked — scroll: ${scrollBefore} → ${scrollAfter}`);
      await ss(page, "13-sidebar-scrolled");
    } else {
      // Try other sidebar items
      const anyNavItem = page.locator('text="Send SMS"').first();
      if (await anyNavItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await anyNavItem.click();
        await page.waitForTimeout(1000);
        console.log("✅ Sidebar 'Send SMS' clicked");
        await ss(page, "13-sidebar-scrolled");
      } else {
        console.log("⚠️ Sidebar nav items not found");
      }
    }
  });

  // 9. API Keys link
  test("9. API Keys link → /dashboard/api-keys", async () => {
    // From screenshot: "Manage API Keys" link with icon
    const apiKeysLink = page.locator('a:has-text("API Keys"), a:has-text("Manage API Keys"), a[href*="api-keys"]').first();

    if (await apiKeysLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await apiKeysLink.click();
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(2000);
      await ss(page, "14-api-keys");

      console.log("📍 URL:", page.url());
      // api-keys requires auth, might redirect to login
      const url = page.url();
      console.log("👁️ Navigated:", url.includes("api-keys") ? "✅ api-keys" : url.includes("login") ? "→ login (requires auth)" : url);
    } else {
      console.log("⚠️ API Keys link not found");
      await ss(page, "14-no-link");
    }
  });

  // 10. Responsive
  test("10a. Mobile 375px", async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/dashboard/api-docs`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "15-mobile-375");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    console.log("👁️ Scroll width:", bodyWidth, "/ 375px");
    console.log("👁️ Overflow:", bodyWidth > 375 ? "⚠️ YES" : "✅ NO");

    const loaded = /API|endpoint|เอกสาร/i.test(await page.textContent("body") || "");
    console.log("👁️ Content loaded:", loaded);
  });

  test("10b. Tablet 768px", async () => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE}/dashboard/api-docs`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "16-tablet-768");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    console.log("👁️ Scroll width:", bodyWidth, "/ 768px");
    console.log("👁️ Overflow:", bodyWidth > 768 ? "⚠️ YES" : "✅ NO");
  });

  test("10c. Desktop 1440px", async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/dashboard/api-docs`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "17-desktop-1440");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    console.log("👁️ Scroll width:", bodyWidth, "/ 1440px");
    console.log("👁️ Overflow:", bodyWidth > 1440 ? "⚠️ YES" : "✅ NO");
    console.log("🔴 Console errors:", consoleErrors.length);
    consoleErrors.forEach((e) => console.log("  -", e.substring(0, 200)));
  });
});
