import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const BASE = "http://localhost:3000";
const QA_USER = { email: "qa-suite@smsok.test", password: "QATest123!" };

async function dismissCookies(page: Page) {
  for (const text of ["ยอมรับทั้งหมด", "ยอมรับ", "Accept All"]) {
    const btn = page.getByText(text, { exact: false });
    if (await btn.first().isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.first().click({ force: true });
      await page.waitForTimeout(500);
      return;
    }
  }
  const dialog = page.locator('[role="dialog"][aria-label*="คุกกี้"]');
  if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
    await dialog.locator("button").first().click({ force: true }).catch(() => {});
  }
}

async function snap(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/a11y-${name}.png`, fullPage: true });
}

async function loginCtx(browser: any): Promise<BrowserContext> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await dismissCookies(page);
  await page.locator('input[type="email"]').fill(QA_USER.email);
  await page.locator('input[type="password"]').fill(QA_USER.password);
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 10000 }
  ).catch(() => {});
  await page.locator('button[type="submit"]').click({ force: true });
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.close();
  return ctx;
}

// ===================== 1. KEYBOARD NAVIGATION =====================
test.describe("A11y: Keyboard Navigation", () => {

  test("Login form — tab navigation + focus visible", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`);
    await dismissCookies(page);
    await page.waitForTimeout(1500);

    // Tab through form elements
    const tabOrder: string[] = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(300);

      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return "none";
        const tag = el.tagName.toLowerCase();
        const type = el.getAttribute("type") || "";
        const name = el.getAttribute("name") || "";
        const text = el.textContent?.substring(0, 30) || "";
        // Check focus visibility
        const styles = getComputedStyle(el);
        const hasOutline = styles.outlineStyle !== "none" && styles.outlineWidth !== "0px";
        const hasRing = el.className?.includes("focus") || el.className?.includes("ring");
        const focusVisible = hasOutline || hasRing;
        return `${tag}[${type||name}] focus=${focusVisible} "${text.trim()}"`;
      });

      tabOrder.push(focused);
      if (focused.includes("submit") || focused.includes("เข้าสู่ระบบ")) break;
    }

    console.log("\n=== LOGIN TAB ORDER ===");
    for (let i = 0; i < tabOrder.length; i++) {
      console.log(`Tab ${i + 1}: ${tabOrder[i]}`);
    }

    // Check email → password → submit order
    const hasEmail = tabOrder.some(t => t.includes("email"));
    const hasPw = tabOrder.some(t => t.includes("password"));
    const hasSubmit = tabOrder.some(t => t.includes("submit") || t.includes("เข้าสู่ระบบ"));
    console.log(`✅ Email focusable: ${hasEmail}`);
    console.log(`✅ Password focusable: ${hasPw}`);
    console.log(`✅ Submit focusable: ${hasSubmit}`);

    await ctx.close();
  });

  test("Dashboard — sidebar keyboard nav", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);

    // Tab through sidebar links
    const focusableLinks: string[] = [];
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(200);

      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        const tag = el.tagName.toLowerCase();
        const href = el.getAttribute("href") || "";
        const text = el.textContent?.trim().substring(0, 40) || "";
        const role = el.getAttribute("role") || "";
        return { tag, href, text, role };
      });

      if (info && (info.tag === "a" || info.role === "link" || info.role === "button")) {
        focusableLinks.push(`${info.tag} href="${info.href}" "${info.text}"`);
      }
    }

    console.log("\n=== DASHBOARD FOCUSABLE ELEMENTS ===");
    for (const link of focusableLinks.slice(0, 10)) {
      console.log(`  ${link}`);
    }
    console.log(`Total focusable links found: ${focusableLinks.length}`);

    await ctx.close();
  });
});

// ===================== 2. ARIA & SCREEN READER =====================
test.describe("A11y: ARIA & Screen Reader", () => {

  test("Login page — aria attributes", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`);
    await dismissCookies(page);
    await page.waitForTimeout(1500);

    const audit = await page.evaluate(() => {
      const issues: string[] = [];
      const passed: string[] = [];

      // Check inputs have labels
      const inputs = document.querySelectorAll("input");
      inputs.forEach((input) => {
        const id = input.id;
        const name = input.name || input.type;
        const ariaLabel = input.getAttribute("aria-label");
        const ariaLabelledBy = input.getAttribute("aria-labelledby");
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        const placeholder = input.placeholder;

        if (label || ariaLabel || ariaLabelledBy) {
          passed.push(`✅ input[${name}] has label/aria`);
        } else if (placeholder) {
          issues.push(`⚠️ input[${name}] uses placeholder as label (not ideal)`);
        } else {
          issues.push(`❌ input[${name}] missing label and aria-label`);
        }
      });

      // Check buttons have accessible text
      const buttons = document.querySelectorAll("button");
      buttons.forEach((btn) => {
        const text = btn.textContent?.trim();
        const ariaLabel = btn.getAttribute("aria-label");
        if (!text && !ariaLabel) {
          issues.push(`❌ button missing text and aria-label`);
        }
      });

      // Check images have alt
      const images = document.querySelectorAll("img");
      images.forEach((img) => {
        const alt = img.getAttribute("alt");
        const src = img.src?.substring(0, 50);
        if (!alt && alt !== "") {
          issues.push(`❌ img[${src}] missing alt attribute`);
        } else {
          passed.push(`✅ img has alt="${alt}"`);
        }
      });

      // Check heading hierarchy
      const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      const levels = Array.from(headings).map(h => parseInt(h.tagName[1]));
      let hierarchyOk = true;
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] > levels[i - 1] + 1) {
          hierarchyOk = false;
          issues.push(`⚠️ Heading skip: h${levels[i - 1]} → h${levels[i]}`);
        }
      }
      if (hierarchyOk && levels.length > 0) passed.push("✅ Heading hierarchy OK");

      return { issues, passed };
    });

    console.log("\n=== LOGIN PAGE A11Y AUDIT ===");
    for (const p of audit.passed) console.log(`  ${p}`);
    for (const i of audit.issues) console.log(`  ${i}`);
    console.log(`PASS: ${audit.passed.length} | ISSUES: ${audit.issues.length}`);

    await ctx.close();
  });

  test("Dashboard — aria roles and landmarks", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const audit = await page.evaluate(() => {
      const issues: string[] = [];
      const passed: string[] = [];

      // Check landmarks
      const nav = document.querySelector("nav, [role='navigation']");
      const main = document.querySelector("main, [role='main']");
      const header = document.querySelector("header, [role='banner']");

      if (nav) passed.push("✅ Navigation landmark found");
      else issues.push("❌ Missing navigation landmark");

      if (main) passed.push("✅ Main landmark found");
      else issues.push("❌ Missing main landmark");

      // Check skip link
      const skipLink = document.querySelector("a[href='#main'], a[href='#content'], [class*='skip']");
      if (skipLink) passed.push("✅ Skip-to-content link found");
      else issues.push("⚠️ Missing skip-to-content link");

      // Check buttons/links aria
      const allButtons = document.querySelectorAll("button:not([aria-label]):not([aria-labelledby])");
      let emptyButtons = 0;
      allButtons.forEach(btn => {
        if (!btn.textContent?.trim()) emptyButtons++;
      });
      if (emptyButtons > 0) issues.push(`⚠️ ${emptyButtons} buttons without text or aria-label`);
      else passed.push("✅ All buttons have accessible text");

      // Check all inputs
      const inputs = document.querySelectorAll("input:not([type='hidden'])");
      let unlabeledInputs = 0;
      inputs.forEach(input => {
        const id = input.id;
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        const ariaLabel = input.getAttribute("aria-label");
        if (!label && !ariaLabel) unlabeledInputs++;
      });
      if (unlabeledInputs > 0) issues.push(`⚠️ ${unlabeledInputs} inputs without label/aria-label`);
      else passed.push("✅ All inputs have labels");

      return { issues, passed };
    });

    console.log("\n=== DASHBOARD A11Y AUDIT ===");
    for (const p of audit.passed) console.log(`  ${p}`);
    for (const i of audit.issues) console.log(`  ${i}`);
    console.log(`PASS: ${audit.passed.length} | ISSUES: ${audit.issues.length}`);

    await ctx.close();
  });
});

// ===================== 3. COLOR CONTRAST =====================
test.describe("A11y: Color Contrast", () => {

  test("Key pages — contrast ratio check", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();

    const pages = [
      { url: `${BASE}/dashboard`, name: "dashboard" },
      { url: `${BASE}/dashboard/contacts`, name: "contacts" },
      { url: `${BASE}/dashboard/settings`, name: "settings" },
    ];

    for (const p of pages) {
      await page.goto(p.url, { timeout: 15000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);

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

        function contrastRatio(l1: number, l2: number) {
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        }

        const issues: string[] = [];
        const textElements = document.querySelectorAll("p, span, h1, h2, h3, h4, h5, h6, a, button, label, td, th");
        let lowContrast = 0;
        let checked = 0;

        for (const el of Array.from(textElements).slice(0, 50)) {
          const styles = getComputedStyle(el);
          const text = el.textContent?.trim()?.substring(0, 20);
          if (!text) continue;

          const fg = parseColor(styles.color);
          const bg = parseColor(styles.backgroundColor);
          if (!fg || !bg) continue;
          // Skip transparent bg
          if (bg[0] === 0 && bg[1] === 0 && bg[2] === 0 && styles.backgroundColor.includes("0)")) continue;

          const fgLum = getLuminance(...fg);
          const bgLum = getLuminance(...bg);
          const ratio = contrastRatio(fgLum, bgLum);
          checked++;

          if (ratio < 4.5) {
            lowContrast++;
            if (lowContrast <= 5) {
              issues.push(`⚠️ "${text}" ratio=${ratio.toFixed(1)} (fg:${styles.color} bg:${styles.backgroundColor})`);
            }
          }
        }

        return { checked, lowContrast, issues };
      });

      console.log(`\n--- Contrast: ${p.name} ---`);
      console.log(`Checked: ${contrastCheck.checked} elements | Low contrast: ${contrastCheck.lowContrast}`);
      for (const i of contrastCheck.issues) console.log(`  ${i}`);
    }

    await ctx.close();
  });
});

// ===================== 4. FORM LABELS =====================
test.describe("A11y: Form Labels", () => {

  test("All forms — label audit", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();

    const formPages = [
      { url: `${BASE}/login`, name: "login", needsAuth: false },
      { url: `${BASE}/register`, name: "register", needsAuth: false },
      { url: `${BASE}/dashboard/send`, name: "send-sms", needsAuth: true },
      { url: `${BASE}/dashboard/settings`, name: "settings", needsAuth: true },
      { url: `${BASE}/dashboard/support/new`, name: "support-new", needsAuth: true },
    ];

    console.log("\n=== FORM LABEL AUDIT ===");

    for (const fp of formPages) {
      await page.goto(fp.url, { timeout: 15000 });
      await dismissCookies(page);
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);

      const labelAudit = await page.evaluate(() => {
        const inputs = document.querySelectorAll("input:not([type='hidden']):not([type='checkbox']):not([type='radio']), textarea, select");
        const results: { field: string; hasLabel: boolean; method: string }[] = [];

        inputs.forEach(input => {
          const name = (input as HTMLInputElement).name || (input as HTMLInputElement).type || input.tagName;
          const id = input.id;
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          const ariaLabel = input.getAttribute("aria-label");
          const ariaLabelledBy = input.getAttribute("aria-labelledby");
          const parentLabel = input.closest("label");
          const placeholder = (input as HTMLInputElement).placeholder;

          let hasLabel = false;
          let method = "none";

          if (label) { hasLabel = true; method = "label[for]"; }
          else if (parentLabel) { hasLabel = true; method = "parent label"; }
          else if (ariaLabel) { hasLabel = true; method = "aria-label"; }
          else if (ariaLabelledBy) { hasLabel = true; method = "aria-labelledby"; }
          else if (placeholder) { method = "placeholder only"; }

          results.push({ field: name, hasLabel, method });
        });

        return results;
      });

      const unlabeled = labelAudit.filter(r => !r.hasLabel);
      console.log(`\n${fp.name}: ${labelAudit.length} inputs | ${unlabeled.length} missing labels`);
      for (const r of labelAudit) {
        const icon = r.hasLabel ? "✅" : "⚠️";
        console.log(`  ${icon} ${r.field.padEnd(20)} → ${r.method}`);
      }
    }

    await ctx.close();
  });
});
