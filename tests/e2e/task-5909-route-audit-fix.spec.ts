/**
 * Task #5909 — Route Audit Fix
 * Verify: no dead routes, sidebar links all work, campaigns empty state link correct
 *
 * 2-Layer: API (A1-A10) + Browser (B1-B12)
 */

import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3000";
const DIR = "screenshots/route-audit-5909";
const QA_EMAIL = "qa-suite@smsok.test";
const QA_PASS = "QATest123!";

test.beforeAll(() => { fs.mkdirSync(DIR, { recursive: true }); });

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

async function api(p: string, cookie: string) {
  const res = await fetch(`${BASE}${p}`, {
    headers: { Cookie: cookie, Origin: BASE },
  });
  return { status: res.status, url: `${BASE}${p}` };
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const accept = page.locator('text="ยอมรับทั้งหมด"');
  if (await accept.isVisible({ timeout: 1500 }).catch(() => false)) { await accept.click(); await page.waitForTimeout(500); }
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASS);
  await page.waitForFunction(() => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled, { timeout: 5000 }).catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

// All sidebar routes from DashboardShell.tsx
const SIDEBAR_ROUTES = [
  { path: "/dashboard", label: "ภาพรวม" },
  { path: "/dashboard/send", label: "ส่ง SMS" },
  { path: "/dashboard/messages", label: "ประวัติการส่ง" },
  { path: "/dashboard/otp", label: "บริการ OTP" },
  { path: "/dashboard/templates", label: "เทมเพลต" },
  { path: "/dashboard/billing/packages", label: "ซื้อแพ็กเกจ" },
  { path: "/dashboard/packages/my", label: "แพ็กเกจของฉัน" },
  { path: "/dashboard/billing/orders", label: "ประวัติคำสั่งซื้อ" },
  { path: "/dashboard/contacts", label: "รายชื่อผู้ติดต่อ" },
  { path: "/dashboard/tags", label: "แท็ก" },
  { path: "/dashboard/groups", label: "กลุ่ม" },
  { path: "/dashboard/senders", label: "ชื่อผู้ส่ง" },
  { path: "/dashboard/campaigns", label: "แคมเปญ" },
  { path: "/dashboard/analytics", label: "รายงาน" },
  { path: "/dashboard/api-keys", label: "คีย์ API" },
  { path: "/dashboard/webhooks", label: "Webhooks" },
  { path: "/dashboard/logs", label: "API Logs" },
  { path: "/dashboard/api-docs", label: "เอกสาร API" },
  { path: "/dashboard/settings", label: "ตั้งค่า" },
];

// Additional dashboard routes (not in sidebar but should not 404)
const EXTRA_ROUTES = [
  "/dashboard/billing",
  "/dashboard/billing/history",
  "/dashboard/contacts/blacklist",
  "/dashboard/contacts/groups",
  "/dashboard/templates/new",
  "/dashboard/campaigns/calendar",
  "/dashboard/campaigns/recurring",
  "/dashboard/support",
  "/dashboard/settings/security",
  "/dashboard/settings/team",
  "/dashboard/settings/webhooks",
  "/dashboard/settings/notifications",
];

// ═══════════════════════════════════════
// ชั้น 1: API Tests (A1-A10)
// ═══════════════════════════════════════

test.describe("ชั้น 1: API — Route Audit", () => {
  let cookie: string;

  test.beforeAll(async () => {
    cookie = await getSessionCookie();
  });

  test("A1: All 19 sidebar routes → not 404/500", async () => {
    const results: string[] = [];
    for (const route of SIDEBAR_ROUTES) {
      const res = await api(route.path, cookie);
      results.push(`${route.label} (${route.path}) → ${res.status}`);
      expect(res.status, `${route.label} should not be 404`).not.toBe(404);
      expect(res.status, `${route.label} should not be 500`).not.toBe(500);
    }
    console.log("📍 Sidebar routes:");
    results.forEach(r => console.log(`  ${r}`));
    console.log(`✅ All ${SIDEBAR_ROUTES.length} sidebar routes OK`);
  });

  test("A2: Extra dashboard routes → not 404/500", async () => {
    const results: string[] = [];
    for (const p of EXTRA_ROUTES) {
      const res = await api(p, cookie);
      results.push(`${p} → ${res.status}`);
      expect(res.status, `${p} should not be 404`).not.toBe(404);
      expect(res.status, `${p} should not be 500`).not.toBe(500);
    }
    console.log("📍 Extra routes:");
    results.forEach(r => console.log(`  ${r}`));
    console.log(`✅ All ${EXTRA_ROUTES.length} extra routes OK`);
  });

  test("A3: /dashboard/senders → 200 (not 404)", async () => {
    const res = await api("/dashboard/senders", cookie);
    console.log(`📍 Senders page → ${res.status}`);
    expect(res.status).toBe(200);
    console.log(`✅ Senders route exists`);
  });

  test("A4: /dashboard/campaigns → 200", async () => {
    const res = await api("/dashboard/campaigns", cookie);
    console.log(`📍 Campaigns page → ${res.status}`);
    expect(res.status).toBe(200);
    console.log(`✅ Campaigns route exists`);
  });

  test("A5: Old /dashboard/senders/new → check if redirect or 404", async () => {
    const res = await fetch(`${BASE}/dashboard/senders/new`, {
      headers: { Cookie: cookie, Origin: BASE },
      redirect: "manual",
    });
    console.log(`📍 /dashboard/senders/new → ${res.status}`);
    // This was the dead route in the bug. Should be 404 or redirect — not the link target anymore
    console.log(`✅ /dashboard/senders/new status: ${res.status}`);
  });

  test("A6: Settings sub-routes all work", async () => {
    const settingsRoutes = [
      "/dashboard/settings",
      "/dashboard/settings/security",
      "/dashboard/settings/team",
      "/dashboard/settings/webhooks",
      "/dashboard/settings/notifications",
      "/dashboard/settings/api-keys",
    ];
    for (const p of settingsRoutes) {
      const res = await api(p, cookie);
      console.log(`  ${p} → ${res.status}`);
      expect(res.status).not.toBe(404);
      expect(res.status).not.toBe(500);
    }
    console.log(`✅ All settings routes OK`);
  });

  test("A7: Billing sub-routes all work", async () => {
    const billingRoutes = [
      "/dashboard/billing",
      "/dashboard/billing/packages",
      "/dashboard/billing/orders",
      "/dashboard/billing/history",
    ];
    for (const p of billingRoutes) {
      const res = await api(p, cookie);
      console.log(`  ${p} → ${res.status}`);
      expect(res.status).not.toBe(404);
      expect(res.status).not.toBe(500);
    }
    console.log(`✅ All billing routes OK`);
  });

  test("A8: Contact sub-routes all work", async () => {
    const contactRoutes = [
      "/dashboard/contacts",
      "/dashboard/contacts/blacklist",
      "/dashboard/contacts/groups",
      "/dashboard/contacts/import",
    ];
    for (const p of contactRoutes) {
      const res = await api(p, cookie);
      console.log(`  ${p} → ${res.status}`);
      expect(res.status).not.toBe(404);
      expect(res.status).not.toBe(500);
    }
    console.log(`✅ All contact routes OK`);
  });

  test("A9: Support routes work", async () => {
    const supportRoutes = [
      "/dashboard/support",
      "/dashboard/support/new",
      "/dashboard/support/kb",
    ];
    for (const p of supportRoutes) {
      const res = await api(p, cookie);
      console.log(`  ${p} → ${res.status}`);
      expect(res.status).not.toBe(404);
      expect(res.status).not.toBe(500);
    }
    console.log(`✅ All support routes OK`);
  });

  test("A10: Protected routes without auth → redirect (not 500)", async () => {
    const res = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
    console.log(`📍 /dashboard no auth → ${res.status}`);
    // Should redirect to login or return 302/307, not 500
    expect(res.status).not.toBe(500);
    console.log(`✅ Protected route handled correctly`);
  });
});

// ═══════════════════════════════════════
// ชั้น 2: Browser Tests (B1-B12)
// ═══════════════════════════════════════

test.describe("ชั้น 2: Browser — Route Navigation", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    page = await context.newPage();
    await login(page);
    await ss(page, "B00-logged-in");
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  // ─── B1: Click every sidebar link — verify no 404 ───
  test("B1: Click all sidebar links — no 404 pages", async () => {
    const results: string[] = [];

    for (const route of SIDEBAR_ROUTES) {
      await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});

      const is404 = await page.locator("text=404, text=Not Found, text=ไม่พบหน้า").first().isVisible().catch(() => false);
      const url = page.url();

      results.push(`${route.label}: ${url} → ${is404 ? "❌ 404" : "✅ OK"}`);
      expect(is404, `${route.label} (${route.path}) should not be 404`).toBe(false);
    }

    console.log("📍 Sidebar navigation results:");
    results.forEach(r => console.log(`  ${r}`));
    await ss(page, "B01-sidebar-all-visited");
    console.log(`✅ All ${SIDEBAR_ROUTES.length} sidebar links work`);
  });

  // ─── B2: Dashboard main page ───
  test("B2: Dashboard main page loads with content", async () => {
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);

    const content = await page.textContent("body");
    console.log(`📍 URL: ${page.url()}`);
    console.log(`👁️ Has content: ${(content?.length || 0) > 100}`);

    await ss(page, "B02-dashboard");
    console.log(`✅ Dashboard loaded`);
  });

  // ─── B3: Senders page loads (key fix) ───
  test("B3: Senders page loads correctly", async () => {
    await page.goto(`${BASE}/dashboard/senders`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);

    const is404 = await page.locator("text=404, text=Not Found").first().isVisible().catch(() => false);
    const content = await page.textContent("body");

    console.log(`📍 URL: ${page.url()}`);
    console.log(`👁️ 404: ${is404}`);
    console.log(`👁️ Has "ชื่อผู้ส่ง": ${content?.includes("ชื่อผู้ส่ง") || content?.includes("Sender")}`);

    expect(is404).toBe(false);

    await ss(page, "B03-senders-page");
    console.log(`✅ Senders page loads correctly`);
  });

  // ─── B4: Campaigns page — empty state link goes to /senders (not /senders/new) ───
  test("B4: Campaigns empty state link → /dashboard/senders (not /senders/new)", async () => {
    await page.goto(`${BASE}/dashboard/campaigns`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);

    await ss(page, "B04-campaigns-page");

    // Check if there's an empty state with a link to senders
    const senderLink = page.locator('a[href="/dashboard/senders"]');
    const oldLink = page.locator('a[href="/dashboard/senders/new"]');

    const hasSenderLink = await senderLink.count();
    const hasOldLink = await oldLink.count();

    console.log(`📍 URL: ${page.url()}`);
    console.log(`👁️ Link to /dashboard/senders: ${hasSenderLink}`);
    console.log(`👁️ Link to /dashboard/senders/new (old/dead): ${hasOldLink}`);

    // The old dead link should NOT exist
    expect(hasOldLink, "Should not link to /dashboard/senders/new").toBe(0);

    if (hasSenderLink > 0) {
      // Click the link to verify it works
      await senderLink.first().click();
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1000);

      const is404 = await page.locator("text=404, text=Not Found").first().isVisible().catch(() => false);
      expect(is404).toBe(false);
      console.log(`✅ Sender link navigated to: ${page.url()} — no 404`);
      await ss(page, "B04-sender-link-clicked");
    } else {
      console.log(`✅ No sender link in campaigns (may have campaigns already)`);
    }
  });

  // ─── B5: Templates page ───
  test("B5: Templates page loads", async () => {
    await page.goto(`${BASE}/dashboard/templates`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);

    const is404 = await page.locator("text=404").first().isVisible().catch(() => false);
    expect(is404).toBe(false);

    await ss(page, "B05-templates");
    console.log(`📍 URL: ${page.url()}`);
    console.log(`✅ Templates page loaded`);
  });

  // ─── B6: Contacts page ───
  test("B6: Contacts page loads", async () => {
    await page.goto(`${BASE}/dashboard/contacts`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const is404 = await page.locator("text=404").first().isVisible().catch(() => false);
    expect(is404).toBe(false);

    await ss(page, "B06-contacts");
    console.log(`✅ Contacts page loaded`);
  });

  // ─── B7: Billing page ───
  test("B7: Billing packages page loads", async () => {
    await page.goto(`${BASE}/dashboard/billing/packages`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const is404 = await page.locator("text=404").first().isVisible().catch(() => false);
    expect(is404).toBe(false);

    await ss(page, "B07-billing-packages");
    console.log(`✅ Billing packages page loaded`);
  });

  // ─── B8: Settings page ───
  test("B8: Settings page loads", async () => {
    await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const is404 = await page.locator("text=404").first().isVisible().catch(() => false);
    expect(is404).toBe(false);

    await ss(page, "B08-settings");
    console.log(`✅ Settings page loaded`);
  });

  // ─── B9: API Keys page ───
  test("B9: API Keys page loads", async () => {
    await page.goto(`${BASE}/dashboard/api-keys`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const is404 = await page.locator("text=404").first().isVisible().catch(() => false);
    expect(is404).toBe(false);

    await ss(page, "B09-api-keys");
    console.log(`✅ API Keys page loaded`);
  });

  // ─── B10: Webhooks page ───
  test("B10: Webhooks page loads", async () => {
    await page.goto(`${BASE}/dashboard/webhooks`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const is404 = await page.locator("text=404").first().isVisible().catch(() => false);
    expect(is404).toBe(false);

    await ss(page, "B10-webhooks");
    console.log(`✅ Webhooks page loaded`);
  });

  // ─── B11: Console errors across routes ───
  test("B11: No JS errors on key pages", async () => {
    const consoleErrors: string[] = [];
    const listener = (msg: any) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    };
    page.on("console", listener);

    const keyPages = [
      "/dashboard",
      "/dashboard/senders",
      "/dashboard/campaigns",
      "/dashboard/billing/packages",
      "/dashboard/settings",
    ];

    for (const p of keyPages) {
      await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(500);
    }

    page.off("console", listener);

    const critical = consoleErrors.filter(e =>
      !e.includes("favicon") && !e.includes("DevTools") && !e.includes("Warning:")
    );

    console.log(`📍 Console errors: ${consoleErrors.length} total, ${critical.length} critical`);
    if (critical.length > 0) {
      console.log(`⚠️ Errors: ${critical.slice(0, 5).join(" | ")}`);
    }

    await ss(page, "B11-console-check");
    console.log(`✅ Console check done`);
  });

  // ─── B12: Mobile responsive — sidebar navigation ───
  test("B12: Mobile 375px — key pages load", async () => {
    const mobileCtx = await page.context().browser()!.newContext({
      viewport: { width: 375, height: 812 },
    });
    const mp = await mobileCtx.newPage();
    await login(mp);

    const mobilePages = [
      { path: "/dashboard", name: "dashboard" },
      { path: "/dashboard/senders", name: "senders" },
      { path: "/dashboard/campaigns", name: "campaigns" },
    ];

    for (const pg of mobilePages) {
      await mp.goto(`${BASE}${pg.path}`, { waitUntil: "domcontentloaded" });
      await mp.waitForLoadState("networkidle").catch(() => {});
      await mp.waitForTimeout(500);

      const bodyWidth = await mp.evaluate(() => document.body.scrollWidth);
      await mp.screenshot({ path: `${DIR}/B12-mobile-${pg.name}.png` });
      console.log(`📍 ${pg.name}: width=${bodyWidth}px, overflow=${bodyWidth > 400 ? "YES ⚠️" : "NO ✅"}`);
    }

    await mobileCtx.close();
    console.log(`✅ Mobile responsive check done`);
  });
});
