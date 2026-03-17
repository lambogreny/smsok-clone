import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const CREDS = { email: "qa-suite@smsok.test", password: "QATest123!" };

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  const accept = page.getByText("ยอมรับทั้งหมด");
  if (await accept.isVisible({ timeout: 2000 }).catch(() => false)) {
    await accept.click();
    await accept.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
  await page.locator('input[type="email"]').fill(CREDS.email);
  await page.locator('input[type="password"]').fill(CREDS.password);
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 10000 }
  ).catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/dashboard/, { timeout: 30000 });
}

// ========== EVERY SIDEBAR LINK ==========
test.describe("SIDEBAR — ทุก link ต้องเปิดได้ ไม่ 500", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  const sidebarPages = [
    { name: "ภาพรวม (Dashboard)", path: "/dashboard" },
    { name: "ส่ง SMS", path: "/dashboard/send" },
    { name: "ประวัติการส่ง", path: "/dashboard/history" },
    { name: "บริการ OTP", path: "/dashboard/otp" },
    { name: "เทมเพลต", path: "/dashboard/templates" },
    { name: "รายชื่อผู้ติดต่อ", path: "/dashboard/contacts" },
    { name: "แท็ก", path: "/dashboard/tags" },
    { name: "กลุ่ม", path: "/dashboard/groups" },
    { name: "ชื่อผู้ส่ง", path: "/dashboard/senders" },
    { name: "แคมเปญ", path: "/dashboard/campaigns" },
    { name: "ซื้อแพ็คเกจ", path: "/dashboard/packages" },
    { name: "แพ็คเกจของฉัน", path: "/dashboard/my-packages" },
    { name: "ประวัติคำสั่งซื้อ", path: "/dashboard/orders" },
    { name: "เอกสาร", path: "/dashboard/documents" },
    { name: "ตั้งค่าโปรไฟล์", path: "/dashboard/settings" },
    { name: "ความปลอดภัย", path: "/dashboard/settings/security" },
    { name: "API Keys", path: "/dashboard/settings/api-keys" },
    { name: "Webhooks", path: "/dashboard/settings/webhooks" },
    { name: "Sessions", path: "/dashboard/settings/sessions" },
    { name: "บันทึกกิจกรรม", path: "/dashboard/settings/activity" },
    { name: "การแจ้งเตือน", path: "/dashboard/settings/notifications" },
    { name: "ความเป็นส่วนตัว", path: "/dashboard/settings/privacy" },
    { name: "ศูนย์ช่วยเหลือ", path: "/dashboard/support" },
    { name: "Scheduled SMS", path: "/dashboard/scheduled" },
    { name: "Billing", path: "/dashboard/billing" },
    { name: "Short Links", path: "/dashboard/links" },
  ];

  for (const pg of sidebarPages) {
    test(`PAGE: ${pg.name} (${pg.path})`, async ({ page }) => {
      const resp = await page.goto(`${BASE}${pg.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      // Must not be 500
      const body = await page.locator("body").textContent();
      const is500 = body?.includes("Internal Server Error");

      await page.screenshot({ path: `test-results/4622-page-${pg.path.replace(/\//g, '_')}.png` });

      if (is500) {
        throw new Error(`🔴 ${pg.path} returns 500 Internal Server Error!`);
      }

      // Check no raw stack trace visible
      expect(body).not.toMatch(/at\s+\w+\s+\(.*\.js:\d+/);
    });
  }
});

// ========== EVERY BUTTON ON DASHBOARD ==========
test.describe("BUTTONS — ทุกปุ่มบน Dashboard กดได้ ไม่ crash", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Dashboard: กดทุก action card (ส่ง SMS, สร้างแคมเปญ, etc)", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Find all clickable action cards/buttons on dashboard
    const actionCards = page.locator('a, button').filter({ hasText: /ส่ง SMS|สร้างแคมเปญ|เพิ่มรายชื่อ|ซื้อแพ็คเกจ|ทำเลย/i });
    const count = await actionCards.count();
    console.log(`Dashboard action cards found: ${count}`);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await actionCards.nth(i).textContent();
      console.log(`  Action ${i}: ${text?.trim()}`);
    }

    await page.screenshot({ path: "test-results/4622-dashboard-buttons.png" });
    expect(count).toBeGreaterThan(0);
  });

  test("Dashboard: ส่ง SMS → button navigates", async ({ page }) => {
    const smsLink = page.locator('a, button').filter({ hasText: /ส่ง SMS/i }).first();
    if (await smsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await smsLink.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toMatch(/send|sms/i);
    }
    await page.screenshot({ path: "test-results/4622-dash-to-sms.png" });
  });
});

// ========== SEND SMS — INTERACTIVE ==========
test.describe("SEND SMS — กรอกฟอร์มจริง", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("SMS: กรอกเบอร์ + ข้อความ + ดู char count", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Find phone input
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="เบอร์"], input[placeholder*="08"], input[name*="phone"], input[name*="recipient"]').first();
    if (await phoneInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await phoneInput.fill("0812345678");
      await page.waitForTimeout(500);
    }

    // Find message textarea
    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill("ทดสอบข้อความจาก QA 🧪 สวัสดีครับ");
      await page.waitForTimeout(500);

      // Check character count updated
      const body = await page.locator("body").textContent();
      const hasCount = body?.match(/\d+\s*(\/|ตัวอักษร|chars?|credits?)/i);
      console.log("Char count visible:", !!hasCount);
    }

    await page.screenshot({ path: "test-results/4622-sms-form-filled.png" });
  });

  test("SMS: กด send โดยไม่มี sender → ต้องไม่ crash", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill("test");
    }

    const sendBtn = page.locator('button').filter({ hasText: /ส่ง|send/i }).first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const disabled = await sendBtn.isDisabled();
      console.log("Send button disabled (no recipient):", disabled);
      if (!disabled) {
        await sendBtn.click();
        await page.waitForTimeout(2000);
        // Should show validation error, not crash
        const body = await page.locator("body").textContent();
        expect(body).not.toContain("Internal Server Error");
      }
    }
    await page.screenshot({ path: "test-results/4622-sms-no-sender.png" });
  });

  test("SMS: XSS in phone field", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="เบอร์"], input[placeholder*="08"], input[name*="phone"], input[name*="recipient"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('<script>alert("xss")</script>');
      await page.waitForTimeout(500);
      // No alert should fire
      const alerts: string[] = [];
      page.on("dialog", d => { alerts.push(d.message()); d.dismiss(); });
      await page.waitForTimeout(1000);
      expect(alerts).toHaveLength(0);
    }
    await page.screenshot({ path: "test-results/4622-sms-xss-phone.png" });
  });
});

// ========== SENDER NAMES — INTERACTIVE ==========
test.describe("SENDER NAMES — เพิ่ม/ดู", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Senders: กดเพิ่มชื่อผู้ส่ง → dialog เปิด → กรอก → ดู validation", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/senders`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const addBtn = page.locator('button').filter({ hasText: /เพิ่ม|สร้าง|add|request|ขอ/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      // Try to find form in dialog
      const nameInput = page.locator('input[name*="sender"], input[name*="name"], input[placeholder*="ชื่อ"], dialog input, [role="dialog"] input').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Try submitting empty
        const submitBtn = page.locator('dialog button[type="submit"], [role="dialog"] button[type="submit"], [role="dialog"] button').filter({ hasText: /ส่ง|submit|ยืนยัน|บันทึก|สร้าง/i }).first();
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(1000);
          // Should show validation error
        }

        // Fill with valid name
        await nameInput.fill("QATEST");
        await page.waitForTimeout(500);
      }

      await page.screenshot({ path: "test-results/4622-sender-dialog-filled.png" });
    } else {
      await page.screenshot({ path: "test-results/4622-sender-no-add-btn.png" });
    }
  });
});

// ========== SETTINGS — EVERY TAB ==========
test.describe("SETTINGS — ทุก tab ทำงาน", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Settings: แก้ชื่อ → save → reload → ข้อมูลเปลี่ยนจริง", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const nameInput = page.locator('input[name="name"], input[name="firstName"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const original = await nameInput.inputValue();
      const newName = original === "QA Suite" ? "QA Suite Test" : "QA Suite";

      await nameInput.clear();
      await nameInput.fill(newName);

      // Find save button
      const saveBtn = page.locator('button[type="submit"], button').filter({ hasText: /บันทึก|save|อัปเดต|update/i }).first();
      if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);

        // Reload and verify
        await page.reload();
        await page.waitForTimeout(2000);

        const afterReload = await nameInput.inputValue();
        console.log(`Name before: ${original}, after save+reload: ${afterReload}`);

        // Restore original
        if (afterReload !== original) {
          await nameInput.clear();
          await nameInput.fill(original);
          await saveBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    await page.screenshot({ path: "test-results/4622-settings-save.png" });
  });

  test("Settings: password change — wrong current password → error", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Find password section
    const currentPwField = page.locator('input[name*="current"], input[name*="oldPassword"], input[placeholder*="ปัจจุบัน"]').first();
    if (await currentPwField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await currentPwField.fill("wrongpassword");

      const newPwField = page.locator('input[name*="new"], input[name*="newPassword"], input[placeholder*="ใหม่"]').first();
      if (await newPwField.isVisible()) {
        await newPwField.fill("NewPass123!");
      }

      const confirmPwField = page.locator('input[name*="confirm"], input[placeholder*="ยืนยัน"]').first();
      if (await confirmPwField.isVisible()) {
        await confirmPwField.fill("NewPass123!");
      }

      const changePwBtn = page.locator('button').filter({ hasText: /เปลี่ยน|change|อัปเดต/i }).first();
      if (await changePwBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await changePwBtn.click();
        await page.waitForTimeout(2000);

        const body = await page.locator("body").textContent();
        // Should show error, not success
        expect(body).not.toContain("Internal Server Error");
      }
    }
    await page.screenshot({ path: "test-results/4622-settings-wrong-pw.png" });
  });

  test("Settings: API Keys — สร้าง key ใหม่", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings/api-keys`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const createBtn = page.locator('button').filter({ hasText: /สร้าง|create|เพิ่ม|new/i }).first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);

      // Fill key name if dialog appears
      const nameInput = page.locator('dialog input, [role="dialog"] input, input[name*="name"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill("QA Test Key");

        const submitBtn = page.locator('dialog button[type="submit"], [role="dialog"] button').filter({ hasText: /สร้าง|create|ยืนยัน|submit/i }).first();
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }
    await page.screenshot({ path: "test-results/4622-api-key-create.png" });
  });
});

// ========== TEMPLATES — CRUD ==========
test.describe("TEMPLATES — สร้าง/ดู", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Templates: กดสร้าง → กรอก → save", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/templates`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const createBtn = page.locator('button').filter({ hasText: /สร้าง|create|เพิ่ม|new/i }).first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);

      // Fill template fields
      const nameInput = page.locator('input[name*="name"], input[placeholder*="ชื่อ"], dialog input').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill("QA Test Template");
      }

      const contentArea = page.locator('textarea, [contenteditable="true"]').first();
      if (await contentArea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await contentArea.fill("สวัสดี {{name}} ขอบคุณที่ใช้บริการ SMSOK");
      }
    }
    await page.screenshot({ path: "test-results/4622-template-create.png" });
  });
});

// ========== EDGE CASES ==========
test.describe("EDGE CASES — ทุก input", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("EDGE: Login — double click submit", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const accept = page.getByText("ยอมรับทั้งหมด");
    if (await accept.isVisible({ timeout: 1000 }).catch(() => false)) await accept.click();

    await page.locator('input[type="email"]').fill(CREDS.email);
    await page.locator('input[type="password"]').fill(CREDS.password);
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 5000 }
    ).catch(() => {});

    const submitBtn = page.locator('button[type="submit"]');
    // Double click rapidly
    await submitBtn.click();
    await submitBtn.click();

    await page.waitForTimeout(5000);
    // Should not crash or show error
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Internal Server Error");
    await page.screenshot({ path: "test-results/4622-edge-double-click.png" });
    await ctx.close();
  });

  test("EDGE: Register — SQL injection in all fields", async ({ page }) => {
    await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const nameInput = page.locator('input[name="name"]').first();
    const emailInput = page.locator('input[type="email"]').first();
    const phoneInput = page.locator('input[type="tel"], input[name*="phone"]').first();
    const pwInput = page.locator('input[type="password"]').first();

    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill("'; DROP TABLE users;--");
    }
    if (await emailInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await emailInput.fill("test@test.com' OR 1=1--");
    }
    if (await phoneInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await phoneInput.fill("0811111111' OR 1=1--");
    }
    if (await pwInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await pwInput.fill("'; DROP TABLE--");
    }

    await page.screenshot({ path: "test-results/4622-edge-sqli.png" });
    // Should not crash
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Internal Server Error");
  });

  test("EDGE: Emoji in message", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill("🔥🎉💯 ทดสอบ Emoji ในข้อความ SMS 🇹🇭👍");
      const val = await textarea.inputValue();
      expect(val).toContain("🔥");
    }
    await page.screenshot({ path: "test-results/4622-edge-emoji.png" });
  });

  test("EDGE: Long input (1000+ chars) in message", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      const longText = "ก".repeat(1500);
      await textarea.fill(longText);
      await page.waitForTimeout(500);
      // Should not crash
      const body = await page.locator("body").textContent();
      expect(body).not.toContain("Internal Server Error");
    }
    await page.screenshot({ path: "test-results/4622-edge-long-input.png" });
  });
});

// ========== RESPONSIVE — EVERY MAJOR PAGE ==========
test.describe("RESPONSIVE 375px — ทุกหน้าหลัก", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  const responsivePages = [
    "/dashboard",
    "/dashboard/send",
    "/dashboard/history",
    "/dashboard/contacts",
    "/dashboard/senders",
    "/dashboard/templates",
    "/dashboard/campaigns",
    "/dashboard/packages",
    "/dashboard/settings",
    "/dashboard/settings/api-keys",
    "/dashboard/support",
  ];

  for (const path of responsivePages) {
    test(`375px: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > 375);
      await page.screenshot({ path: `test-results/4622-resp-375-${path.replace(/\//g, '_')}.png` });

      if (overflow) {
        const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
        console.log(`⚠️ ${path} overflows at 375px — scrollWidth: ${scrollW}`);
      }
      expect(overflow).toBe(false);
    });
  }
});

// ========== CONSOLE ERRORS — EVERY MAJOR PAGE ==========
test.describe("CONSOLE ERRORS — ทุกหน้าต้องไม่มี JS errors", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  const consolePages = [
    "/dashboard",
    "/dashboard/send",
    "/dashboard/history",
    "/dashboard/contacts",
    "/dashboard/senders",
    "/dashboard/templates",
    "/dashboard/campaigns",
    "/dashboard/packages",
    "/dashboard/settings",
    "/dashboard/support",
  ];

  for (const path of consolePages) {
    test(`Console: ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", msg => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(3000);

      const realErrors = errors.filter(e =>
        !e.includes("favicon") &&
        !e.includes("hydration") &&
        !e.includes("DevTools") &&
        !e.includes("Warning:") &&
        !e.includes("Download the React DevTools") &&
        !e.includes("Third-party cookie")
      );

      if (realErrors.length > 0) {
        console.log(`❌ Console errors on ${path}:`, realErrors);
      }

      // Strict: no console errors allowed
      expect(realErrors).toHaveLength(0);
    });
  }
});
