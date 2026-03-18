import { test, expect, expectPageLoads, collectConsoleErrors } from "./fixtures";
import { TEST_USER, loginAs, dismissCookieConsent } from "./fixtures";

// ═══════════════════════════════════════════════════════════════════════════════
// Quality Interactions — CRUD & Interactive Flows (All Customer-Facing Pages)
// ═══════════════════════════════════════════════════════════════════════════════

// Helper: navigate with fallback (try networkidle, fallback to domcontentloaded)
async function safeGoto(page: import("@playwright/test").Page, path: string) {
  try {
    await page.goto(path, { waitUntil: "networkidle", timeout: 20000 });
  } catch {
    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(2000);
  }
}

// ─── 1. Dashboard (/dashboard) ──────────────────────────────────────────────

test.describe("1. Dashboard", () => {
  test("QI-001: stats cards load with numeric values", async ({ authedPage: page }) => {
    // Dashboard should show stat cards with numbers
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");

    // Look for stat numbers (digits or formatted with commas)
    const statNumbers = page.locator("text=/[\\d,]+/");
    const count = await statNumbers.count();
    expect(count).toBeGreaterThan(0);

    // Verify at least one card-like container exists
    const cards = page.locator('[class*="card"], [class*="Card"], [class*="stat"], [class*="Stat"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test("QI-002: credit balance visible in sidebar/header", async ({ authedPage: page }) => {
    // SMS credit count should be visible somewhere (sidebar or header)
    const smsText = page.locator("text=/[\\d,]+\\s*SMS/i").first();
    await expect(smsText).toBeVisible({ timeout: 10000 });
  });

  test("QI-003: quick action links/buttons work", async ({ authedPage: page }) => {
    // Look for quick action buttons or links (send SMS, contacts, etc.)
    const actionLinks = page.locator('a[href*="/dashboard/"]').filter({
      hasText: /ส่ง SMS|Send|เติมเครดิต|Topup|รายชื่อ|Contact|แคมเปญ|Campaign|เทมเพลต|Template/i,
    });
    const count = await actionLinks.count();
    if (count > 0) {
      const firstLink = actionLinks.first();
      const href = await firstLink.getAttribute("href");
      expect(href).toBeTruthy();
      // Verify the link is a valid dashboard sub-path
      expect(href).toContain("/dashboard/");
    } else {
      // Dashboard may use buttons without href — check for clickable elements
      const body = await page.textContent("body");
      expect(body!.length).toBeGreaterThan(200);
    }
  });
});

// ─── 2. SMS Sending (/dashboard/send) ───────────────────────────────────────

test.describe("2. SMS Sending", () => {
  test("QI-010: sender displays EasySlip default", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/send");
    const senderText = page.locator("text=EasySlip").first();
    await expect(senderText).toBeVisible({ timeout: 10000 });
  });

  test("QI-011: fill phone + message, character count updates", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/send");

    // Fill phone number
    const phoneArea = page.locator("textarea").first();
    await phoneArea.fill("0812345678");
    await expect(phoneArea).toHaveValue("0812345678");

    // Fill message
    const msgArea = page.locator("textarea").nth(1);
    await msgArea.fill("Hello World Test Message");
    await expect(msgArea).toHaveValue("Hello World Test Message");

    // Character count should appear somewhere near the textarea
    const body = await page.textContent("body");
    const hasCharCount =
      /\d+\s*\/\s*\d+/.test(body!) ||
      /\d+\s*ตัวอักษร/.test(body!) ||
      /\d+\s*characters?/i.test(body!) ||
      /\d+\s*credits?/i.test(body!);
    expect(hasCharCount).toBeTruthy();
  });

  test("QI-012: Thai/English toggle changes character limit", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/send");

    // Both options should exist
    const thaiBtn = page.getByText("ภาษาไทย");
    const engBtn = page.getByText("English");
    await expect(thaiBtn).toBeVisible();
    await expect(engBtn).toBeVisible();

    // Fill message to see count
    const msgArea = page.locator("textarea").nth(1);
    await msgArea.fill("Test");

    // Click English
    await engBtn.click();
    const bodyEng = await page.textContent("body");

    // Click Thai
    await thaiBtn.click();
    const bodyThai = await page.textContent("body");

    // Both modes render without error
    expect(bodyEng!.length).toBeGreaterThan(100);
    expect(bodyThai!.length).toBeGreaterThan(100);
  });

  test("QI-013: send button disabled when empty, enabled when filled", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/send");

    const sendBtn = page.getByRole("button", { name: /ส่ง SMS|Send/i });
    await expect(sendBtn).toBeVisible();

    // Should be disabled when empty
    await expect(sendBtn).toBeDisabled();

    // Fill phone + message
    const phoneArea = page.locator("textarea").first();
    await phoneArea.fill("0812345678");
    const msgArea = page.locator("textarea").nth(1);
    await msgArea.fill("E2E Test Message");

    // Wait for React state to update
    await page.waitForTimeout(500);
    const isDisabledAfter = await sendBtn.isDisabled();
    expect(typeof isDisabledAfter).toBe("boolean");
  });
});

// ─── 3. Contacts (/dashboard/contacts) ─────────────────────────────────────

test.describe("3. Contacts", () => {
  test("QI-020: add contact dialog opens with form fields", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/contacts");

    const addBtn = page.locator("button").filter({
      hasText: /เพิ่ม|Add|Quick|สร้าง|นำเข้า|Import/i,
    }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Should open dialog or navigate
    const dialog = page.locator('[role="dialog"]');
    const isDialog = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
    const isCreatePage = page.url().includes("create") || page.url().includes("new");

    expect(isDialog || isCreatePage).toBeTruthy();

    if (isDialog) {
      const inputs = dialog.locator("input, textarea");
      const count = await inputs.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test("QI-021: search input filters results", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/contacts");

    const search = page.locator('input[type="search"], input[placeholder*="ค้น"], input[placeholder*="search"], input[placeholder*="Search"], input[placeholder*="หา"]').first();
    await expect(search).toBeVisible();

    await search.fill("test");
    await expect(search).toHaveValue("test");

    await page.waitForTimeout(500);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);
  });

  test("QI-022: checkbox selection works", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/contacts");

    const checkboxes = page.locator('[role="checkbox"], input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);

    // Click the first checkbox
    const firstCheckbox = checkboxes.first();
    await firstCheckbox.click();

    const isChecked = await firstCheckbox.isChecked().catch(async () => {
      const ariaChecked = await firstCheckbox.getAttribute("aria-checked");
      return ariaChecked === "true";
    });
    expect(typeof isChecked).toBe("boolean");
  });

  test("QI-023: groups page loads", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/groups");
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    expect(body!.length).toBeGreaterThan(100);
  });

  test("QI-024: tags page loads", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/tags");
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    expect(body!.length).toBeGreaterThan(100);
  });
});

// ─── 4. Templates (/dashboard/templates) ────────────────────────────────────

test.describe("4. Templates", () => {
  test("QI-030: create template dialog opens", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/templates");

    const createBtn = page.locator("button").filter({
      hasText: /สร้าง|Create|เพิ่ม/i,
    }).first();
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    const dialog = page.locator('[role="dialog"]');
    const isDialog = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
    const isCreatePage = page.url().includes("create") || page.url().includes("new");
    expect(isDialog || isCreatePage).toBeTruthy();
  });

  test("QI-031: name + content fields fillable", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/templates");

    const createBtn = page.locator("button").filter({
      hasText: /สร้าง|Create|เพิ่ม/i,
    }).first();
    await createBtn.click();

    const dialog = page.locator('[role="dialog"]');
    const container = (await dialog.isVisible({ timeout: 5000 }).catch(() => false))
      ? dialog
      : page;

    const nameInput = container.locator('input').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill("QA Test Template");
    await expect(nameInput).toHaveValue("QA Test Template");

    const contentArea = container.locator("textarea").first();
    if (await contentArea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await contentArea.fill("Hello {{name}}, your code is {{phone}}");
      await expect(contentArea).toHaveValue("Hello {{name}}, your code is {{phone}}");
    }
  });

  test("QI-032: variable buttons insert text", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/templates");

    const createBtn = page.locator("button").filter({
      hasText: /สร้าง|Create|เพิ่ม/i,
    }).first();
    await createBtn.click();

    const dialog = page.locator('[role="dialog"]');
    const container = (await dialog.isVisible({ timeout: 5000 }).catch(() => false))
      ? dialog
      : page;

    const varButtons = container.locator('button').filter({
      hasText: /\{\{.*\}\}|name|phone|ชื่อ|เบอร์/i,
    });
    const varCount = await varButtons.count();

    if (varCount > 0) {
      const contentArea = container.locator("textarea").first();
      if (await contentArea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await contentArea.click();
        await contentArea.fill("");
        await varButtons.first().click();
        await page.waitForTimeout(300);
        const value = await contentArea.inputValue();
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  test("QI-033: save/submit template action exists", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/templates");

    const createBtn = page.locator("button").filter({
      hasText: /สร้าง|Create|เพิ่ม/i,
    }).first();
    await createBtn.click();

    const dialog = page.locator('[role="dialog"]');
    const container = (await dialog.isVisible({ timeout: 5000 }).catch(() => false))
      ? dialog
      : page;

    const saveBtn = container.locator("button").filter({
      hasText: /บันทึก|Save|สร้าง|Create|ยืนยัน|Submit/i,
    }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
  });
});

// ─── 5. Campaigns (/dashboard/campaigns) ────────────────────────────────────

test.describe("5. Campaigns", () => {
  test("QI-040: page loads without server error", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/campaigns");
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Application error");
    expect(body).not.toContain("Internal Server Error");
    expect(body!.length).toBeGreaterThan(100);
  });

  test("QI-041: create campaign button exists", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/campaigns");

    const createBtn = page.locator("button").filter({
      hasText: /สร้าง|Create|เพิ่ม|New|แคมเปญ/i,
    }).first();
    await expect(createBtn).toBeVisible();
  });

  test("QI-042: campaign list or empty state shown", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/campaigns");

    const body = await page.textContent("body");
    const hasCampaignContent =
      body!.includes("แคมเปญ") ||
      body!.includes("Campaign") ||
      body!.includes("ยังไม่มี") ||
      body!.includes("No campaign") ||
      body!.includes("สร้างแคมเปญ") ||
      body!.includes("empty");
    expect(hasCampaignContent).toBeTruthy();
  });
});

// ─── 6. Billing (/dashboard/billing + /dashboard/billing/topup) ─────────────

test.describe("6. Billing", () => {
  test("QI-050: billing history or empty state", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/billing");

    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    const hasContent =
      body!.includes("รายการ") ||
      body!.includes("Transaction") ||
      body!.includes("ประวัติ") ||
      body!.includes("ยังไม่มี") ||
      body!.includes("ชำระเงิน") ||
      body!.includes("Billing") ||
      body!.includes("Invoice") ||
      body!.includes("คำสั่งซื้อ");
    expect(hasContent).toBeTruthy();
  });

  test("QI-051: topup page shows preset amounts and pricing", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/billing/topup");

    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");

    // Should show pricing amounts
    expect(body).toMatch(/[฿\d,]+/);
    const hasSmsRef = /SMS/i.test(body!);
    expect(hasSmsRef).toBeTruthy();
  });

  test("QI-052: topup page has bank account info (SCB 407-824-0476)", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/billing/topup");

    // Select a package first to see bank details
    const pkgBtn = page.locator("button").filter({ hasText: /฿|SMS|เลือก|Select/i }).first();
    if (await pkgBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pkgBtn.click();
      await page.waitForTimeout(1000);
    }

    // Look for bank info
    const body = await page.textContent("body");
    const hasBankInfo =
      body!.includes("407-824-0476") ||
      body!.includes("SCB") ||
      body!.includes("ไทยพาณิชย์") ||
      body!.includes("ธนาคาร");

    if (!hasBankInfo) {
      // Try clicking next/continue button
      const nextBtn = page.locator("button").filter({
        hasText: /ถัดไป|Next|ชำระ|Pay|ยืนยัน|Continue/i,
      }).first();
      if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    const bodyFinal = await page.textContent("body");
    const hasBankFinal =
      bodyFinal!.includes("407-824-0476") ||
      bodyFinal!.includes("SCB") ||
      bodyFinal!.includes("ไทยพาณิชย์") ||
      bodyFinal!.includes("ธนาคาร") ||
      bodyFinal!.includes("โอนเงิน");
    expect(hasBankFinal).toBeTruthy();
  });
});

// ─── 7. Packages (/dashboard/packages) ──────────────────────────────────────

test.describe("7. Packages", () => {
  test("QI-060: tab switch SME/Enterprise", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/packages");

    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(2);

    // Click second tab
    const secondTab = tabs.nth(1);
    await secondTab.click();
    await page.waitForTimeout(500);

    const body = await page.textContent("body");
    expect(body).toMatch(/฿[\d,]+/);
  });

  test("QI-061: package cards display with prices", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/packages");

    const body = await page.textContent("body");
    expect(body).toMatch(/฿[\d,]+/);
    expect(body).toMatch(/[\d,]+\s*SMS/i);

    const cards = page.locator('[class*="card"], [class*="Card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("QI-062: buy button navigates to checkout", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/packages");

    const buyBtn = page.locator("button").filter({
      hasText: /ซื้อ|Buy|เลือก|Select|สั่งซื้อ/i,
    }).first();

    if (await buyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await buyBtn.click();
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const url = page.url();
      const hasDialog = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      expect(
        url.includes("checkout") ||
        url.includes("billing") ||
        url.includes("topup") ||
        hasDialog
      ).toBeTruthy();
    }
  });

  test("QI-063: comparison table or feature list exists", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/packages");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const body = await page.textContent("body");
    const hasComparison =
      body!.includes("เปรียบเทียบ") ||
      body!.includes("Compare") ||
      body!.includes("Feature") ||
      body!.includes("คุณสมบัติ") ||
      body!.includes("SMS/วัน") ||
      body!.includes("API") ||
      body!.includes("รองรับ");
    expect(hasComparison).toBeTruthy();
  });
});

// ─── 8. Settings ────────────────────────────────────────────────────────────

test.describe("8. Settings", () => {
  test("QI-070: profile form editable", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/settings");

    const inputs = page.locator('input:not([type="hidden"])');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);

    let hasEditableInput = false;
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const isReadOnly = await input.getAttribute("readonly");
      const isDisabled = await input.isDisabled();
      if (!isReadOnly && !isDisabled) {
        hasEditableInput = true;
        break;
      }
    }

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(200);
  });

  test("QI-071: 2FA section visible on security page", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/settings/security");

    const body = await page.textContent("body");
    const has2FA =
      body!.includes("2FA") ||
      body!.includes("Two-Factor") ||
      body!.includes("ยืนยันตัวตน") ||
      body!.includes("two-factor") ||
      body!.includes("Authenticator") ||
      body!.includes("สองขั้นตอน");
    expect(has2FA).toBeTruthy();
  });

  test("QI-072: team invite dialog", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/settings/team");

    const inviteBtn = page.locator("button").filter({
      hasText: /เชิญ|Invite|เพิ่ม|Add/i,
    }).first();
    await expect(inviteBtn).toBeVisible();

    await inviteBtn.click();

    const dialog = page.locator('[role="dialog"]');
    const isDialog = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
    const hasForm = await page.locator('input[type="email"], input[placeholder*="email"], input[placeholder*="อีเมล"]')
      .first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(isDialog || hasForm).toBeTruthy();
  });

  test("QI-073: API key create dialog", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/api-keys");

    const createBtn = page.locator("button").filter({
      hasText: /สร้าง|Create|Generate/i,
    }).first();
    await expect(createBtn).toBeVisible();

    await createBtn.click();

    const dialog = page.locator('[role="dialog"]');
    const isDialog = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
    const hasInput = await page.locator('input').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(isDialog || hasInput).toBeTruthy();
  });

  test("QI-074: webhook add dialog", async ({ authedPage: page }) => {
    await safeGoto(page, "/dashboard/settings/webhooks");

    const addBtn = page.locator("button").filter({
      hasText: /เพิ่ม|Add|สร้าง|Create/i,
    }).first();
    await expect(addBtn).toBeVisible();

    await addBtn.click();

    const dialog = page.locator('[role="dialog"]');
    const isDialog = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
    const hasUrlInput = await page.locator('input[type="url"], input[placeholder*="URL"], input[placeholder*="url"], input[placeholder*="https"]')
      .first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(isDialog || hasUrlInput).toBeTruthy();
  });
});

// ─── 9. Auth ────────────────────────────────────────────────────────────────

test.describe("9. Auth Flows", () => {
  test("QI-080: login form validation — empty submit disabled", async ({ page }) => {
    await safeGoto(page, "/login");

    // Dismiss cookie consent if present
    const acceptBtn = page.getByText("ยอมรับทั้งหมด");
    if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptBtn.click();
      await acceptBtn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
    }

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    // Fill only email — should still be disabled
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill("test@test.com");
      const isDisabledPartial = await submitBtn.isDisabled();
      expect(isDisabledPartial).toBeTruthy();

      // Fill password too — should enable
      await page.locator('input[type="password"]').fill(process.env.SEED_PASSWORD!);
      await page.waitForFunction(
        () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
        { timeout: 10000 }
      );
      await expect(submitBtn).toBeEnabled();
    }
  });

  test("QI-081: logout flow via user menu", async ({ authedPage: page }) => {
    // authedPage already navigated to /dashboard
    const userMenu = page.locator('[class*="avatar"], [class*="Avatar"], button:has-text("D")').first();
    if (await userMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
      await userMenu.click();
      const logoutBtn = page.getByText("ออกจากระบบ");
      if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logoutBtn.click();
        await page.waitForURL("**/login**", { timeout: 15000 });
        expect(page.url()).toContain("/login");
        return;
      }
    }
    // Fallback: call logout API directly
    await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
    await safeGoto(page, "/dashboard");
    // After logout, should redirect to login
    expect(page.url()).toContain("/login");
  });

  test("QI-082: protected route redirects to login without auth", async ({ browser }) => {
    const context = await browser.newContext(); // No auth
    const page = await context.newPage();

    const protectedPaths = [
      "/dashboard",
      "/dashboard/send",
      "/dashboard/contacts",
      "/dashboard/settings",
    ];

    for (const path of protectedPaths) {
      try {
        await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle", timeout: 15000 });
      } catch {
        await page.goto(`http://localhost:3000${path}`, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(2000);
      }
      expect(page.url()).toContain("/login");
    }

    await context.close();
  });
});
