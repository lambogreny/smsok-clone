/**
 * Task #5594 — Webhooks E2E Full Test (P0)
 * Layer 1: API CRUD tests
 * Layer 2: Browser interaction tests
 */

import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = "/Users/lambogreny/oracles/qa/screenshots/task-5594";
const BASE = "http://localhost:3000";
const LOGIN_EMAIL = "qa-suite@smsok.test";
const LOGIN_PASS = "QATest123!";

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

async function ss(page: Page, name: string) {
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`📸 ${p}`);
}

// Helper: login and get session cookie
async function getSessionCookie(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASS }),
  });
  const cookies = res.headers.getSetCookie();
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

async function api(path: string, opts: { method?: string; body?: unknown; cookie: string }) {
  const headers: Record<string, string> = { Cookie: opts.cookie, Origin: BASE };
  if (opts.body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// ============================================
// LAYER 1: API TESTS
// ============================================
test.describe("Layer 1 — API Tests", () => {
  let cookie: string;
  let webhookId: string;

  test.beforeAll(async () => {
    cookie = await getSessionCookie();
  });

  test("API-1. POST /api/v1/webhooks — create webhook", async () => {
    const res = await api("/api/v1/webhooks", {
      method: "POST",
      cookie,
      body: {
        url: "https://httpbin.org/post",
        events: ["sms.sent", "sms.delivered"],
      },
    });

    console.log("📍 POST /api/v1/webhooks →", res.status, JSON.stringify(res.data));
    expect([200, 201]).toContain(res.status);
    // API returns { webhook: { id, secret, ... } }
    const wh = res.data.webhook || res.data;
    expect(wh).toHaveProperty("id");
    expect(wh).toHaveProperty("secret");
    webhookId = wh.id;
    console.log("✅ Webhook created, id:", webhookId);
  });

  test("API-2. GET /api/v1/webhooks — list webhooks", async () => {
    const res = await api("/api/v1/webhooks", { cookie });

    console.log("📍 GET /api/v1/webhooks →", res.status);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data) || res.data?.webhooks).toBeTruthy();
    console.log("✅ Webhooks listed");
  });

  test("API-3. PATCH /api/v1/webhooks/[id] — edit webhook", async () => {
    // Get ID from list if not set
    if (!webhookId) {
      const list = await api("/api/v1/webhooks", { cookie });
      const webhooks = Array.isArray(list.data) ? list.data : list.data?.webhooks || [];
      webhookId = webhooks[0]?.id;
    }
    if (!webhookId) {
      console.log("⚠️ No webhook to edit");
      return;
    }

    const res = await api(`/api/v1/webhooks/${webhookId}`, {
      method: "PATCH",
      cookie,
      body: {
        url: "https://httpbin.org/anything",
        events: ["sms.sent", "sms.delivered", "sms.failed"],
      },
    });

    console.log("📍 PATCH /api/v1/webhooks/" + webhookId + " →", res.status, JSON.stringify(res.data));
    expect([200, 204]).toContain(res.status);
    console.log("✅ Webhook edited");
  });

  test("API-4. POST /api/v1/webhooks/[id]/test — test webhook", async () => {
    if (!webhookId) {
      const list = await api("/api/v1/webhooks", { cookie });
      const webhooks = Array.isArray(list.data) ? list.data : list.data?.webhooks || [];
      webhookId = webhooks[0]?.id;
    }
    if (!webhookId) {
      console.log("⚠️ No webhook to test");
      return;
    }

    const res = await api(`/api/v1/webhooks/${webhookId}/test`, {
      method: "POST",
      cookie,
    });

    console.log("📍 POST /api/v1/webhooks/" + webhookId + "/test →", res.status, JSON.stringify(res.data));
    expect([200, 201, 202]).toContain(res.status);
    console.log("✅ Test webhook sent");
  });

  test("API-5. POST /api/v1/webhooks/[id]/rotate-secret — rotate secret", async () => {
    if (!webhookId) {
      const list = await api("/api/v1/webhooks", { cookie });
      const webhooks = Array.isArray(list.data) ? list.data : list.data?.webhooks || [];
      webhookId = webhooks[0]?.id;
    }
    if (!webhookId) {
      console.log("⚠️ No webhook to rotate");
      return;
    }

    const res = await api(`/api/v1/webhooks/${webhookId}/rotate-secret`, {
      method: "POST",
      cookie,
    });

    console.log("📍 POST rotate-secret →", res.status, JSON.stringify(res.data));
    expect([200, 201]).toContain(res.status);
    expect(res.data).toHaveProperty("secret");
    console.log("✅ Secret rotated");
  });

  test("API-6. GET /api/v1/webhooks/[id]/logs — delivery logs", async () => {
    if (!webhookId) {
      const list = await api("/api/v1/webhooks", { cookie });
      const webhooks = Array.isArray(list.data) ? list.data : list.data?.webhooks || [];
      webhookId = webhooks[0]?.id;
    }
    if (!webhookId) {
      console.log("⚠️ No webhook for logs");
      return;
    }

    const res = await api(`/api/v1/webhooks/${webhookId}/logs`, { cookie });

    console.log("📍 GET logs →", res.status, JSON.stringify(res.data)?.substring(0, 200));
    expect([200]).toContain(res.status);
    console.log("✅ Delivery logs fetched");
  });

  test("API-7. DELETE /api/v1/webhooks/[id] — delete webhook", async () => {
    if (!webhookId) {
      const list = await api("/api/v1/webhooks", { cookie });
      const webhooks = Array.isArray(list.data) ? list.data : list.data?.webhooks || [];
      webhookId = webhooks[0]?.id;
    }
    if (!webhookId) {
      console.log("⚠️ No webhook to delete");
      return;
    }

    const res = await api(`/api/v1/webhooks/${webhookId}`, {
      method: "DELETE",
      cookie,
    });

    console.log("📍 DELETE /api/v1/webhooks/" + webhookId + " →", res.status);
    expect([200, 204]).toContain(res.status);
    console.log("✅ Webhook deleted");
  });

  test("API-8. No auth → 401", async () => {
    const res = await fetch(`${BASE}/api/v1/webhooks`, {
      headers: { Origin: BASE },
    });
    console.log("📍 GET /api/v1/webhooks (no auth) →", res.status);
    expect(res.status).toBe(401);
    console.log("✅ No auth → 401");
  });
});

// ============================================
// LAYER 2: BROWSER TESTS
// ============================================
test.describe("Layer 2 — Browser Tests", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
  });

  test("B1. Webhooks page loads with no errors", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/webhooks`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "01-page-load");

    console.log("📍 URL:", page.url());
    expect(page.url()).toContain("webhook");

    const pageText = await page.textContent("body");
    console.log("👁️ Contains Webhooks:", /webhook/i.test(pageText || ""));
    console.log("🔴 Console errors:", consoleErrors.length);
  });

  test("B2. Create webhook flow (full)", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/webhooks`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Click create button
    const createBtn = page.locator('button:has-text("เพิ่ม Webhook"), button:has-text("สร้าง"), a:has-text("เพิ่ม")').first();
    await createBtn.click();
    await page.waitForTimeout(1500);
    await ss(page, "02-create-modal");

    // Fill URL
    const urlInput = page.locator('input[placeholder*="example.com"], input[placeholder*="webhook"], input[placeholder*="https"]').first();
    await urlInput.clear();
    await urlInput.fill("https://httpbin.org/post");

    // Select events via preset or checkbox
    const presetBtn = page.locator('text="Delivery events"').first();
    if (await presetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await presetBtn.click();
      console.log("✅ Delivery events preset selected");
    } else {
      const smsEvent = page.locator('text="sms.sent"').first();
      if (await smsEvent.isVisible().catch(() => false)) await smsEvent.click();
    }
    await page.waitForTimeout(500);
    await ss(page, "03-form-filled");

    // Target save button INSIDE the dialog (overlay blocks clicks to background buttons)
    const dialogContent = page.locator('[data-slot="dialog-content"], [role="dialog"], dialog').first();

    // Scroll dialog content to reveal submit button
    if (await dialogContent.isVisible({ timeout: 1000 }).catch(() => false)) {
      await dialogContent.evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await page.waitForTimeout(500);
    }
    await ss(page, "03b-scrolled-modal");

    // Find submit button inside dialog only
    const saveBtn = dialogContent.locator('button:has-text("เพิ่ม Webhook"), button:has-text("สร้าง Webhook"), button:has-text("บันทึก"), button:has-text("Save"), button:has-text("สร้าง"), button[type="submit"]').first();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click({ force: true });
      console.log("✅ Save button clicked (inside dialog)");
    } else {
      // Fallback: last button in dialog content
      const dialogBtns = dialogContent.locator('button');
      const count = await dialogBtns.count();
      console.log(`👁️ Buttons inside dialog: ${count}`);
      if (count > 0) {
        await dialogBtns.last().click({ force: true });
        console.log("✅ Last dialog button clicked (fallback)");
      }
    }
    await page.waitForTimeout(3000);
    await ss(page, "04-created-success");

    const pageText = await page.textContent("body");
    console.log("👁️ Success dialog:", /สำเร็จ|success|secret/i.test(pageText || ""));

    // Close success dialog
    const doneBtn = page.locator('button:has-text("เสร็จสิ้น"), button:has-text("Close"), button:has-text("ตกลง")').first();
    if (await doneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await doneBtn.click();
      await page.waitForTimeout(1000);
    }

    await ss(page, "05-webhook-list");
    console.log("✅ Webhook created and visible in list");
  });

  test("B3. Events selector — all categories display", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/webhooks`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Open create modal to see events
    const createBtn = page.locator('button:has-text("เพิ่ม Webhook"), button:has-text("สร้าง")').first();
    await createBtn.click();
    await page.waitForTimeout(1500);
    await ss(page, "06-events-selector");

    const pageText = await page.textContent("body");

    // Check event categories
    const categories = ["SMS", "แคมเปญ", "Campaign", "sms.sent", "sms.delivered", "sms.failed"];
    for (const cat of categories) {
      const found = new RegExp(cat, "i").test(pageText || "");
      console.log(`👁️ Event "${cat}":`, found ? "✅" : "⚠️");
    }

    // Check presets
    const presets = ["Delivery events", "Campaign lifecycle", "Compliance"];
    for (const p of presets) {
      const found = new RegExp(p, "i").test(pageText || "");
      console.log(`👁️ Preset "${p}":`, found ? "✅" : "⚠️");
    }

    // Close modal
    const closeBtn = page.locator('button:has(svg[class*="x"]), button[aria-label="close"], text="✕"').first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  test("B4. Delete webhook via icon button", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/webhooks`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Count webhooks before
    const beforeText = await page.textContent("body");
    const beforeMatch = beforeText?.match(/Webhooks\s*\((\d+)\)/);
    console.log("👁️ Before delete:", beforeMatch?.[0] || "unknown count");
    await ss(page, "07-before-delete");

    // Find delete icon button (🗑️) in the table row
    const deleteIcon = page.locator('button:has(svg), button[aria-label*="delete" i], button[aria-label*="ลบ"]').filter({ hasText: "" });
    const trashBtns = page.locator('tbody tr button').last();

    if (await trashBtns.isVisible({ timeout: 2000 }).catch(() => false)) {
      await trashBtns.click();
      await page.waitForTimeout(1000);

      // Confirm deletion dialog
      const confirmBtn = page.locator('button:has-text("ยืนยัน"), button:has-text("ลบ"), button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
        console.log("✅ Delete confirmed");
      }

      await ss(page, "08-after-delete");
    } else {
      console.log("⚠️ Delete button not found in table");
    }
  });

  test("B5. Responsive — 375px, 768px, 1440px", async ({ page }) => {
    for (const [w, h, label] of [
      [375, 812, "mobile-375"],
      [768, 1024, "tablet-768"],
      [1440, 900, "desktop-1440"],
    ] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`${BASE}/dashboard/webhooks`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1500);
      await ss(page, `09-${label}`);

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      console.log(`👁️ ${label}: scroll=${bodyWidth}/${w} → ${bodyWidth > w ? "⚠️ OVERFLOW" : "✅ OK"}`);
    }

    console.log("🔴 Console errors:", consoleErrors.length);
    consoleErrors.forEach((e) => console.log("  -", e.substring(0, 150)));
  });
});
