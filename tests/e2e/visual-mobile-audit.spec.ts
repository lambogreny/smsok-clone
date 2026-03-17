import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS = path.join(__dirname, "..", "screenshots", "visual-audit");

// Nansen DNA expected values
const DNA = {
  bgDark: "rgb(11, 17, 24)",       // #0b1118
  cardBg: "rgb(16, 22, 28)",       // #10161c
  border: "rgb(32, 37, 44)",       // #20252c
  accent: "rgb(0, 226, 181)",      // #00E2B5
  accentAlt: "rgb(0, 186, 149)",   // close variant
};

const PAGES = [
  { url: "/dashboard", name: "dashboard", expect: "ภาพรวม" },
  { url: "/dashboard/send", name: "send-sms", expect: "ส่ง SMS" },
  { url: "/dashboard/history", name: "history", expect: "" },
  { url: "/dashboard/otp", name: "otp", expect: "" },
  { url: "/dashboard/templates", name: "templates", expect: "เทมเพลต" },
  { url: "/dashboard/campaigns", name: "campaigns", expect: "" },
  { url: "/dashboard/contacts", name: "contacts", expect: "" },
  { url: "/dashboard/contacts/groups", name: "groups", expect: "" },
  { url: "/dashboard/contacts/tags", name: "tags", expect: "" },
  { url: "/dashboard/senders", name: "senders", expect: "" },
  { url: "/dashboard/packages", name: "packages", expect: "" },
  { url: "/dashboard/billing", name: "billing", expect: "" },
  { url: "/dashboard/api-keys", name: "api-keys", expect: "" },
  { url: "/dashboard/api-docs", name: "api-docs", expect: "" },
  { url: "/dashboard/reports", name: "reports", expect: "" },
  { url: "/dashboard/settings", name: "settings", expect: "" },
  { url: "/dashboard/support", name: "support", expect: "" },
];

test.describe("Visual QA + Mobile Responsive Audit", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });
  });

  test("Desktop visual audit — all pages", async ({ page }) => {
    const consoleErrors: { page: string; error: string }[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push({ page: page.url(), error: msg.text() });
      }
    });

    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click({ force: true });
        await page.waitForTimeout(300);
      }
    }

    // Desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    const results: { name: string; bgOk: boolean; fontOk: boolean; accentFound: boolean; noHScroll: boolean }[] = [];

    for (const p of PAGES) {
      await page.goto(p.url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await dismissCookies();

      // Screenshot desktop
      await page.screenshot({
        path: path.join(SCREENSHOTS, `desktop-${p.name}.png`),
        fullPage: true,
      });

      // --- Visual DNA checks ---
      const checks = await page.evaluate(() => {
        const body = document.body;
        const bodyBg = getComputedStyle(body).backgroundColor;

        // Find main/content area background
        const main = document.querySelector("main") || document.querySelector('[class*="content"]') || body;
        const mainBg = getComputedStyle(main).backgroundColor;

        // Check font family
        const bodyFont = getComputedStyle(body).fontFamily;

        // Check for accent color (look for green buttons/links)
        const allElements = document.querySelectorAll("button, a, [class*='badge'], [class*='accent'], [class*='primary']");
        let accentFound = false;
        for (const el of allElements) {
          const bg = getComputedStyle(el).backgroundColor;
          const color = getComputedStyle(el).color;
          if (bg.includes("0, 226, 181") || bg.includes("0, 186, 149") || bg.includes("16, 185, 129") ||
              color.includes("0, 226, 181") || color.includes("0, 186, 149")) {
            accentFound = true;
            break;
          }
        }

        // Check cards
        const cards = document.querySelectorAll('[class*="card"], [class*="Card"]');
        let cardBgs: string[] = [];
        cards.forEach(c => cardBgs.push(getComputedStyle(c).backgroundColor));

        // Check horizontal scroll
        const noHScroll = document.documentElement.scrollWidth <= document.documentElement.clientWidth;

        return {
          bodyBg,
          mainBg,
          bodyFont,
          accentFound,
          cardBgs: cardBgs.slice(0, 5),
          noHScroll,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        };
      });

      const bgOk = checks.bodyBg.includes("11, 17, 24") || checks.mainBg.includes("11, 17, 24") ||
                    checks.bodyBg.includes("0, 0, 0") || checks.bodyBg.includes("15,") || checks.bodyBg.includes("10,");
      const fontOk = checks.bodyFont.toLowerCase().includes("inter") ||
                     checks.bodyFont.toLowerCase().includes("ibm") ||
                     checks.bodyFont.toLowerCase().includes("plex");

      results.push({
        name: p.name,
        bgOk,
        fontOk,
        accentFound: checks.accentFound,
        noHScroll: checks.noHScroll,
      });

      console.log(
        `${bgOk ? "✅" : "⚠️"} ${p.name}: bg=${checks.bodyBg.substring(0, 30)} | ` +
        `font=${fontOk ? "OK" : checks.bodyFont.substring(0, 30)} | ` +
        `accent=${checks.accentFound ? "✅" : "—"} | ` +
        `hScroll=${checks.noHScroll ? "none ✅" : `⚠️ ${checks.scrollWidth}>${checks.clientWidth}`}`
      );

      if (checks.cardBgs.length > 0) {
        console.log(`   Cards: ${checks.cardBgs.slice(0, 3).join(", ")}`);
      }
    }

    // Summary
    console.log("\n=== DESKTOP VISUAL SUMMARY ===");
    const bgPass = results.filter(r => r.bgOk).length;
    const fontPass = results.filter(r => r.fontOk).length;
    const scrollOk = results.filter(r => r.noHScroll).length;
    console.log(`📊 Background: ${bgPass}/${results.length} match DNA`);
    console.log(`📊 Font: ${fontPass}/${results.length} use Inter/IBM Plex`);
    console.log(`📊 No horizontal scroll: ${scrollOk}/${results.length}`);

    // Console errors summary
    const significant = consoleErrors.filter(e =>
      !e.error.includes("favicon") && !e.error.includes("hydration") && !e.error.includes("third-party") &&
      !e.error.includes("ERR_BLOCKED")
    );
    console.log(`\n=== CONSOLE ERRORS (${significant.length}) ===`);
    if (significant.length > 0) {
      significant.slice(0, 10).forEach(e => console.log(`  ❌ [${e.page.split("/").pop()}] ${e.error.substring(0, 150)}`));
    } else {
      console.log("✅ No significant console errors across all pages");
    }
  });

  test("Mobile 375px audit — all pages", async ({ page }) => {
    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click({ force: true });
        await page.waitForTimeout(300);
      }
    }

    await page.setViewportSize({ width: 375, height: 812 });

    const mobileResults: { name: string; noHScroll: boolean; sidebarHidden: boolean }[] = [];

    for (const p of PAGES) {
      await page.goto(p.url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await dismissCookies();

      await page.screenshot({
        path: path.join(SCREENSHOTS, `mobile-375-${p.name}.png`),
        fullPage: true,
      });

      const checks = await page.evaluate(() => {
        const noHScroll = document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;

        // Check sidebar visibility
        const sidebar = document.querySelector('nav, aside, [class*="sidebar"], [class*="Sidebar"]');
        let sidebarHidden = true;
        if (sidebar) {
          const rect = sidebar.getBoundingClientRect();
          const style = getComputedStyle(sidebar);
          sidebarHidden = rect.width === 0 || style.display === "none" ||
                         style.visibility === "hidden" || rect.left < -100 ||
                         style.transform.includes("translateX(-");
        }

        // Check touch targets (buttons < 44px)
        const buttons = document.querySelectorAll("button, a, input[type='submit']");
        let smallTargets = 0;
        buttons.forEach(b => {
          const rect = b.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.height < 36 || rect.width < 36)) {
            smallTargets++;
          }
        });

        // Check tables overflow
        const tables = document.querySelectorAll("table, [class*='table']");
        let tableOverflow = false;
        tables.forEach(t => {
          if (t.scrollWidth > 375) tableOverflow = true;
        });

        return {
          noHScroll,
          sidebarHidden,
          smallTargets,
          tableOverflow,
          scrollWidth: document.documentElement.scrollWidth,
        };
      });

      mobileResults.push({
        name: p.name,
        noHScroll: checks.noHScroll,
        sidebarHidden: checks.sidebarHidden,
      });

      console.log(
        `${checks.noHScroll ? "✅" : "⚠️"} ${p.name}: ` +
        `hScroll=${checks.noHScroll ? "none" : `⚠️ w=${checks.scrollWidth}`} | ` +
        `sidebar=${checks.sidebarHidden ? "collapsed ✅" : "visible ⚠️"} | ` +
        `smallTargets=${checks.smallTargets} | ` +
        `tableOverflow=${checks.tableOverflow ? "⚠️" : "OK"}`
      );
    }

    // Summary
    console.log("\n=== MOBILE 375px SUMMARY ===");
    const scrollOk = mobileResults.filter(r => r.noHScroll).length;
    const sidebarOk = mobileResults.filter(r => r.sidebarHidden).length;
    console.log(`📊 No horizontal scroll: ${scrollOk}/${mobileResults.length}`);
    console.log(`📊 Sidebar collapsed: ${sidebarOk}/${mobileResults.length}`);
  });

  test("Mobile 390px audit — key pages", async ({ page }) => {
    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click({ force: true });
        await page.waitForTimeout(300);
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });

    const keyPages = PAGES.slice(0, 8); // First 8 key pages
    for (const p of keyPages) {
      await page.goto(p.url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await dismissCookies();

      await page.screenshot({
        path: path.join(SCREENSHOTS, `mobile-390-${p.name}.png`),
        fullPage: true,
      });

      const noHScroll = await page.evaluate(() =>
        document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
      );
      console.log(`${noHScroll ? "✅" : "⚠️"} 390px ${p.name}: ${noHScroll ? "OK" : "horizontal scroll!"}`);
    }
  });
});
