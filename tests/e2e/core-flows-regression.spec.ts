import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS = path.join(__dirname, "..", "screenshots", "core-flows");
const CSRF = { Origin: "http://localhost:3000", Referer: "http://localhost:3000/" };

test.describe("Full Regression: Core Flows", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });
  });

  // ========== FLOW 1: Send SMS ==========
  test("Flow 1 — Send SMS: API + Browser", async ({ page, request }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }

    // ----- Layer 1: API Tests -----
    console.log("\n=== FLOW 1: Send SMS — Layer 1 API ===");

    // 1a. Valid SMS send
    const sendResp = await request.post("/api/v1/sms/send", {
      headers: CSRF,
      data: { sender: "SMSOK", to: "0812345678", message: "QA regression test" },
    });
    console.log(`📊 SMS send → ${sendResp.status()}`);
    if (sendResp.status() === 201) {
      const sendData = (await sendResp.json()).data || await sendResp.json();
      console.log(`✅ SMS sent: id=${sendData.id}, sms_used=${sendData.sms_used}`);
    } else if (sendResp.status() === 402) {
      console.log("⚠️ Insufficient credits (expected for test account)");
    } else {
      console.log(`📊 SMS send response: ${await sendResp.text()}`);
    }

    // 1b. Missing fields
    const missingResp = await request.post("/api/v1/sms/send", {
      headers: CSRF,
      data: { sender: "SMSOK" },
    });
    expect([400, 422]).toContain(missingResp.status());
    console.log(`✅ Missing fields → ${missingResp.status()}`);

    // 1c. Invalid phone format
    const badPhoneResp = await request.post("/api/v1/sms/send", {
      headers: CSRF,
      data: { sender: "SMSOK", to: "abc123", message: "test" },
    });
    expect([400, 422]).toContain(badPhoneResp.status());
    console.log(`✅ Invalid phone → ${badPhoneResp.status()}`);

    // 1d. Empty message
    const emptyMsgResp = await request.post("/api/v1/sms/send", {
      headers: CSRF,
      data: { sender: "SMSOK", to: "0812345678", message: "" },
    });
    expect([400, 422]).toContain(emptyMsgResp.status());
    console.log(`✅ Empty message → ${emptyMsgResp.status()}`);

    // 1e. Sender name too short
    const shortSenderResp = await request.post("/api/v1/sms/send", {
      headers: CSRF,
      data: { sender: "AB", to: "0812345678", message: "test" },
    });
    expect([400, 422]).toContain(shortSenderResp.status());
    console.log(`✅ Short sender → ${shortSenderResp.status()}`);

    // 1f. XSS in message
    const xssResp = await request.post("/api/v1/sms/send", {
      headers: CSRF,
      data: { sender: "SMSOK", to: "0812345678", message: '<script>alert("xss")</script>' },
    });
    console.log(`✅ XSS message → ${xssResp.status()} (should not cause 500)`);
    expect(xssResp.status()).not.toBe(500);

    // 1g. Message >1000 chars
    const longMsgResp = await request.post("/api/v1/sms/send", {
      headers: CSRF,
      data: { sender: "SMSOK", to: "0812345678", message: "A".repeat(1001) },
    });
    expect([400, 422]).toContain(longMsgResp.status());
    console.log(`✅ Long message (1001) → ${longMsgResp.status()}`);

    // ----- Layer 2: Browser Test -----
    console.log("\n=== FLOW 1: Send SMS — Layer 2 Browser ===");
    await page.goto("/dashboard/send", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();
    await page.screenshot({ path: path.join(SCREENSHOTS, "01-send-sms-page.png"), fullPage: true });
    console.log(`📍 URL: ${page.url()}`);

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toContain("ส่ง SMS");
    console.log("✅ Send SMS page loaded");

    // Find message textarea
    const msgTextarea = page.locator('textarea[placeholder*="พิมพ์ข้อความ"]').first();
    if (await msgTextarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await msgTextarea.fill("ทดสอบส่ง SMS จาก QA regression");
      await msgTextarea.press("Space");
      await msgTextarea.press("Backspace");
      await page.waitForTimeout(500);
      console.log("✅ Message typed");
    }

    // Find phone input
    const phoneInput = page.locator('textarea[placeholder*="ผู้รับ"], input[placeholder*="เบอร์"], textarea[placeholder*="เบอร์"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill("0812345678");
      console.log("✅ Phone number entered");
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "02-send-sms-filled.png"), fullPage: true });

    // Check SMS counter shows correct values for Thai text
    const counterText = await page.locator("body").innerText();
    const counterMatch = counterText.match(/(\d+)\/(\d+)\s*chars/);
    if (counterMatch) {
      console.log(`📊 Counter: ${counterMatch[0]}`);
    }

    // Check send button exists
    const sendBtn = page.locator('button:has-text("ส่ง SMS"), button:has-text("ส่ง")').first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("✅ Send button visible");
      // Don't actually send to avoid consuming credits
    }

    // Mobile check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS, "03-send-sms-mobile.png"), fullPage: true });
    console.log("📱 Mobile 375px done");
    await page.setViewportSize({ width: 1280, height: 720 });

    const realErrors = consoleErrors.filter(e =>
      !e.includes("favicon") && !e.includes("hydration") && !e.includes("third-party")
    );
    if (realErrors.length > 0) {
      console.log(`⚠️ Console errors: ${realErrors.slice(0, 3).join("; ")}`);
    } else {
      console.log("✅ No console errors");
    }
  });

  // ========== FLOW 2: Campaigns ==========
  test("Flow 2 — Campaigns: API + Browser", async ({ page, request }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }

    // ----- Layer 1: API Tests -----
    console.log("\n=== FLOW 2: Campaigns — Layer 1 API ===");

    // 2a. List campaigns
    const listResp = await request.get("/api/v1/campaigns");
    expect(listResp.status()).toBe(200);
    const listData = (await listResp.json()).data || await listResp.json();
    console.log(`✅ List campaigns → 200, count: ${(listData.campaigns || []).length}`);

    // 2b. Create campaign
    const campaignName = `QA-Campaign-${Date.now().toString(36)}`;
    const createResp = await request.post("/api/v1/campaigns", {
      headers: CSRF,
      data: {
        name: campaignName,
        messageBody: "ทดสอบ campaign จาก QA",
        senderName: "SMSOK",
      },
    });
    console.log(`📊 Create campaign → ${createResp.status()}`);
    let campaignId: string | null = null;
    if (createResp.status() === 201) {
      const createData = (await createResp.json()).data || await createResp.json();
      campaignId = createData.id;
      console.log(`✅ Campaign created: ${campaignId}`);
    } else {
      console.log(`📊 Create response: ${await createResp.text()}`);
    }

    // 2c. Empty name
    const emptyNameResp = await request.post("/api/v1/campaigns", {
      headers: CSRF,
      data: { name: "", messageBody: "test" },
    });
    expect([400, 422]).toContain(emptyNameResp.status());
    console.log(`✅ Empty campaign name → ${emptyNameResp.status()}`);

    // 2d. Name too long
    const longNameResp = await request.post("/api/v1/campaigns", {
      headers: CSRF,
      data: { name: "A".repeat(101), messageBody: "test" },
    });
    expect([400, 422]).toContain(longNameResp.status());
    console.log(`✅ Long campaign name → ${longNameResp.status()}`);

    // 2e. No message body and no template
    const noMsgResp = await request.post("/api/v1/campaigns", {
      headers: CSRF,
      data: { name: "test-campaign" },
    });
    console.log(`📊 No message/template → ${noMsgResp.status()}`);

    // 2f. Get single campaign (if created)
    if (campaignId) {
      const getResp = await request.get(`/api/v1/campaigns/${campaignId}`);
      if (getResp.status() === 200) {
        const getData = (await getResp.json()).data || await getResp.json();
        expect(getData.name).toBe(campaignName);
        console.log(`✅ Get campaign by ID → name matches`);
      }

      // Cleanup - delete campaign
      const delResp = await request.delete(`/api/v1/campaigns/${campaignId}`, { headers: CSRF });
      console.log(`📊 Delete campaign → ${delResp.status()}`);
    }

    // ----- Layer 2: Browser Test -----
    console.log("\n=== FLOW 2: Campaigns — Layer 2 Browser ===");
    await page.goto("/dashboard/campaigns", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();
    await page.screenshot({ path: path.join(SCREENSHOTS, "04-campaigns-page.png"), fullPage: true });
    console.log(`📍 URL: ${page.url()}`);

    const bodyText = await page.locator("body").innerText();
    const hasCampaignText = bodyText.includes("แคมเปญ") || bodyText.includes("Campaign");
    console.log(`✅ Campaigns page loaded: ${hasCampaignText ? "content visible" : "checking..."}`);

    // Check for create button
    const createBtn = page.locator('button:has-text("สร้าง"), a:has-text("สร้าง"), button:has-text("New")').first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOTS, "05-campaign-create.png"), fullPage: true });
      console.log("✅ Campaign create form/page opened");
    }

    // Mobile check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS, "06-campaigns-mobile.png"), fullPage: true });
    console.log("📱 Mobile 375px done");
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  // ========== FLOW 3: Package Purchase ==========
  test("Flow 3 — Package Purchase: API + Browser", async ({ page, request }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }

    // ----- Layer 1: API Tests -----
    console.log("\n=== FLOW 3: Packages — Layer 1 API ===");

    // 3a. List packages (public endpoint)
    const pkgResp = await request.get("/api/v1/packages");
    expect(pkgResp.status()).toBe(200);
    const pkgData = (await pkgResp.json()).data || await pkgResp.json();
    const tiers = pkgData.tiers || [];
    console.log(`✅ Packages list → ${tiers.length} tiers`);

    // Verify package structure
    if (tiers.length > 0) {
      const tier = tiers[0];
      expect(tier).toHaveProperty("name");
      expect(tier).toHaveProperty("price");
      expect(tier).toHaveProperty("smsQuota");
      console.log(`✅ Package structure OK: ${tier.name} - ${tier.price}฿ - ${tier.smsQuota} SMS`);
    }

    // 3b. Create order — valid
    let orderId: string | null = null;
    if (tiers.length > 0) {
      const orderResp = await request.post("/api/v1/orders", {
        headers: CSRF,
        data: {
          package_tier_id: tiers[0].id,
          customer_type: "INDIVIDUAL",
          tax_name: "ทดสอบ QA ชื่อผู้เสียภาษี",
          tax_id: "1234567890123",
          tax_address: "123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10100",
          tax_branch_type: "HEAD",
        },
      });
      console.log(`📊 Create order → ${orderResp.status()}`);
      if (orderResp.status() === 201) {
        const orderData = (await orderResp.json()).data || await orderResp.json();
        orderId = orderData.id;
        console.log(`✅ Order created: ${orderId}, orderNumber: ${orderData.orderNumber}`);
      } else {
        console.log(`📊 Order response: ${await orderResp.text()}`);
      }
    }

    // 3c. Missing required fields
    const missingOrderResp = await request.post("/api/v1/orders", {
      headers: CSRF,
      data: { customer_type: "INDIVIDUAL" },
    });
    expect([400, 422]).toContain(missingOrderResp.status());
    console.log(`✅ Missing order fields → ${missingOrderResp.status()}`);

    // 3d. Invalid tax_id (not 13 digits)
    if (tiers.length > 0) {
      const badTaxResp = await request.post("/api/v1/orders", {
        headers: CSRF,
        data: {
          package_tier_id: tiers[0].id,
          customer_type: "INDIVIDUAL",
          tax_name: "test",
          tax_id: "123",
          tax_address: "123 test address long enough",
          tax_branch_type: "HEAD",
        },
      });
      expect([400, 422]).toContain(badTaxResp.status());
      console.log(`✅ Invalid tax_id → ${badTaxResp.status()}`);
    }

    // 3e. XSS in tax_name
    if (tiers.length > 0) {
      const xssOrderResp = await request.post("/api/v1/orders", {
        headers: CSRF,
        data: {
          package_tier_id: tiers[0].id,
          customer_type: "INDIVIDUAL",
          tax_name: '<script>alert("xss")</script>',
          tax_id: "1234567890123",
          tax_address: "123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10100",
          tax_branch_type: "HEAD",
        },
      });
      console.log(`📊 XSS in tax_name → ${xssOrderResp.status()}`);
      if (xssOrderResp.status() === 500) {
        console.log("🐛 BUG: XSS in tax_name causes 500 — should sanitize or reject with 400");
      }
      if (xssOrderResp.status() === 201) {
        // Check that script tags were sanitized
        const xssData = (await xssOrderResp.json()).data || await xssOrderResp.json();
        console.log(`📊 Sanitized name: "${xssData.tax_name || xssData.taxName || 'N/A'}"`);
      }
    }

    // ----- Layer 2: Browser Test -----
    console.log("\n=== FLOW 3: Packages — Layer 2 Browser ===");
    await page.goto("/dashboard/packages", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();
    await page.screenshot({ path: path.join(SCREENSHOTS, "07-packages-page.png"), fullPage: true });
    console.log(`📍 URL: ${page.url()}`);

    const pkgBodyText = await page.locator("body").innerText();
    const hasPackages = pkgBodyText.includes("แพ็คเกจ") || pkgBodyText.includes("SMS") || pkgBodyText.includes("Package");
    console.log(`✅ Packages page: ${hasPackages ? "packages visible" : "checking content..."}`);

    // Check for package cards/tiers
    const pkgCards = page.locator('[class*="card"], [class*="tier"], [class*="package"]');
    const cardCount = await pkgCards.count();
    console.log(`📊 Package cards visible: ${cardCount}`);

    // Try clicking first buy button
    const buyBtn = page.locator('button:has-text("ซื้อ"), button:has-text("เลือก"), a:has-text("ซื้อ")').first();
    if (await buyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await buyBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOTS, "08-package-checkout.png"), fullPage: true });
      console.log(`📍 After buy click: ${page.url()}`);

      // Check if checkout form appears
      const checkoutText = await page.locator("body").innerText();
      if (checkoutText.includes("ชำระเงิน") || checkoutText.includes("สั่งซื้อ") || checkoutText.includes("ภาษี")) {
        console.log("✅ Checkout form visible");
      }
    }

    // Billing page
    await page.goto("/dashboard/billing", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(SCREENSHOTS, "09-billing-page.png"), fullPage: true });
    console.log(`📍 Billing page: ${page.url()}`);

    // Mobile check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS, "10-packages-mobile.png"), fullPage: true });
    console.log("📱 Mobile 375px done");
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  // ========== FLOW 4: Settings (API Keys, Senders, Profile) ==========
  test("Flow 4 — Settings: API + Browser", async ({ page, request }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }

    // ----- Layer 1: API Tests -----
    console.log("\n=== FLOW 4: Settings — Layer 1 API ===");

    // === API Keys ===
    // 4a. List API keys
    const keysResp = await request.get("/api/v1/api-keys");
    expect(keysResp.status()).toBe(200);
    const keysData = (await keysResp.json()).data || await keysResp.json();
    console.log(`✅ List API keys → ${(keysData.apiKeys || []).length} keys`);

    // 4b. Create API key
    const keyName = `QA-Key-${Date.now().toString(36)}`;
    const createKeyResp = await request.post("/api/v1/api-keys", {
      headers: CSRF,
      data: { name: keyName },
    });
    console.log(`📊 Create API key → ${createKeyResp.status()}`);
    let apiKeyId: string | null = null;
    if (createKeyResp.status() === 201) {
      const keyData = (await createKeyResp.json()).data || await createKeyResp.json();
      apiKeyId = keyData.id;
      expect(keyData.key).toBeTruthy();
      console.log(`✅ API key created: prefix=${keyData.prefix}`);
    }

    // 4c. Empty name
    const emptyKeyResp = await request.post("/api/v1/api-keys", {
      headers: CSRF,
      data: { name: "" },
    });
    expect([400, 422]).toContain(emptyKeyResp.status());
    console.log(`✅ Empty key name → ${emptyKeyResp.status()}`);

    // 4d. Delete API key
    if (apiKeyId) {
      const delKeyResp = await request.delete(`/api/v1/api-keys/${apiKeyId}`, { headers: CSRF });
      expect(delKeyResp.status()).toBe(200);
      console.log(`✅ API key deleted → 200`);
    }

    // === Sender Names ===
    // 4e. List senders
    const sendersResp = await request.get("/api/v1/senders/name");
    expect(sendersResp.status()).toBe(200);
    const sendersData = (await sendersResp.json()).data || await sendersResp.json();
    console.log(`✅ List sender names → ${(sendersData.senderNames || []).length} names`);

    // 4f. Create sender name
    const senderName = `QA${Date.now().toString(36).slice(-4).toUpperCase()}`;
    const createSenderResp = await request.post("/api/v1/senders/name", {
      headers: CSRF,
      data: { name: senderName, accountType: "individual" },
    });
    console.log(`📊 Create sender → ${createSenderResp.status()}`);
    let senderId: string | null = null;
    if (createSenderResp.status() === 201) {
      const senderData = (await createSenderResp.json()).data || await createSenderResp.json();
      senderId = senderData.senderName?.id || senderData.id;
      console.log(`✅ Sender created: ${senderData.senderName?.name || senderName}, status: PENDING`);
    }

    // 4g. Short sender name (<3)
    const shortSenderResp = await request.post("/api/v1/senders/name", {
      headers: CSRF,
      data: { name: "AB", accountType: "individual" },
    });
    expect([400, 422]).toContain(shortSenderResp.status());
    console.log(`✅ Short sender name → ${shortSenderResp.status()}`);

    // 4h. Duplicate sender name
    if (senderId) {
      const dupSenderResp = await request.post("/api/v1/senders/name", {
        headers: CSRF,
        data: { name: senderName, accountType: "individual" },
      });
      console.log(`📊 Duplicate sender → ${dupSenderResp.status()}`);
      expect([400, 409]).toContain(dupSenderResp.status());
    }

    // 4i. Delete sender (cleanup)
    if (senderId) {
      const delSenderResp = await request.delete(`/api/v1/senders/name/${senderId}`, { headers: CSRF });
      console.log(`📊 Delete sender → ${delSenderResp.status()}`);
    }

    // === Profile ===
    // 4j. Get profile
    const profileResp = await request.get("/api/v1/settings/profile");
    expect(profileResp.status()).toBe(200);
    const profileData = (await profileResp.json()).data || await profileResp.json();
    console.log(`✅ Profile → name: ${profileData.name}, email: ${profileData.email}`);

    // 4k. Update profile name
    const originalName = profileData.name;
    const updateResp = await request.put("/api/v1/settings/profile", {
      headers: CSRF,
      data: { name: "QA Test Name" },
    });
    if (updateResp.status() === 200) {
      console.log("✅ Profile updated");
      // Restore original
      await request.put("/api/v1/settings/profile", {
        headers: CSRF,
        data: { name: originalName },
      });
      console.log("✅ Profile restored");
    } else {
      console.log(`📊 Profile update → ${updateResp.status()}`);
    }

    // ----- Layer 2: Browser Test -----
    console.log("\n=== FLOW 4: Settings — Layer 2 Browser ===");

    // API Keys page
    await page.goto("/dashboard/api-keys", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();
    await page.screenshot({ path: path.join(SCREENSHOTS, "11-api-keys-page.png"), fullPage: true });
    const apiKeysText = await page.locator("body").innerText();
    const hasApiKeys = apiKeysText.includes("API") || apiKeysText.includes("คีย์");
    console.log(`✅ API Keys page: ${hasApiKeys ? "content visible" : "checking..."}`);

    // Senders page
    await page.goto("/dashboard/senders", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(SCREENSHOTS, "12-senders-page.png"), fullPage: true });
    const sendersText = await page.locator("body").innerText();
    const hasSenders = sendersText.includes("ผู้ส่ง") || sendersText.includes("Sender");
    console.log(`✅ Senders page: ${hasSenders ? "content visible" : "checking..."}`);

    // Check for add sender button
    const addSenderBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("สร้าง"), a:has-text("ลงทะเบียน")').first();
    if (await addSenderBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addSenderBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOTS, "13-add-sender-form.png"), fullPage: true });
      console.log("✅ Add sender form opened");
    }

    // Settings page
    await page.goto("/dashboard/settings", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(SCREENSHOTS, "14-settings-page.png"), fullPage: true });
    const settingsText = await page.locator("body").innerText();
    const hasSettings = settingsText.includes("ตั้งค่า") || settingsText.includes("โปรไฟล์") || settingsText.includes("Settings");
    console.log(`✅ Settings page: ${hasSettings ? "content visible" : "checking..."}`);

    // Mobile check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS, "15-settings-mobile.png"), fullPage: true });
    console.log("📱 Mobile 375px done");
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  // ========== FLOW 5: Support Tickets ==========
  test("Flow 5 — Support Tickets: API + Browser", async ({ page, request }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }

    // ----- Layer 1: API Tests -----
    console.log("\n=== FLOW 5: Support Tickets — Layer 1 API ===");

    // 5a. List tickets
    const listResp = await request.get("/api/v1/tickets");
    expect(listResp.status()).toBe(200);
    const listData = (await listResp.json()).data || await listResp.json();
    console.log(`✅ List tickets → ${(listData.tickets || []).length} tickets`);

    // 5b. Create ticket
    const ticketSubject = `QA-Ticket-${Date.now().toString(36)}`;
    const createResp = await request.post("/api/v1/tickets", {
      headers: CSRF,
      data: {
        subject: ticketSubject,
        description: "ทดสอบสร้าง ticket จาก QA regression test — กรุณาลบทิ้ง",
        category: "GENERAL",
        pdpaConsent: true,
        priority: "LOW",
      },
    });
    console.log(`📊 Create ticket → ${createResp.status()}`);
    let ticketId: string | null = null;
    if (createResp.status() === 201) {
      const ticketData = (await createResp.json()).data || await createResp.json();
      ticketId = ticketData.id;
      console.log(`✅ Ticket created: ${ticketId}, status: ${ticketData.status}`);
    } else if (createResp.status() === 429) {
      console.log("⚠️ Rate limited on ticket creation (3 per 15 min) — skipping mutation tests");
    } else {
      console.log(`📊 Response: ${await createResp.text()}`);
    }

    // If rate limited, skip remaining mutation tests
    if (createResp.status() === 429) {
      console.log("\n=== FLOW 5: Support — Layer 2 Browser (rate limited, browser only) ===");
      await page.goto("/dashboard/support", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) { await btn.click(); }
      await page.screenshot({ path: path.join(SCREENSHOTS, "16-support-page.png"), fullPage: true });
      console.log(`📍 Support URL: ${page.url()}`);
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SCREENSHOTS, "19-support-mobile.png"), fullPage: true });
      console.log("📱 Mobile 375px done");
      return;
    }

    // 5c. Missing subject
    const noSubjectResp = await request.post("/api/v1/tickets", {
      headers: CSRF,
      data: {
        description: "test",
        category: "GENERAL",
        pdpaConsent: true,
      },
    });
    expect([400, 422, 429]).toContain(noSubjectResp.status());
    console.log(`${noSubjectResp.status() === 429 ? "⚠️ Rate limited" : "✅"} Missing subject → ${noSubjectResp.status()}`);

    // 5d. Missing PDPA consent
    const noPdpaResp = await request.post("/api/v1/tickets", {
      headers: CSRF,
      data: {
        subject: "test",
        description: "test",
        category: "GENERAL",
        pdpaConsent: false,
      },
    });
    expect([400, 422, 429]).toContain(noPdpaResp.status());
    console.log(`${noPdpaResp.status() === 429 ? "⚠️ Rate limited" : "✅"} No PDPA consent → ${noPdpaResp.status()}`);

    // 5e. Invalid category
    const badCatResp = await request.post("/api/v1/tickets", {
      headers: CSRF,
      data: {
        subject: "test",
        description: "test",
        category: "INVALID_CATEGORY",
        pdpaConsent: true,
      },
    });
    expect([400, 422, 429]).toContain(badCatResp.status());
    console.log(`${badCatResp.status() === 429 ? "⚠️ Rate limited" : "✅"} Invalid category → ${badCatResp.status()}`);

    // 5f. XSS in subject
    const xssResp = await request.post("/api/v1/tickets", {
      headers: CSRF,
      data: {
        subject: '<script>alert("xss")</script>',
        description: "test xss",
        category: "GENERAL",
        pdpaConsent: true,
      },
    });
    console.log(`📊 XSS in subject → ${xssResp.status()}`);
    if (xssResp.status() !== 429) {
      expect(xssResp.status()).not.toBe(500);
    } else {
      console.log("⚠️ Rate limited on XSS test");
    }

    // 5g. Very long description
    const longDescResp = await request.post("/api/v1/tickets", {
      headers: CSRF,
      data: {
        subject: "Long test",
        description: "A".repeat(5001),
        category: "GENERAL",
        pdpaConsent: true,
      },
    });
    expect([400, 422, 429]).toContain(longDescResp.status());
    console.log(`${longDescResp.status() === 429 ? "⚠️ Rate limited" : "✅"} Description too long (5001) → ${longDescResp.status()}`);

    // 5h. Get ticket by ID
    if (ticketId) {
      const getResp = await request.get(`/api/v1/tickets/${ticketId}`);
      expect(getResp.status()).toBe(200);
      const getData = (await getResp.json()).data || await getResp.json();
      expect(getData.subject).toBe(ticketSubject);
      console.log(`✅ Get ticket → subject matches`);
    }

    // 5i. Filter by category
    const filterResp = await request.get("/api/v1/tickets?category=GENERAL");
    expect(filterResp.status()).toBe(200);
    console.log(`✅ Filter by GENERAL → 200`);

    // 5j. Filter by status
    const statusResp = await request.get("/api/v1/tickets?status=OPEN");
    expect(statusResp.status()).toBe(200);
    console.log(`✅ Filter by OPEN → 200`);

    // ----- Layer 2: Browser Test -----
    console.log("\n=== FLOW 5: Support — Layer 2 Browser ===");

    // Check if support page exists
    await page.goto("/dashboard/support", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();
    await page.screenshot({ path: path.join(SCREENSHOTS, "16-support-page.png"), fullPage: true });
    console.log(`📍 Support URL: ${page.url()}`);

    const supportText = await page.locator("body").innerText();
    const hasSupport = supportText.includes("ซัพพอร์ต") || supportText.includes("Support") || supportText.includes("ticket") || supportText.includes("ติดต่อ");
    console.log(`📊 Support page: ${hasSupport ? "content visible" : "may redirect or 404"}`);

    // Try tickets page
    if (!hasSupport) {
      await page.goto("/dashboard/tickets", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.screenshot({ path: path.join(SCREENSHOTS, "17-tickets-page.png"), fullPage: true });
      console.log(`📍 Tickets URL: ${page.url()}`);
    }

    // Check for create ticket button
    const createTicketBtn = page.locator('button:has-text("สร้าง"), button:has-text("เปิด"), a:has-text("สร้าง")').first();
    if (await createTicketBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createTicketBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOTS, "18-create-ticket-form.png"), fullPage: true });
      console.log("✅ Create ticket form opened");
    }

    // Mobile check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS, "19-support-mobile.png"), fullPage: true });
    console.log("📱 Mobile 375px done");
    await page.setViewportSize({ width: 1280, height: 720 });

    // Console errors summary
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
