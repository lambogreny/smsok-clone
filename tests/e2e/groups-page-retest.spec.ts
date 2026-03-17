import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS = path.join(__dirname, "..", "screenshots", "groups-retest");
const CSRF = { Origin: "http://localhost:3000", Referer: "http://localhost:3000/" };

test.describe("Groups Page Retest #5261", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });
  });

  test("Groups page loads without error", async ({ page, request }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    // Layer 1: API check
    console.log("\n=== Groups Page Retest — Layer 1 API ===");
    const apiResp = await request.get("/api/v1/groups");
    expect(apiResp.status()).toBe(200);
    const apiData = (await apiResp.json()).data || await apiResp.json();
    console.log(`✅ GET /api/v1/groups → 200, groups: ${(apiData.groups || []).length}`);

    // Layer 2: Browser
    console.log("\n=== Groups Page Retest — Layer 2 Browser ===");
    await page.goto("/dashboard/contacts/groups", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    // Dismiss cookies
    const btn = page.locator("text=/ยอมรับทั้งหมด/i").first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "01-groups-page.png"), fullPage: true });
    console.log(`📍 URL: ${page.url()}`);

    const bodyText = await page.locator("body").innerText();
    console.log(`👁️ First 200 chars: ${bodyText.substring(0, 200)}`);

    // CRITICAL CHECK: ไม่ควรแสดง "เกิดข้อผิดพลาด" (error)
    const hasError = bodyText.includes("เกิดข้อผิดพลาด") || bodyText.includes("Internal Server Error");
    if (hasError) {
      console.log("❌ BUG STILL PRESENT: Groups page shows error!");
    } else {
      console.log("✅ No error displayed on Groups page");
    }

    // Should show groups content
    const hasGroupsContent = bodyText.includes("กลุ่ม") || bodyText.includes("Group");
    console.log(`✅ Groups content visible: ${hasGroupsContent}`);
    expect(hasError).toBe(false);

    // Check for create button
    const createBtn = page.locator('button:has-text("สร้าง"), a:has-text("สร้าง")').first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("✅ Create group button visible");
      await createBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS, "02-create-group-form.png"), fullPage: true });
      console.log("✅ Create group form opened");
    }

    // Mobile check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS, "03-groups-mobile.png"), fullPage: true });
    console.log("📱 Mobile 375px done");

    // Console errors
    const realErrors = consoleErrors.filter(e =>
      !e.includes("favicon") && !e.includes("hydration") && !e.includes("third-party")
    );
    if (realErrors.length > 0) {
      console.log(`⚠️ Console errors: ${realErrors.slice(0, 3).join("; ")}`);
    } else {
      console.log("✅ No console errors");
    }
  });
});
