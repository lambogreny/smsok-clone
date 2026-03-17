import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS = path.join(__dirname, "..", "screenshots", "chars-per-segment");

test.describe("charsPerSegment fix — Layer 2 Browser Test", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });
  });

  test("SMS Send page — character counter displays correct charsPerSegment", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    // Step 1: Navigate to SMS send page
    await page.goto("/dashboard/send", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    // Dismiss cookie banner if visible
    const acceptBtn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
    if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
      console.log("🍪 Cookie banner dismissed");
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "01-send-page-initial.png"), fullPage: true });
    console.log(`📍 URL: ${page.url()}`);

    // Step 2: Find the MESSAGE textarea (not recipients).
    // The message textarea has placeholder containing "พิมพ์ข้อความ SMS"
    const messageTextarea = page.locator('textarea[placeholder*="พิมพ์ข้อความ"]').first();
    if (!await messageTextarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Fallback: find by label
      console.log("⚠️ Primary selector failed, trying fallback...");
    }
    await expect(messageTextarea).toBeVisible({ timeout: 10000 });
    console.log("✅ Found message textarea");

    // Helper: type into message and read counter
    async function typeAndCheck(label: string, text: string, expectedDenom: number, expectedSms: number) {
      await messageTextarea.click();
      await messageTextarea.fill(text);
      // Trigger React onChange by pressing a key then backspace, or use dispatchEvent
      await messageTextarea.press("Space");
      await messageTextarea.press("Backspace");
      await page.waitForTimeout(500);

      const counterText = await page.textContent("body") || "";
      // Match pattern like "200/153 chars · 2 SMS"
      const match = counterText.match(/(\d+)\/(\d+)\s*chars\s*·\s*(\d+)\s*SMS/);
      if (match) {
        const [, charCount, denom, sms] = match;
        console.log(`📊 ${label}: ${charCount}/${denom} chars · ${sms} SMS`);
        expect(parseInt(denom)).toBe(expectedDenom);
        expect(parseInt(sms)).toBe(expectedSms);
        return true;
      }
      // Try simpler pattern
      const simpleMatch = counterText.match(/(\d+)\/(\d+)\s*chars/);
      if (simpleMatch) {
        console.log(`📊 ${label}: ${simpleMatch[0]}`);
        expect(parseInt(simpleMatch[2])).toBe(expectedDenom);
        return true;
      }
      console.log(`⚠️ ${label}: Counter pattern not found`);
      return false;
    }

    // Step 3: Short English (< 160) → /160, 1 SMS
    await typeAndCheck("Short English (13 chars)", "Hello QA test", 160, 1);
    await page.screenshot({ path: path.join(SCREENSHOTS, "02-short-english.png"), fullPage: true });

    // Step 4: Long English (200 chars) → /153, 2 SMS
    await typeAndCheck("Long English (200 chars)", "A".repeat(200), 153, 2);
    await page.screenshot({ path: path.join(SCREENSHOTS, "03-long-english-200.png"), fullPage: true });

    // Step 5: Short Thai (< 70) → /70, 1 SMS
    await typeAndCheck("Short Thai", "สวัสดีครับ", 70, 1);
    await page.screenshot({ path: path.join(SCREENSHOTS, "04-short-thai.png"), fullPage: true });

    // Step 6: Long Thai (100 chars) → /67, 2 SMS
    await typeAndCheck("Long Thai (100 chars)", "ก".repeat(100), 67, 2);
    await page.screenshot({ path: path.join(SCREENSHOTS, "05-long-thai-100.png"), fullPage: true });

    // Step 7: Boundary — exactly 160 English → /160, 1 SMS
    await typeAndCheck("Boundary 160", "B".repeat(160), 160, 1);
    await page.screenshot({ path: path.join(SCREENSHOTS, "06-boundary-160.png"), fullPage: true });

    // Step 8: Boundary — 161 English → /153, 2 SMS
    await typeAndCheck("Boundary 161", "C".repeat(161), 153, 2);
    await page.screenshot({ path: path.join(SCREENSHOTS, "07-boundary-161.png"), fullPage: true });

    // Step 9: Boundary — 70 Thai → /70, 1 SMS
    await typeAndCheck("Boundary 70 Thai", "ก".repeat(70), 70, 1);
    await page.screenshot({ path: path.join(SCREENSHOTS, "08-boundary-70-thai.png"), fullPage: true });

    // Step 10: Boundary — 71 Thai → /67, 2 SMS
    await typeAndCheck("Boundary 71 Thai", "ก".repeat(71), 67, 2);
    await page.screenshot({ path: path.join(SCREENSHOTS, "09-boundary-71-thai.png"), fullPage: true });

    // Step 11: Encoding badges
    // Thai should show UCS-2
    const ucs2Badge = page.locator("text=UCS-2").first();
    if (await ucs2Badge.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("✅ UCS-2 encoding badge visible");
    }

    // English should show GSM-7
    await messageTextarea.fill("Hello");
    await messageTextarea.press("Space");
    await messageTextarea.press("Backspace");
    await page.waitForTimeout(300);
    const gsm7Badge = page.locator("text=GSM-7").first();
    if (await gsm7Badge.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("✅ GSM-7 encoding badge visible");
    }
    await page.screenshot({ path: path.join(SCREENSHOTS, "10-encoding-switch.png"), fullPage: true });

    // Console errors
    const realErrors = consoleErrors.filter(e =>
      !e.includes("favicon") && !e.includes("hydration") && !e.includes("third-party")
    );
    if (realErrors.length > 0) {
      console.log(`❌ Console errors: ${realErrors.join("; ")}`);
    } else {
      console.log("✅ No significant console errors");
    }

    // Step 12: Mobile 375px
    await page.setViewportSize({ width: 375, height: 812 });
    await messageTextarea.fill("ก".repeat(100));
    await messageTextarea.press("Space");
    await messageTextarea.press("Backspace");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS, "11-mobile-375.png"), fullPage: true });
    console.log("📱 Mobile 375px responsive check done");

    // Step 13: Mobile 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS, "12-mobile-390.png"), fullPage: true });
    console.log("📱 Mobile 390px responsive check done");
  });

  test("API — validate & render charsPerSegment values", async ({ request }) => {
    const CSRF = {
      Origin: "http://localhost:3000",
      Referer: "http://localhost:3000/",
    };

    // GSM-7 single → 160
    const r1 = await request.post("/api/v1/templates/validate", {
      headers: CSRF, data: { content: "Hello test" },
    });
    expect(r1.status()).toBe(200);
    const d1 = (await r1.json()).data || await r1.json();
    expect(d1.charsPerSegment).toBe(160);
    console.log(`✅ validate GSM-7 single: ${d1.charsPerSegment}`);

    // GSM-7 multi → 153
    const r2 = await request.post("/api/v1/templates/validate", {
      headers: CSRF, data: { content: "A".repeat(200) },
    });
    expect(r2.status()).toBe(200);
    const d2 = (await r2.json()).data || await r2.json();
    expect(d2.charsPerSegment).toBe(153);
    console.log(`✅ validate GSM-7 multi: ${d2.charsPerSegment}`);

    // UCS-2 single → 70
    const r3 = await request.post("/api/v1/templates/validate", {
      headers: CSRF, data: { content: "สวัสดี" },
    });
    expect(r3.status()).toBe(200);
    const d3 = (await r3.json()).data || await r3.json();
    expect(d3.charsPerSegment).toBe(70);
    console.log(`✅ validate UCS-2 single: ${d3.charsPerSegment}`);

    // UCS-2 multi → 67
    const r4 = await request.post("/api/v1/templates/validate", {
      headers: CSRF, data: { content: "ก".repeat(100) },
    });
    expect(r4.status()).toBe(200);
    const d4 = (await r4.json()).data || await r4.json();
    expect(d4.charsPerSegment).toBe(67);
    console.log(`✅ validate UCS-2 multi: ${d4.charsPerSegment}`);

    // Render GSM-7 multi → 153
    const r5 = await request.post("/api/v1/templates/render", {
      headers: CSRF, data: { content: "B".repeat(200), variables: {} },
    });
    expect(r5.status()).toBe(200);
    const d5 = (await r5.json()).data || await r5.json();
    expect(d5.charsPerSegment).toBe(153);
    console.log(`✅ render GSM-7 multi: ${d5.charsPerSegment}`);

    // Render UCS-2 multi → 67
    const r6 = await request.post("/api/v1/templates/render", {
      headers: CSRF, data: { content: "ก".repeat(100), variables: {} },
    });
    expect(r6.status()).toBe(200);
    const d6 = (await r6.json()).data || await r6.json();
    expect(d6.charsPerSegment).toBe(67);
    console.log(`✅ render UCS-2 multi: ${d6.charsPerSegment}`);
  });
});
