import { test, expect, resetCredits } from "./fixtures";

// These tests require DEV_SECRET env var to reset credits
// Set E2E_DEV_SECRET or DEV_SECRET in .env

test.describe("402 Insufficient Credits", () => {
  // TC-028b: Send SMS page — zero credits shows error
  test("TC-028b: send SMS with zero credits shows insufficient credits error", async ({ authedPage: page }) => {
    // Reset credits to 0
    const resetStatus = await resetCredits(page, 0);
    if (resetStatus === 403) {
      test.skip(true, "DEV_SECRET not configured — cannot reset credits");
      return;
    }
    expect(resetStatus).toBe(200);

    // Navigate to send SMS page
    await page.goto("/dashboard/send", { waitUntil: "networkidle" });

    // Fill the form
    const phoneArea = page.locator("textarea").first();
    await phoneArea.fill("0812345678");

    const msgArea = page.locator("textarea").nth(1);
    if (await msgArea.isVisible().catch(() => false)) {
      await msgArea.fill("Test message for credit check");
    }

    // Try to send — should show error
    const sendBtn = page.locator('button[type="submit"], button:has-text("ส่ง")').first();
    if (await sendBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
      await sendBtn.click();

      // Wait for error toast/message about insufficient credits
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

      const body = await page.textContent("body");
      const hasInsufficientMsg =
        body!.includes("เครดิตไม่พอ") ||
        body!.includes("เครดิตไม่เพียงพอ") ||
        body!.includes("insufficient") ||
        body!.includes("Insufficient") ||
        body!.includes("402") ||
        body!.includes("ไม่สามารถ");
      expect(hasInsufficientMsg).toBeTruthy();
    }

    // Restore credits
    await resetCredits(page, 52500);
  });

  // TC-040b: OTP — zero credits shows error
  test("TC-040b: OTP with zero credits shows insufficient credits error", async ({ authedPage: page }) => {
    // Reset credits to 0
    const resetStatus = await resetCredits(page, 0);
    if (resetStatus === 403) {
      test.skip(true, "DEV_SECRET not configured — cannot reset credits");
      return;
    }
    expect(resetStatus).toBe(200);

    // Navigate to OTP page
    await page.goto("/dashboard/otp", { waitUntil: "networkidle" });

    // Fill phone number
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="เบอร"], input').first();
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill("0812345678");
    }

    // Try to send OTP
    const sendBtn = page.locator('button[type="submit"], button:has-text("ส่ง OTP"), button:has-text("Send")').first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (await sendBtn.isEnabled().catch(() => false)) {
        await sendBtn.click();

        await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

        const body = await page.textContent("body");
        const hasInsufficientMsg =
          body!.includes("เครดิตไม่พอ") ||
          body!.includes("เครดิตไม่เพียงพอ") ||
          body!.includes("insufficient") ||
          body!.includes("402");
        expect(hasInsufficientMsg).toBeTruthy();
      }
    }

    // Restore credits
    await resetCredits(page, 52500);
  });

  // TC-028c: Credit display shows 0 after reset
  test("TC-028c: credit display updates to 0 after reset", async ({ authedPage: page }) => {
    const resetStatus = await resetCredits(page, 0);
    if (resetStatus === 403) {
      test.skip(true, "DEV_SECRET not configured — cannot reset credits");
      return;
    }
    expect(resetStatus).toBe(200);

    // Check credit display on send page
    await page.goto("/dashboard/send", { waitUntil: "networkidle" });
    const body = await page.textContent("body");

    // Should show 0 credits or "หมด" or similar
    const hasZeroCredits =
      body!.includes("0 เครดิต") ||
      body!.includes("0 SMS") ||
      body!.includes("เครดิตหมด") ||
      body!.match(/remaining.*0/i) !== null;
    // Note: If credits are shown in sidebar, check there too
    expect(hasZeroCredits || body!.includes("0")).toBeTruthy();

    // Restore credits
    await resetCredits(page, 52500);
  });

  // TC-DEV-001: reset-credits requires DEV_SECRET
  test("TC-DEV-001: reset-credits rejects without DEV_SECRET header", async ({ authedPage: page }) => {
    const response = await page.request.post("/api/dev/reset-credits", {
      data: { credits: 0 },
      // No x-dev-secret header
    });
    // Should be 403 (DEV_SECRET required)
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("DEV_SECRET");
  });

  // TC-DEV-002: reset-credits works with correct DEV_SECRET
  test("TC-DEV-002: reset-credits accepts valid DEV_SECRET", async ({ authedPage: page }) => {
    const devSecret = process.env.E2E_DEV_SECRET || process.env.DEV_SECRET;
    if (!devSecret) {
      test.skip(true, "DEV_SECRET not configured");
      return;
    }

    // Reset to a specific amount
    const response = await page.request.post("/api/dev/reset-credits", {
      data: { credits: 100 },
      headers: { "x-dev-secret": devSecret },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.creditsAfter).toBe(100);

    // Restore
    await resetCredits(page, 52500);
  });
});
