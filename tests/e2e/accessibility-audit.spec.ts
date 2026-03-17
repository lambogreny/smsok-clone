import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS = path.join(__dirname, "..", "screenshots", "accessibility");

const KEY_PAGES = [
  { url: "/dashboard", name: "dashboard" },
  { url: "/dashboard/send", name: "send-sms" },
  { url: "/dashboard/contacts", name: "contacts" },
  { url: "/dashboard/templates", name: "templates" },
  { url: "/dashboard/campaigns", name: "campaigns" },
  { url: "/dashboard/packages", name: "packages" },
  { url: "/dashboard/settings", name: "settings" },
  { url: "/dashboard/support", name: "support" },
  { url: "/login", name: "login" },
];

test.describe("Accessibility Audit", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });
  });

  test("Tab navigation + Focus ring — key pages", async ({ page }) => {
    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click({ force: true });
        await page.waitForTimeout(300);
      }
    }

    console.log("\n=== ACCESSIBILITY: Tab Navigation + Focus Ring ===");

    for (const p of KEY_PAGES) {
      await page.goto(p.url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await dismissCookies();

      // Press Tab multiple times and check focus
      const focusResults = await page.evaluate(async () => {
        const results: { tag: string; text: string; hasFocusRing: boolean; isVisible: boolean }[] = [];

        // Simulate tab presses by finding all focusable elements
        const focusable = document.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        let count = 0;
        for (const el of focusable) {
          if (count >= 10) break;
          const htmlEl = el as HTMLElement;
          htmlEl.focus();

          const style = getComputedStyle(htmlEl);
          const outlineStyle = style.outline;
          const boxShadow = style.boxShadow;
          const borderColor = style.borderColor;

          // Check if there's a visible focus indicator
          const hasFocusRing =
            (outlineStyle !== "none" && outlineStyle !== "" && !outlineStyle.includes("0px")) ||
            (boxShadow !== "none" && boxShadow !== "") ||
            borderColor.includes("0, 226, 181") || // accent color
            borderColor.includes("59, 130, 246"); // blue focus

          const rect = htmlEl.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight;

          if (isVisible) {
            results.push({
              tag: htmlEl.tagName.toLowerCase(),
              text: (htmlEl.textContent || htmlEl.getAttribute("placeholder") || htmlEl.getAttribute("aria-label") || "").trim().substring(0, 30),
              hasFocusRing,
              isVisible,
            });
            count++;
          }
        }

        return {
          totalFocusable: focusable.length,
          results,
        };
      });

      const withRing = focusResults.results.filter(r => r.hasFocusRing).length;
      const total = focusResults.results.length;
      console.log(
        `${withRing >= total * 0.5 ? "✅" : "⚠️"} ${p.name}: ${focusResults.totalFocusable} focusable, ${withRing}/${total} have focus ring`
      );

      // Screenshot with focus on first interactive element
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.screenshot({ path: path.join(SCREENSHOTS, `tab-${p.name}.png`), fullPage: false });
    }
  });

  test("Form labels + ARIA — forms audit", async ({ page }) => {
    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click({ force: true });
        await page.waitForTimeout(300);
      }
    }

    console.log("\n=== ACCESSIBILITY: Form Labels + ARIA ===");

    const formPages = [
      { url: "/login", name: "login" },
      { url: "/register", name: "register" },
      { url: "/dashboard/send", name: "send-sms" },
      { url: "/dashboard/settings", name: "settings" },
      { url: "/dashboard/contacts", name: "contacts" },
    ];

    for (const p of formPages) {
      await page.goto(p.url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await dismissCookies();

      const labelAudit = await page.evaluate(() => {
        const inputs = document.querySelectorAll("input:not([type='hidden']), textarea, select");
        const results: { type: string; name: string; hasLabel: boolean; labelMethod: string }[] = [];

        for (const input of inputs) {
          const htmlInput = input as HTMLInputElement;
          const rect = htmlInput.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;

          let hasLabel = false;
          let labelMethod = "none";

          // Check for associated label
          if (htmlInput.id) {
            const label = document.querySelector(`label[for="${htmlInput.id}"]`);
            if (label) { hasLabel = true; labelMethod = "label[for]"; }
          }

          // Check for wrapping label
          if (!hasLabel && htmlInput.closest("label")) {
            hasLabel = true;
            labelMethod = "wrapping label";
          }

          // Check aria-label
          if (!hasLabel && htmlInput.getAttribute("aria-label")) {
            hasLabel = true;
            labelMethod = "aria-label";
          }

          // Check aria-labelledby
          if (!hasLabel && htmlInput.getAttribute("aria-labelledby")) {
            hasLabel = true;
            labelMethod = "aria-labelledby";
          }

          // Check placeholder (weak but acceptable)
          if (!hasLabel && htmlInput.placeholder) {
            hasLabel = true;
            labelMethod = "placeholder only";
          }

          results.push({
            type: htmlInput.type || htmlInput.tagName.toLowerCase(),
            name: htmlInput.name || htmlInput.id || htmlInput.placeholder || "unknown",
            hasLabel,
            labelMethod,
          });
        }

        return results;
      });

      const labeled = labelAudit.filter(r => r.hasLabel).length;
      const total = labelAudit.length;
      console.log(`${labeled === total ? "✅" : "⚠️"} ${p.name}: ${labeled}/${total} inputs have labels`);

      for (const input of labelAudit) {
        if (!input.hasLabel) {
          console.log(`   ❌ Missing label: ${input.type} [${input.name}]`);
        } else if (input.labelMethod === "placeholder only") {
          console.log(`   ⚠️ Placeholder only: ${input.type} [${input.name}]`);
        }
      }

      await page.screenshot({ path: path.join(SCREENSHOTS, `form-${p.name}.png`), fullPage: true });
    }
  });

  test("Error messages — form validation display", async ({ page }) => {
    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click({ force: true });
        await page.waitForTimeout(300);
      }
    }

    console.log("\n=== ACCESSIBILITY: Error Messages ===");

    // Login — submit empty form
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();

    // Try submitting with wrong credentials
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill("wrong@test.com");
      await passwordInput.fill("wrongpassword");

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(SCREENSHOTS, "error-login.png"), fullPage: true });

        const bodyText = await page.locator("body").innerText();
        const hasThaiError = bodyText.includes("ไม่ถูกต้อง") || bodyText.includes("ผิดพลาด") || bodyText.includes("ไม่พบ");
        console.log(`${hasThaiError ? "✅" : "⚠️"} Login error: ${hasThaiError ? "Thai error message shown" : "no visible error"}`);

        // Check error is not technical
        const hasTechnical = bodyText.includes("stack") || bodyText.includes("TypeError") || bodyText.includes("undefined");
        console.log(`${hasTechnical ? "❌" : "✅"} Login error: ${hasTechnical ? "leaks technical info" : "no technical leak"}`);
      }
    }

    // Send SMS — submit empty form
    await page.goto("/dashboard/send", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();

    const sendBtn = page.locator('button:has-text("ส่ง SMS"), button:has-text("ส่ง")').first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Try clicking send without filling anything
      const isDisabled = await sendBtn.isDisabled();
      if (isDisabled) {
        console.log("✅ Send SMS: Button disabled when form empty (good UX)");
      } else {
        await sendBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(SCREENSHOTS, "error-send-sms.png"), fullPage: true });
        const errorText = await page.locator("body").innerText();
        const hasValidation = errorText.includes("กรุณา") || errorText.includes("จำเป็น") || errorText.includes("required");
        console.log(`${hasValidation ? "✅" : "⚠️"} Send SMS: ${hasValidation ? "validation shown" : "no validation visible"}`);
      }
    }

    // Register — check validation
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();
    await page.screenshot({ path: path.join(SCREENSHOTS, "error-register.png"), fullPage: true });

    const regSubmit = page.locator('button[type="submit"]').first();
    if (await regSubmit.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isDisabled = await regSubmit.isDisabled();
      console.log(`${isDisabled ? "✅" : "⚠️"} Register: Submit ${isDisabled ? "disabled when empty" : "enabled when empty"}`);
    }
  });

  test("Loading states — button feedback", async ({ page }) => {
    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click({ force: true });
        await page.waitForTimeout(300);
      }
    }

    console.log("\n=== ACCESSIBILITY: Loading States ===");

    // Check pages with submit buttons for loading/spinner indicators
    const pagesWithForms = [
      { url: "/dashboard/send", name: "send-sms" },
      { url: "/dashboard/settings", name: "settings" },
      { url: "/dashboard/templates", name: "templates" },
    ];

    for (const p of pagesWithForms) {
      await page.goto(p.url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await dismissCookies();

      const loadingCheck = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button[type="submit"], button');
        let hasLoadingPattern = false;

        for (const btn of buttons) {
          const text = btn.textContent || "";
          const hasSpinner = btn.querySelector('svg[class*="animate"], [class*="spinner"], [class*="loading"]');
          const hasDisabledAttr = btn.hasAttribute("disabled");
          const ariaLabel = btn.getAttribute("aria-busy") || btn.getAttribute("aria-label");

          if (hasSpinner || ariaLabel?.includes("loading")) {
            hasLoadingPattern = true;
          }
        }

        // Check for any loading/skeleton elements on page
        const skeletons = document.querySelectorAll('[class*="skeleton"], [class*="Skeleton"], [class*="animate-pulse"]');

        return {
          hasLoadingPattern,
          skeletonCount: skeletons.length,
        };
      });

      console.log(`📊 ${p.name}: loading patterns=${loadingCheck.hasLoadingPattern ? "yes" : "no"}, skeletons=${loadingCheck.skeletonCount}`);
    }

    // Check dashboard for loading states (KPI cards)
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    // Don't wait for networkidle — check immediately for loading states
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS, "loading-dashboard.png"), fullPage: true });

    const dashLoading = await page.evaluate(() => {
      const pulses = document.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"]');
      return pulses.length;
    });
    console.log(`📊 Dashboard loading skeletons: ${dashLoading}`);

    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(SCREENSHOTS, "loaded-dashboard.png"), fullPage: true });
    console.log("✅ Dashboard loaded state captured");
  });

  test("Color contrast + text readability", async ({ page }) => {
    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click({ force: true });
        await page.waitForTimeout(300);
      }
    }

    console.log("\n=== ACCESSIBILITY: Color Contrast ===");

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();

    const contrastCheck = await page.evaluate(() => {
      function getLuminance(r: number, g: number, b: number) {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }

      function parseColor(color: string): [number, number, number] | null {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        return null;
      }

      function getContrastRatio(fg: [number, number, number], bg: [number, number, number]) {
        const l1 = getLuminance(...fg);
        const l2 = getLuminance(...bg);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      }

      const textElements = document.querySelectorAll("p, span, h1, h2, h3, h4, h5, h6, label, td, th, a, button");
      let lowContrast = 0;
      let checked = 0;
      const issues: string[] = [];

      for (const el of textElements) {
        const rect = (el as HTMLElement).getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (checked >= 50) break;

        const style = getComputedStyle(el);
        const fg = parseColor(style.color);
        const bg = parseColor(style.backgroundColor);

        if (fg && bg && bg[0] + bg[1] + bg[2] > 0) {
          const ratio = getContrastRatio(fg, bg);
          checked++;
          if (ratio < 3) {
            lowContrast++;
            issues.push(`${el.tagName}:"${(el.textContent || "").trim().substring(0, 20)}" ratio=${ratio.toFixed(1)}`);
          }
        }
      }

      return { checked, lowContrast, issues: issues.slice(0, 5) };
    });

    console.log(`📊 Checked ${contrastCheck.checked} elements, ${contrastCheck.lowContrast} low contrast`);
    if (contrastCheck.issues.length > 0) {
      contrastCheck.issues.forEach(i => console.log(`  ⚠️ ${i}`));
    } else {
      console.log("✅ No critical contrast issues found");
    }
  });
});
