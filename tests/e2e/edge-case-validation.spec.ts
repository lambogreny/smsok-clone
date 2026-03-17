import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS = path.join(__dirname, "..", "screenshots", "edge-cases");
const CSRF = { Origin: "http://localhost:3000", Referer: "http://localhost:3000/" };

test.describe("Edge Case: Form Validation", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });
  });

  // ========== 1. REGISTER EDGE CASES ==========
  test("Register edge cases — API", async ({ request }) => {
    console.log("\n=== REGISTER EDGE CASES ===");

    // 1a. Duplicate email
    const dupResp = await request.post("/api/auth/register", {
      headers: { ...CSRF, "Content-Type": "application/json" },
      data: { name: "Dup Test", email: "qa-suite@smsok.test", phone: "0899999999", password: "Test1234!", confirmPassword: "Test1234!" },
    });
    console.log(`📊 Duplicate email → ${dupResp.status()}`);
    expect(dupResp.status()).not.toBe(500);
    if ([400, 409, 422].includes(dupResp.status())) {
      const body = await dupResp.json().catch(() => ({}));
      console.log(`✅ Rejected: ${JSON.stringify(body).substring(0, 100)}`);
    }

    // 1b. Short password
    const shortPwResp = await request.post("/api/auth/register", {
      headers: { ...CSRF, "Content-Type": "application/json" },
      data: { name: "Short PW", email: "shortpw@test.com", phone: "0811111111", password: "12", confirmPassword: "12" },
    });
    console.log(`📊 Short password → ${shortPwResp.status()}`);
    expect(shortPwResp.status()).not.toBe(500);
    expect([400, 422]).toContain(shortPwResp.status());
    console.log("✅ Short password rejected");

    // 1c. Password mismatch
    const mismatchResp = await request.post("/api/auth/register", {
      headers: { ...CSRF, "Content-Type": "application/json" },
      data: { name: "Mismatch", email: "mismatch@test.com", phone: "0822222222", password: "Test1234!", confirmPassword: "Different1!" },
    });
    console.log(`📊 Password mismatch → ${mismatchResp.status()}`);
    expect(mismatchResp.status()).not.toBe(500);

    // 1d. Empty name
    const emptyNameResp = await request.post("/api/auth/register", {
      headers: { ...CSRF, "Content-Type": "application/json" },
      data: { name: "", email: "empty@test.com", phone: "0833333333", password: "Test1234!", confirmPassword: "Test1234!" },
    });
    console.log(`📊 Empty name → ${emptyNameResp.status()}`);
    expect(emptyNameResp.status()).not.toBe(500);

    // 1e. Invalid email format
    const badEmailResp = await request.post("/api/auth/register", {
      headers: { ...CSRF, "Content-Type": "application/json" },
      data: { name: "Bad Email", email: "notanemail", phone: "0844444444", password: "Test1234!", confirmPassword: "Test1234!" },
    });
    console.log(`📊 Invalid email → ${badEmailResp.status()}`);
    expect(badEmailResp.status()).not.toBe(500);

    // 1f. Invalid phone
    const badPhoneResp = await request.post("/api/auth/register", {
      headers: { ...CSRF, "Content-Type": "application/json" },
      data: { name: "Bad Phone", email: "badphone@test.com", phone: "abc", password: "Test1234!", confirmPassword: "Test1234!" },
    });
    console.log(`📊 Invalid phone → ${badPhoneResp.status()}`);
    expect(badPhoneResp.status()).not.toBe(500);

    // 1g. XSS in name
    const xssResp = await request.post("/api/auth/register", {
      headers: { ...CSRF, "Content-Type": "application/json" },
      data: { name: '<script>alert(1)</script>', email: "xss@test.com", phone: "0855555555", password: "Test1234!", confirmPassword: "Test1234!" },
    });
    console.log(`📊 XSS in name → ${xssResp.status()}`);
    expect(xssResp.status()).not.toBe(500);

    // 1h. SQL injection
    const sqlResp = await request.post("/api/auth/register", {
      headers: { ...CSRF, "Content-Type": "application/json" },
      data: { name: "'; DROP TABLE users; --", email: "sql@test.com", phone: "0866666666", password: "Test1234!", confirmPassword: "Test1234!" },
    });
    console.log(`📊 SQL injection → ${sqlResp.status()}`);
    expect(sqlResp.status()).not.toBe(500);
  });

  // ========== 2. LOGIN EDGE CASES ==========
  test("Login edge cases — API", async ({ request }) => {
    console.log("\n=== LOGIN EDGE CASES ===");

    // 2a. Wrong password
    const wrongPwResp = await request.post("/api/auth/login", {
      headers: { ...CSRF, "Content-Type": "application/json" },
      data: { email: "qa-suite@smsok.test", password: "WrongPassword1!" },
    });
    console.log(`📊 Wrong password → ${wrongPwResp.status()}`);
    expect([400, 401, 403]).toContain(wrongPwResp.status());
    const wrongBody = await wrongPwResp.json().catch(() => ({}));
    console.log(`✅ Error: ${JSON.stringify(wrongBody).substring(0, 100)}`);

    // 2b. Non-existent email
    const noUserResp = await request.post("/api/auth/login", {
      headers: { ...CSRF, "Content-Type": "application/json" },
      data: { email: "nonexistent@nobody.com", password: "Test1234!" },
    });
    console.log(`📊 Non-existent email → ${noUserResp.status()}`);
    expect([400, 401, 403]).toContain(noUserResp.status());

    // 2c. Empty fields
    const emptyResp = await request.post("/api/auth/login", {
      headers: { ...CSRF, "Content-Type": "application/json" },
      data: { email: "", password: "" },
    });
    console.log(`📊 Empty fields → ${emptyResp.status()}`);
    expect(emptyResp.status()).not.toBe(500);

    // 2d. SQL injection in email
    const sqlResp = await request.post("/api/auth/login", {
      headers: { ...CSRF, "Content-Type": "application/json" },
      data: { email: "' OR 1=1 --", password: "anything" },
    });
    console.log(`📊 SQL injection → ${sqlResp.status()}`);
    expect(sqlResp.status()).not.toBe(500);
    expect([400, 401, 403, 422]).toContain(sqlResp.status());
    console.log("✅ SQL injection safe");

    // 2e. Wrong password multiple times (rate limit check)
    for (let i = 0; i < 3; i++) {
      const r = await request.post("/api/auth/login", {
        headers: { ...CSRF, "Content-Type": "application/json" },
        data: { email: "qa-suite@smsok.test", password: `Wrong${i}!` },
      });
      console.log(`📊 Wrong password attempt ${i + 1} → ${r.status()}`);
      if (r.status() === 429) {
        console.log("✅ Rate limited after multiple failures");
        break;
      }
    }
  });

  // ========== 3. SEND SMS EDGE CASES ==========
  test("Send SMS edge cases — API", async ({ request }) => {
    console.log("\n=== SEND SMS EDGE CASES ===");

    // 3a. Invalid phone format
    const badPhoneResp = await request.post("/api/v1/sms/send", {
      headers: CSRF,
      data: { sender: "SMSOK", to: "not-a-phone", message: "test" },
    });
    expect([400, 422]).toContain(badPhoneResp.status());
    console.log(`✅ Invalid phone → ${badPhoneResp.status()}`);

    // 3b. Empty message
    const emptyMsgResp = await request.post("/api/v1/sms/send", {
      headers: CSRF,
      data: { sender: "SMSOK", to: "0812345678", message: "" },
    });
    expect([400, 422]).toContain(emptyMsgResp.status());
    console.log(`✅ Empty message → ${emptyMsgResp.status()}`);

    // 3c. Message > 1000 chars
    const longMsgResp = await request.post("/api/v1/sms/send", {
      headers: CSRF,
      data: { sender: "SMSOK", to: "0812345678", message: "X".repeat(1001) },
    });
    expect([400, 422]).toContain(longMsgResp.status());
    console.log(`✅ Long message (1001) → ${longMsgResp.status()}`);

    // 3d. Sender too long (>11)
    const longSenderResp = await request.post("/api/v1/sms/send", {
      headers: CSRF,
      data: { sender: "TOOLONGSENDER", to: "0812345678", message: "test" },
    });
    expect([400, 422]).toContain(longSenderResp.status());
    console.log(`✅ Long sender (13) → ${longSenderResp.status()}`);

    // 3e. Special chars in sender
    const specialSenderResp = await request.post("/api/v1/sms/send", {
      headers: CSRF,
      data: { sender: "SMS@#$", to: "0812345678", message: "test" },
    });
    expect([400, 422]).toContain(specialSenderResp.status());
    console.log(`✅ Special chars sender → ${specialSenderResp.status()}`);

    // 3f. No auth (unauthenticated)
    const noAuthResp = await request.post("/api/v1/sms/send", {
      headers: { ...CSRF, Cookie: "" },
      data: { sender: "SMSOK", to: "0812345678", message: "test" },
    });
    console.log(`📊 No auth → ${noAuthResp.status()}`);
    // Should be 401 or redirect, not 500
    expect(noAuthResp.status()).not.toBe(500);
  });

  // ========== 4. TEMPLATES EDGE CASES ==========
  test("Templates edge cases — API", async ({ request }) => {
    console.log("\n=== TEMPLATES EDGE CASES ===");

    // 4a. Very long name (500 chars)
    const longNameResp = await request.post("/api/v1/templates", {
      headers: CSRF,
      data: { name: "A".repeat(500), content: "test" },
    });
    console.log(`📊 Long name (500) → ${longNameResp.status()}`);
    expect(longNameResp.status()).not.toBe(500);

    // 4b. Empty content
    const emptyContentResp = await request.post("/api/v1/templates/validate", {
      headers: CSRF,
      data: { content: "" },
    });
    expect([400, 422]).toContain(emptyContentResp.status());
    console.log(`✅ Empty content → ${emptyContentResp.status()}`);

    // 4c. XSS in content
    const xssResp = await request.post("/api/v1/templates/validate", {
      headers: CSRF,
      data: { content: '<script>alert("xss")</script><img src=x onerror=alert(1)>' },
    });
    console.log(`📊 XSS content → ${xssResp.status()}`);
    expect(xssResp.status()).not.toBe(500);

    // 4d. Unicode/emoji in content
    const emojiResp = await request.post("/api/v1/templates/validate", {
      headers: CSRF,
      data: { content: "Hello 🎉🔥💯 สวัสดีครับ 你好" },
    });
    expect(emojiResp.status()).toBe(200);
    console.log(`✅ Emoji + Unicode → ${emojiResp.status()}`);

    // 4e. Content with unmatched variables
    const badVarResp = await request.post("/api/v1/templates/validate", {
      headers: CSRF,
      data: { content: "Hello {{name}} {{" },
    });
    console.log(`📊 Unmatched variable → ${badVarResp.status()}`);
    expect(badVarResp.status()).not.toBe(500);

    // 4f. Very long content (5000 chars)
    const veryLongResp = await request.post("/api/v1/templates/validate", {
      headers: CSRF,
      data: { content: "ก".repeat(5000) },
    });
    console.log(`📊 Very long content (5000) → ${veryLongResp.status()}`);
    expect(veryLongResp.status()).not.toBe(500);
  });

  // ========== 5. GROUPS EDGE CASES ==========
  test("Groups edge cases — API", async ({ request }) => {
    console.log("\n=== GROUPS EDGE CASES ===");

    // 5a. Empty group name
    const emptyResp = await request.post("/api/v1/groups", {
      headers: CSRF,
      data: { name: "" },
    });
    expect(emptyResp.status()).toBe(400);
    console.log(`✅ Empty group name → 400`);

    // 5b. Name with only spaces
    const spacesResp = await request.post("/api/v1/groups", {
      headers: CSRF,
      data: { name: "   " },
    });
    expect([400, 422]).toContain(spacesResp.status());
    console.log(`✅ Spaces-only name → ${spacesResp.status()}`);

    // 5c. XSS in group name
    const xssResp = await request.post("/api/v1/groups", {
      headers: CSRF,
      data: { name: '<img src=x onerror=alert(1)>' },
    });
    expect(xssResp.status()).toBe(400);
    console.log(`✅ XSS group name → 400`);

    // 5d. Very long name (200 chars)
    const longResp = await request.post("/api/v1/groups", {
      headers: CSRF,
      data: { name: "G".repeat(200) },
    });
    expect([400, 422]).toContain(longResp.status());
    console.log(`✅ Long name (200) → ${longResp.status()}`);

    // 5e. Duplicate name
    const name = `QA-Edge-${Date.now().toString(36)}`;
    const create1 = await request.post("/api/v1/groups", { headers: CSRF, data: { name } });
    expect(create1.status()).toBe(201);
    const groupId = ((await create1.json()).data || await create1.json()).id;

    const create2 = await request.post("/api/v1/groups", { headers: CSRF, data: { name } });
    expect(create2.status()).toBe(409);
    console.log(`✅ Duplicate group name → 409`);

    // Cleanup
    await request.delete(`/api/v1/groups/${groupId}`, { headers: CSRF });

    // 5f. Add invalid contactId to group
    const fakeAddResp = await request.post("/api/v1/contacts/bulk/add-to-group", {
      headers: CSRF,
      data: { groupId: "fakeid123", contactIds: ["fakeid456"] },
    });
    console.log(`📊 Fake IDs add → ${fakeAddResp.status()}`);
    expect(fakeAddResp.status()).not.toBe(500);
  });

  // ========== 6. BROWSER VALIDATION ==========
  test("Browser: form validation display", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click({ force: true });
        await page.waitForTimeout(300);
      }
    }

    console.log("\n=== BROWSER VALIDATION ===");

    // --- Login with wrong creds ---
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const pwInput = page.locator('input[type="password"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill("wrong@test.com");
      await pwInput.fill("wrongpassword123");
      const submitBtn = page.locator('button[type="submit"]').first();
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS, "01-login-wrong-creds.png"), fullPage: true });

      const errorText = await page.locator("body").innerText();
      const hasError = errorText.includes("ไม่ถูกต้อง") || errorText.includes("ผิด") || errorText.includes("ไม่พบ");
      console.log(`${hasError ? "✅" : "⚠️"} Login wrong creds: ${hasError ? "error shown" : "no visible error"}`);
    }

    // --- Send SMS empty form ---
    await page.goto("/dashboard/send", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();

    const sendBtn = page.locator('button:has-text("ส่ง SMS"), button:has-text("ส่ง")').first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const disabled = await sendBtn.isDisabled();
      console.log(`${disabled ? "✅" : "⚠️"} Send SMS: button ${disabled ? "disabled" : "enabled"} when empty`);
      await page.screenshot({ path: path.join(SCREENSHOTS, "02-send-empty.png"), fullPage: true });
    }

    // --- Send SMS with invalid phone ---
    const phoneArea = page.locator('textarea[placeholder*="เบอร์"], textarea[placeholder*="ผู้รับ"]').first();
    const msgArea = page.locator('textarea[placeholder*="พิมพ์ข้อความ"]').first();
    if (await phoneArea.isVisible({ timeout: 3000 }).catch(() => false) &&
        await msgArea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneArea.fill("abc-not-phone");
      await msgArea.fill("test message");
      await msgArea.press("Space");
      await msgArea.press("Backspace");
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOTS, "03-send-invalid-phone.png"), fullPage: true });

      // Try to send
      if (await sendBtn.isVisible().catch(() => false)) {
        const stillDisabled = await sendBtn.isDisabled();
        if (!stillDisabled) {
          await sendBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(SCREENSHOTS, "04-send-error.png"), fullPage: true });
          const errorText = await page.locator("body").innerText();
          const hasValidation = errorText.includes("เบอร์") || errorText.includes("รูปแบบ") || errorText.includes("ไม่ถูกต้อง");
          console.log(`${hasValidation ? "✅" : "⚠️"} Invalid phone: ${hasValidation ? "validation shown" : "no validation"}`);
        } else {
          console.log("✅ Send button still disabled with invalid phone");
        }
      }
    }

    // --- Templates: create with empty content ---
    await page.goto("/dashboard/templates", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();
    await page.screenshot({ path: path.join(SCREENSHOTS, "05-templates-page.png"), fullPage: true });

    const createBtn = page.locator('button:has-text("สร้างใหม่"), button:has-text("สร้าง")').first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);

      // Try saving without filling anything
      const saveBtn = page.locator('button[type="submit"], button:has-text("บันทึก")').last();
      if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        const disabled = await saveBtn.isDisabled();
        console.log(`${disabled ? "✅" : "📊"} Template save: ${disabled ? "disabled when empty" : "enabled when empty"}`);
        await page.screenshot({ path: path.join(SCREENSHOTS, "06-template-empty.png"), fullPage: true });
      }
    }

    // --- Mobile validation ---
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();
    await page.screenshot({ path: path.join(SCREENSHOTS, "07-login-mobile.png"), fullPage: true });
    console.log("📱 Mobile login page OK");

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
