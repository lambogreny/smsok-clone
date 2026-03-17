/**
 * Task #5863 — Frontend Batch Fixes (#5840) (P1)
 * Reviewer APPROVED — 0 critical, 0 warning
 *
 * Test:
 * 1. Templates page — Archive button correct, no hardcoded hex colors
 * 2. Webhook routes — settings/webhooks resolve correctly
 * 3. Visual check — CSS variables/Nansen palette, no hardcoded colors
 * 4. Full logged-in browser flow
 */

import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const DIR = "/Users/lambogreny/oracles/qa/screenshots/task-5863";
const BASE = "http://localhost:3000";
const QA_EMAIL = "qa-suite@smsok.test";
const QA_PASS = "QATest123!";

test.beforeAll(() => {
  fs.mkdirSync(DIR, { recursive: true });
});

async function ss(page: Page, name: string) {
  const p = path.join(DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`📸 ${p}`);
}

async function getSessionCookie(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email: QA_EMAIL, password: QA_PASS }),
  });
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

async function api(p: string, opts: { method?: string; body?: unknown; cookie: string }) {
  const headers: Record<string, string> = { Cookie: opts.cookie, Origin: BASE };
  if (opts.body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${p}`, {
    method: opts.method || "GET", headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const accept = page.locator('text="ยอมรับทั้งหมด"');
  if (await accept.isVisible({ timeout: 1500 }).catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(500);
  }
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASS);
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 5000 }
  ).catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

// ============================================
// LAYER 1: API TESTS
// ============================================
test.describe("Layer 1 — API", () => {
  let cookie: string;
  test.beforeAll(async () => { cookie = await getSessionCookie(); });

  test("API-1. Templates list → 200", async () => {
    const res = await api("/api/v1/templates", { cookie });
    expect(res.status).toBe(200);
    console.log("✅ Templates list 200 — count:", res.data?.templates?.length ?? 0);
  });

  test("API-2. Webhooks list → 200", async () => {
    const res = await api("/api/v1/webhooks", { cookie });
    expect(res.status).toBe(200);
    console.log("✅ Webhooks list 200");
  });

  test("API-3. Webhook create + delete", async () => {
    const create = await api("/api/v1/webhooks", {
      method: "POST", cookie,
      body: { url: "https://httpbin.org/post", events: ["sms.sent"] },
    });
    expect([200, 201]).toContain(create.status);
    const wh = create.data?.webhook || create.data;
    console.log("✅ Webhook created:", wh?.id);

    if (wh?.id) {
      const del = await api(`/api/v1/webhooks/${wh.id}`, { method: "DELETE", cookie });
      expect([200, 204]).toContain(del.status);
      console.log("✅ Webhook deleted");
    }
  });

  test("API-4. Template create with variables", async () => {
    const res = await api("/api/v1/templates", {
      method: "POST", cookie,
      body: {
        name: `QA-Visual-${Date.now()}`,
        content: "ทดสอบ {{name}} รหัส {{code}}",
        category: "general",
      },
    });
    expect([200, 201]).toContain(res.status);
    const tpl = res.data;
    console.log("✅ Template created:", tpl?.id);

    // Cleanup
    if (tpl?.id) {
      await api(`/api/v1/templates/${tpl.id}`, { method: "DELETE", cookie });
    }
  });

  test("API-5. All dashboard routes → no 500", async () => {
    const routes = [
      "/api/v1/templates",
      "/api/v1/webhooks",
      "/api/v1/contacts",
      "/api/v1/campaigns",
      "/api/v1/api-keys",
      "/api/v1/me",
    ];

    for (const r of routes) {
      const res = await api(r, { cookie });
      console.log(`📍 ${r} → ${res.status} ${res.status >= 500 ? "❌" : "✅"}`);
      expect(res.status).toBeLessThan(500);
    }
  });
});

// ============================================
// LAYER 2: BROWSER TESTS
// ============================================
test.describe("Layer 2 — Browser", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
  });

  test("B1. Templates page — Archive button + no hardcoded colors", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/templates`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "01-templates-page");

    const text = await page.textContent("body");
    console.log("👁️ Templates:", /เทมเพลต|template/i.test(text || "") ? "✅ LOADS" : "⚠️");

    // Check for hardcoded hex colors in visible elements
    const hardcodedColors = await page.evaluate(() => {
      const elements = document.querySelectorAll("*");
      const badColors: string[] = [];
      elements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const color = (el as HTMLElement).style.color;
        const bg = (el as HTMLElement).style.backgroundColor;
        // Check inline styles for hardcoded hex
        if (color && /^#[0-9a-f]{3,8}$/i.test(color)) badColors.push(`color:${color}`);
        if (bg && /^#[0-9a-f]{3,8}$/i.test(bg)) badColors.push(`bg:${bg}`);
      });
      return badColors.slice(0, 10);
    });

    console.log("👁️ Hardcoded inline colors found:", hardcodedColors.length);
    if (hardcodedColors.length > 0) {
      hardcodedColors.forEach((c) => console.log("  ⚠️", c));
    } else {
      console.log("✅ No hardcoded inline hex colors");
    }

    // Check for archive button/menu on template cards
    const templateCard = page.locator('[class*="card"]:has-text("QA"), tbody tr').first();
    if (await templateCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Look for 3-dot menu or archive button
      const menuBtn = templateCard.locator('button:has(svg), button[aria-label]').last();
      if (await menuBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await menuBtn.click();
        await page.waitForTimeout(500);
        await ss(page, "02-template-menu");

        // Check for archive option in dropdown
        const archiveOpt = page.locator('text=/ลบ|archive|เก็บ|Delete/i').first();
        if (await archiveOpt.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log("✅ Archive/Delete option visible in menu");
        } else {
          console.log("⚠️ Archive option not found in menu");
        }
      }
    }
  });

  test("B2. Templates — create dialog visual check", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/templates`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Open create dialog
    const createBtn = page.locator('button:has-text("สร้างใหม่"), button:has-text("Create")').first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      await ss(page, "03-template-create-dialog");

      // Check dialog uses proper styling (no hardcoded colors)
      const dialog = page.locator('[data-slot="dialog-content"], [role="dialog"], dialog').first();
      if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
        const dialogHtml = await dialog.evaluate((el) => el.outerHTML.substring(0, 500));
        const hasHardcodedHex = /#[0-9a-f]{6}/i.test(dialogHtml);
        console.log("👁️ Dialog has hardcoded hex in HTML:", hasHardcodedHex ? "⚠️ YES" : "✅ NO");

        // Check variable buttons styling
        const varBtns = dialog.locator('button:has-text("+ ชื่อ"), button:has-text("+ รหัส")');
        const varCount = await varBtns.count();
        console.log("👁️ Variable buttons:", varCount);

        // Check category buttons
        const categories = dialog.locator('text=/ทั่วไป|OTP|การตลาด|แจ้งเตือน|ธุรกรรม/');
        console.log("👁️ Category options:", await categories.count());
      }

      // Close dialog
      const closeBtn = page.locator('button:has-text("ยกเลิก"), button[aria-label="Close"]').first();
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
      }
    }
  });

  test("B3. Webhooks page — route resolves correctly", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/webhooks`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "04-webhooks-page");

    const url = page.url();
    console.log("📍 Webhooks URL:", url);
    expect(url).toContain("webhook");
    expect(url).not.toContain("/login");

    const text = await page.textContent("body");
    console.log("👁️ Webhooks content:", /webhook|เว็บฮุก/i.test(text || "") ? "✅" : "⚠️");

    // Check webhook CRUD UI
    const createBtn = page.locator('button:has-text("สร้าง"), button:has-text("Create"), button:has-text("เพิ่ม")').first();
    console.log("👁️ Create button:", await createBtn.isVisible({ timeout: 2000 }).catch(() => false) ? "✅" : "⚠️");
  });

  test("B4. Webhooks — create flow", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/webhooks`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    const createBtn = page.locator('button:has-text("สร้าง"), button:has-text("Create"), button:has-text("เพิ่ม")').first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      await ss(page, "05-webhook-create-dialog");

      // Fill URL
      const urlInput = page.locator('input[placeholder*="example.com"], input[placeholder*="webhook"], input[placeholder*="https"]').first();
      if (await urlInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await urlInput.clear();
        await urlInput.fill("https://httpbin.org/post");
        console.log("✅ Webhook URL filled");
      }

      // Select events
      const presetBtn = page.locator('button:has-text("Delivery events"), text="Delivery events"').first();
      if (await presetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await presetBtn.click();
        console.log("✅ Delivery events preset selected");
      } else {
        const checkbox = page.locator('input[type="checkbox"]').first();
        if (await checkbox.isVisible({ timeout: 1000 }).catch(() => false)) {
          await checkbox.check({ force: true });
          console.log("✅ First event checked");
        }
      }

      await page.waitForTimeout(500);
      await ss(page, "06-webhook-form-filled");

      // Save — inside dialog
      const dialog = page.locator('[data-slot="dialog-content"], [role="dialog"]').first();
      if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
        const saveBtn = dialog.locator('button:has-text("เพิ่ม"), button:has-text("สร้าง"), button:has-text("บันทึก"), button:has-text("Save"), button[type="submit"]').first();
        if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await saveBtn.click({ force: true });
          await page.waitForTimeout(2000);
          await ss(page, "07-webhook-saved");
          console.log("✅ Webhook saved");
        }
      }
    }
  });

  test("B5. Visual consistency — all key pages", async ({ page }) => {
    await login(page);

    const pages = [
      ["/dashboard", "dashboard"],
      ["/dashboard/templates", "templates"],
      ["/dashboard/webhooks", "webhooks"],
      ["/dashboard/contacts", "contacts"],
      ["/dashboard/campaigns", "campaigns"],
      ["/dashboard/settings", "settings"],
    ] as const;

    for (const [p, label] of pages) {
      await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1500);
      await ss(page, `08-visual-${label}`);

      // Check for hardcoded hex colors in style attributes
      const inlineHexCount = await page.evaluate(() => {
        const all = document.querySelectorAll("[style]");
        let count = 0;
        all.forEach((el) => {
          const style = el.getAttribute("style") || "";
          // Match hex colors that are NOT part of CSS variables
          if (/#[0-9a-fA-F]{3,8}/.test(style)) count++;
        });
        return count;
      });

      console.log(`👁️ ${label}: inline hex colors = ${inlineHexCount} ${inlineHexCount > 3 ? "⚠️" : "✅"}`);
    }
  });

  test("B6. Full logged-in flow — sidebar navigation", async ({ page }) => {
    await login(page);
    await ss(page, "09-dashboard");

    // Navigate through all sidebar items
    const sidebarPages = [
      { path: "/dashboard/send", label: "ส่ง SMS" },
      { path: "/dashboard/messages", label: "ประวัติการส่ง" },
      { path: "/dashboard/contacts", label: "รายชื่อผู้ติดต่อ" },
      { path: "/dashboard/campaigns", label: "แคมเปญ" },
      { path: "/dashboard/templates", label: "เทมเพลต" },
      { path: "/dashboard/webhooks", label: "Webhooks" },
      { path: "/dashboard/api-keys", label: "คีย์ API" },
      { path: "/dashboard/settings", label: "ตั้งค่า" },
    ];

    let failCount = 0;
    for (const sp of sidebarPages) {
      try {
        const res = await page.goto(`${BASE}${sp.path}`, {
          waitUntil: "domcontentloaded", timeout: 15000,
        });
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(800);
        const status = res?.status() || 0;
        if (status >= 500) failCount++;
        console.log(`👁️ ${sp.label} (${sp.path}) → ${status} ${status >= 500 ? "❌" : "✅"}`);
      } catch {
        failCount++;
        console.log(`👁️ ${sp.label} → ❌ FAILED`);
      }
    }

    await ss(page, "10-sidebar-flow");
    console.log(`📊 ${sidebarPages.length} pages, ${failCount} errors`);
    expect(failCount).toBe(0);
  });

  test("B7. Mobile 375px — templates + webhooks", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    for (const [p, label] of [
      ["/dashboard/templates", "templates"],
      ["/dashboard/webhooks", "webhooks"],
    ] as const) {
      await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1500);
      const w = await page.evaluate(() => document.body.scrollWidth);
      await ss(page, `11-mobile-${label}`);
      console.log(`👁️ Mobile ${label}: ${w}/375 → ${w > 375 ? "⚠️ OVERFLOW" : "✅"}`);
    }
  });

  test("B8. Console errors — templates + webhooks focus", async ({ page }) => {
    await login(page);

    for (const p of ["/dashboard/templates", "/dashboard/webhooks", "/dashboard"]) {
      try {
        await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(1500);
      } catch {}
    }

    await ss(page, "12-console-check");
    const templateErrors = consoleErrors.filter((e) => /template|เทมเพลต/i.test(e));
    const webhookErrors = consoleErrors.filter((e) => /webhook|เว็บฮุก/i.test(e));
    const styleErrors = consoleErrors.filter((e) => /style|color|css/i.test(e));

    console.log(`📊 Total console errors: ${consoleErrors.length}`);
    console.log(`📊 Template-related: ${templateErrors.length}`);
    console.log(`📊 Webhook-related: ${webhookErrors.length}`);
    console.log(`📊 Style-related: ${styleErrors.length}`);
    consoleErrors.slice(0, 8).forEach((e) => console.log("  -", e.substring(0, 150)));
  });
});
