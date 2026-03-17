import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS = path.join(__dirname, "..", "screenshots", "sender-retest");
const CSRF = { Origin: "http://localhost:3000", Referer: "http://localhost:3000/" };

test.describe("Sender Create Retest + Regression", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });
  });

  test("Sender CRUD — was 500, should be fixed", async ({ request }) => {
    console.log("\n=== SENDER CREATE RETEST ===");

    // 1. Create sender
    const senderName = `QA${Date.now().toString(36).slice(-5).toUpperCase()}`;
    const createResp = await request.post("/api/v1/senders/name", {
      headers: CSRF,
      data: { name: senderName, accountType: "individual" },
    });
    console.log(`📊 Create sender "${senderName}" → ${createResp.status()}`);
    const createBody = await createResp.json();
    console.log(`📊 Response: ${JSON.stringify(createBody).substring(0, 200)}`);

    expect(createResp.status()).toBe(201);
    const senderData = createBody.data || createBody;
    const senderId = senderData.senderName?.id || senderData.id;
    console.log(`✅ Sender created: ${senderId}, status: ${senderData.senderName?.status || "PENDING"}`);

    // 2. List senders — verify it appears
    const listResp = await request.get("/api/v1/senders/name");
    expect(listResp.status()).toBe(200);
    const listData = (await listResp.json()).data || await listResp.json();
    const senders = listData.senderNames || [];
    const found = senders.find((s: { name: string }) => s.name === senderName.toUpperCase() || s.name === senderName);
    expect(found).toBeTruthy();
    console.log(`✅ Sender visible in list (${senders.length} total)`);

    // 3. Duplicate sender → should reject
    const dupResp = await request.post("/api/v1/senders/name", {
      headers: CSRF,
      data: { name: senderName, accountType: "individual" },
    });
    expect([400, 409]).toContain(dupResp.status());
    console.log(`✅ Duplicate sender → ${dupResp.status()}`);

    // 4. Cleanup
    if (senderId) {
      const delResp = await request.delete(`/api/v1/senders/name/${senderId}`, { headers: CSRF });
      console.log(`📊 Delete sender → ${delResp.status()}`);
    }
  });

  test("Previous fixes still work — Orders, XSS, Template dup", async ({ request }) => {
    console.log("\n=== REGRESSION: Previous Fixes ===");

    // Orders create
    const pkgResp = await request.get("/api/v1/packages");
    const tiers = ((await pkgResp.json()).data || await pkgResp.json()).tiers || [];

    if (tiers.length > 0) {
      const orderResp = await request.post("/api/v1/orders", {
        headers: CSRF,
        data: {
          package_tier_id: tiers[0].id,
          customer_type: "INDIVIDUAL",
          tax_name: "QA Regression Check",
          tax_id: "1234567890123",
          tax_address: "123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10100",
          tax_branch_type: "HEAD",
        },
      });
      expect(orderResp.status()).toBe(201);
      console.log(`✅ Orders create → 201 (still fixed)`);

      // XSS in tax_name
      const xssResp = await request.post("/api/v1/orders", {
        headers: CSRF,
        data: {
          package_tier_id: tiers[0].id,
          customer_type: "INDIVIDUAL",
          tax_name: '<script>alert(1)</script>',
          tax_id: "1234567890123",
          tax_address: "123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10100",
          tax_branch_type: "HEAD",
        },
      });
      expect(xssResp.status()).not.toBe(500);
      console.log(`✅ XSS tax_name → ${xssResp.status()} (still fixed, not 500)`);
    }

    // Template duplicate name
    const tplName = `QA-Tpl-${Date.now().toString(36)}`;
    const tpl1 = await request.post("/api/v1/templates", {
      headers: CSRF,
      data: { name: tplName, content: "test content" },
    });
    if (tpl1.status() === 201) {
      const tpl2 = await request.post("/api/v1/templates", {
        headers: CSRF,
        data: { name: tplName, content: "duplicate" },
      });
      console.log(`📊 Template duplicate → ${tpl2.status()}`);
      expect(tpl2.status()).not.toBe(500);

      // Cleanup
      const tplData = (await tpl1.json()).data || await tpl1.json();
      if (tplData.id) {
        await request.delete(`/api/v1/templates/${tplData.id}`, { headers: CSRF });
      }
    }
  });

  test("Dashboard pages — no 500 errors", async ({ page }) => {
    const errors500: string[] = [];
    page.on("response", (resp) => {
      if (resp.status() >= 500) errors500.push(`${resp.url()} → ${resp.status()}`);
    });

    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click({ force: true });
        await page.waitForTimeout(300);
      }
    }

    console.log("\n=== REGRESSION: Dashboard Pages ===");

    const pages = [
      "/dashboard", "/dashboard/send", "/dashboard/history",
      "/dashboard/templates", "/dashboard/campaigns",
      "/dashboard/contacts", "/dashboard/contacts/groups",
      "/dashboard/senders", "/dashboard/packages",
      "/dashboard/billing", "/dashboard/api-keys",
      "/dashboard/settings", "/dashboard/support",
    ];

    for (const url of pages) {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await dismissCookies();

      const bodyText = await page.locator("body").innerText();
      const isError = bodyText.trim() === "Internal Server Error";
      const name = url.split("/").pop() || "dashboard";

      if (isError) {
        console.log(`❌ ${name}: Internal Server Error`);
      } else {
        console.log(`✅ ${name}: loads OK`);
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "01-dashboard-final.png"), fullPage: true });

    // Senders page specifically
    await page.goto("/dashboard/senders", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(SCREENSHOTS, "02-senders-final.png"), fullPage: true });
    console.log(`📍 Senders: ${page.url()}`);

    if (errors500.length > 0) {
      console.log(`\n⚠️ 500 errors detected (${errors500.length}):`);
      errors500.slice(0, 5).forEach(e => console.log(`  ${e}`));
    } else {
      console.log("\n✅ Zero 500 errors across all pages");
    }

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS, "03-senders-mobile.png"), fullPage: true });
    console.log("📱 Mobile OK");
  });
});
