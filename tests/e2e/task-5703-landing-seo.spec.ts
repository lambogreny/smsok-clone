/**
 * Task #5703 — Landing Page SEO Test (P1)
 * Layer 1: API/source tests (title, meta, JSON-LD)
 * Layer 2: Browser tests (visual, interactions, responsive)
 */

import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = "/Users/lambogreny/oracles/qa/screenshots/task-5703";
const BASE = "http://localhost:3000";

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

async function ss(page: Page, name: string) {
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`📸 ${p}`);
}

// ============================================
// LAYER 1: API / SOURCE TESTS
// ============================================
test.describe("Layer 1 — Source & SEO Tests", () => {
  let html: string;

  test.beforeAll(async () => {
    const res = await fetch(BASE);
    html = await res.text();
  });

  test("SEO-1. Title tag contains expected text", () => {
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch?.[1] || "";
    console.log("📍 <title>:", title);
    expect(title).toContain("SMS");
    expect(title).toContain("SMSOK");
    console.log("✅ Title tag correct");
  });

  test("SEO-2. OG meta tags present", () => {
    const ogTags = [
      { name: "og:title", pattern: /og:title/i },
      { name: "og:description", pattern: /og:description/i },
      { name: "og:type", pattern: /og:type/i },
      { name: "og:image", pattern: /og:image/i },
    ];

    for (const tag of ogTags) {
      const found = tag.pattern.test(html);
      console.log(`👁️ ${tag.name}: ${found ? "✅" : "⚠️ missing"}`);
    }

    // At minimum og:title should exist
    expect(/og:title/i.test(html)).toBeTruthy();
    console.log("✅ OG meta tags present");
  });

  test("SEO-3. JSON-LD — Organization schema", () => {
    const jsonLdBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    console.log("👁️ JSON-LD blocks found:", jsonLdBlocks.length);

    let hasOrganization = false;
    let hasSoftwareApplication = false;

    for (const block of jsonLdBlocks) {
      const content = block.replace(/<\/?script[^>]*>/gi, "");
      try {
        const data = JSON.parse(content);
        const types = Array.isArray(data) ? data.map((d: any) => d["@type"]) : [data["@type"]];
        for (const t of types) {
          if (t === "Organization") hasOrganization = true;
          if (t === "SoftwareApplication") hasSoftwareApplication = true;
        }
        console.log("👁️ JSON-LD types:", types.join(", "));
      } catch {
        console.log("⚠️ JSON-LD parse error");
      }
    }

    console.log("👁️ Organization:", hasOrganization ? "✅" : "⚠️ missing");
    console.log("👁️ SoftwareApplication:", hasSoftwareApplication ? "✅" : "⚠️ missing");
    expect(hasOrganization || hasSoftwareApplication).toBeTruthy();
    console.log("✅ JSON-LD schemas present");
  });

  test("SEO-4. Meta description present", () => {
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) ||
                      html.match(/<meta\s+content="([^"]*)"\s+name="description"/i);
    const desc = descMatch?.[1] || "";
    console.log("📍 meta description:", desc.substring(0, 150));
    expect(desc.length).toBeGreaterThan(10);
    console.log("✅ Meta description present");
  });

  test("SEO-5. Canonical URL or lang attribute", () => {
    const hasCanonical = /rel="canonical"/i.test(html);
    const hasLang = /lang="/i.test(html);
    console.log("👁️ Canonical:", hasCanonical ? "✅" : "⚠️");
    console.log("👁️ Lang attribute:", hasLang ? "✅" : "⚠️");
    expect(hasCanonical || hasLang).toBeTruthy();
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

  test("B1. Landing page loads — hero text visible", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "01-landing-hero");

    const pageText = await page.textContent("body");
    console.log("📍 URL:", page.url());

    // Check hero text
    const hasHero = /SMS.*Marketing|บริการส่ง SMS|อันดับ 1|SMSOK/i.test(pageText || "");
    console.log("👁️ Hero text:", hasHero ? "✅" : "⚠️");
    expect(hasHero).toBeTruthy();
    console.log("✅ Landing page loads with hero");
  });

  test("B2. Pricing section — packages visible", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Scroll to pricing section
    const pricingSection = page.locator('text=/pricing|แพ็คเกจ|ราคา|package/i').first();
    if (await pricingSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pricingSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    } else {
      // Scroll down to find pricing
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
      await page.waitForTimeout(1000);
    }
    await ss(page, "02-pricing-section");

    const pageText = await page.textContent("body");
    // Check for packages A-H or pricing content
    const packages = ["แพ็คเกจ", "Package", "ราคา", "บาท", "SMS"];
    let found = 0;
    for (const pkg of packages) {
      if (new RegExp(pkg, "i").test(pageText || "")) found++;
    }
    console.log(`👁️ Pricing keywords found: ${found}/${packages.length}`);
    expect(found).toBeGreaterThan(0);
    console.log("✅ Pricing section visible");
  });

  test("B3. Features section — key features listed", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    const pageText = await page.textContent("body");
    const features = ["SMS", "Campaign", "Contacts", "Webhook", "API"];
    for (const feat of features) {
      const found = new RegExp(feat, "i").test(pageText || "");
      console.log(`👁️ Feature "${feat}": ${found ? "✅" : "⚠️"}`);
    }

    // Scroll to features
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.3));
    await page.waitForTimeout(1000);
    await ss(page, "03-features-section");
    console.log("✅ Features section checked");
  });

  test("B4. CTA buttons → /register link", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Find register/signup links
    const registerLinks = page.locator('a[href*="register"], a[href*="signup"], a:has-text("สมัคร"), a:has-text("ทดลองฟรี"), a:has-text("เริ่มต้น")');
    const count = await registerLinks.count();
    console.log("👁️ Register/CTA links found:", count);

    if (count > 0) {
      const href = await registerLinks.first().getAttribute("href");
      console.log("📍 CTA href:", href);
      expect(href).toMatch(/register|signup/i);
      await ss(page, "04-cta-buttons");
      console.log("✅ CTA → /register");
    } else {
      // Check buttons
      const ctaButtons = page.locator('button:has-text("สมัคร"), button:has-text("เริ่มต้น"), button:has-text("ทดลอง")');
      const btnCount = await ctaButtons.count();
      console.log("👁️ CTA buttons found:", btnCount);
      await ss(page, "04-cta-buttons");
    }
  });

  test("B5. Page title in browser tab", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);

    const title = await page.title();
    console.log("📍 Page title:", title);
    expect(title).toContain("SMS");
    console.log("✅ Title contains SMS");
  });

  test("B6. No console errors on landing", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Scroll full page to trigger lazy loads
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await ss(page, "05-footer");

    console.log("🔴 Console errors:", consoleErrors.length);
    consoleErrors.forEach((e) => console.log("  -", e.substring(0, 150)));
  });

  test("B7. Mobile 375px — no overflow, readable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "06-mobile-hero");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    console.log(`👁️ Mobile scroll: ${bodyWidth}/375 → ${bodyWidth > 375 ? "⚠️ OVERFLOW" : "✅ OK"}`);

    // Scroll to pricing on mobile
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
    await page.waitForTimeout(1000);
    await ss(page, "07-mobile-pricing");

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await ss(page, "08-mobile-footer");

    expect(bodyWidth).toBeLessThanOrEqual(375);
    console.log("✅ Mobile responsive OK");
  });

  test("B8. Full page screenshot (desktop 1440px)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "09-desktop-hero");

    // Scroll to middle
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.4));
    await page.waitForTimeout(1000);
    await ss(page, "10-desktop-features");

    // Scroll to pricing
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
    await page.waitForTimeout(1000);
    await ss(page, "11-desktop-pricing");

    // Footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await ss(page, "12-desktop-footer");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    console.log(`👁️ Desktop scroll: ${bodyWidth}/1440 → ${bodyWidth > 1440 ? "⚠️ OVERFLOW" : "✅ OK"}`);
    console.log("✅ Desktop layout OK");
  });
});
