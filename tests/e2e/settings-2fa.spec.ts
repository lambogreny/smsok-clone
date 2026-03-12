import { test, expect } from "./fixtures";

// Helper: check if 2FA is enabled on the security page
// IMPORTANT: "เปิดอยู่" contains "ปิดอยู่" as substring in Thai!
// Must check "เปิดอยู่" FIRST or use precise matching.
async function is2FAEnabled(page: import("@playwright/test").Page): Promise<boolean> {
  const body = await page.textContent("body");
  // Check for the full status text "สถานะ: เปิดอยู่" to avoid substring collision
  if (body!.includes("สถานะ: เปิดอยู่")) return true;
  if (body!.includes("สถานะ: ปิดอยู่")) return false;
  // Fallback: check button text (unambiguous)
  const disableBtn = page.locator("button").filter({ hasText: /^ปิด 2FA$/ });
  if (await disableBtn.isVisible({ timeout: 1000 }).catch(() => false)) return true;
  return false;
}

test.describe("2FA Settings UI", () => {
  // TC-200: Security settings page loads with 2FA section
  test("TC-200: security settings loads with 2FA section", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/security", { waitUntil: "networkidle" });

    // Page should have security heading (use getByRole to avoid sidebar h1 collision)
    const heading = page.getByRole("heading", { name: "ความปลอดภัย" });
    await expect(heading).toBeVisible();

    // 2FA section should be present
    const body = await page.textContent("body");
    expect(body).toContain("2FA");
    expect(body).toContain("การยืนยันตัวตนสองขั้นตอน");
  });

  // TC-201: 2FA shows status and action button
  test("TC-201: 2FA shows status and action button", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/security", { waitUntil: "networkidle" });

    // Wait for 2FA status to load (replaces skeleton)
    await page.waitForFunction(
      () => !document.querySelector(".animate-pulse"),
      { timeout: 10000 }
    ).catch(() => {});

    const body = await page.textContent("body");
    // Should show either "เปิดอยู่" (enabled) or "ปิดอยู่" (disabled)
    // Note: "เปิดอยู่" contains "ปิดอยู่" as substring, so check "เปิดอยู่" first
    const hasStatus = body!.includes("เปิดอยู่") || body!.includes("ปิดอยู่");
    expect(hasStatus).toBeTruthy();

    // Should have an action button (enable or disable)
    const actionBtn = page.locator("button").filter({
      hasText: /เปิดใช้ 2FA|ปิด 2FA/,
    }).first();
    await expect(actionBtn).toBeVisible();
  });

  // TC-202: 2FA setup/management UI
  test("TC-202: 2FA setup or management UI is functional", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/security", { waitUntil: "networkidle" });

    // Wait for loading to finish
    await page.waitForFunction(
      () => !document.querySelector(".animate-pulse"),
      { timeout: 10000 }
    ).catch(() => {});

    const enabled = await is2FAEnabled(page);

    if (!enabled) {
      // 2FA disabled — click enable, verify dialog opens
      const enableBtn = page.locator("button").filter({
        hasText: /เปิดใช้ 2FA/,
      }).first();
      await enableBtn.click();

      // Dialog should open with QR code or setup content
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      const dialogText = await dialog.textContent();
      const hasSetupContent =
        dialogText!.includes("QR Code") ||
        dialogText!.includes("Authenticator") ||
        dialogText!.includes("สแกน") ||
        dialogText!.includes("ขั้นตอน");
      expect(hasSetupContent).toBeTruthy();

      // Close dialog
      const cancelBtn = dialog.locator("button").filter({ hasText: /ยกเลิก/ }).first();
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
      }
    } else {
      // 2FA already enabled — verify disable and regenerate buttons exist
      const disableBtn = page.locator("button").filter({ hasText: /ปิด 2FA/ }).first();
      await expect(disableBtn).toBeVisible();

      const regenBtn = page.locator("button").filter({ hasText: /Backup Codes/ }).first();
      await expect(regenBtn).toBeVisible();
    }
  });

  // TC-203: Disable 2FA dialog requires password
  test("TC-203: disable 2FA dialog shows password confirmation", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/security", { waitUntil: "networkidle" });

    await page.waitForFunction(
      () => !document.querySelector(".animate-pulse"),
      { timeout: 10000 }
    ).catch(() => {});

    const enabled = await is2FAEnabled(page);

    if (enabled) {
      // 2FA is enabled — click disable
      const disableBtn = page.locator("button").filter({ hasText: /ปิด 2FA/ }).first();
      await disableBtn.click();

      // Dialog should open with password field
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const dialogText = await dialog.textContent();
      expect(dialogText).toContain("รหัสผ่าน");

      // Password input should be present
      const passwordInput = dialog.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible();

      // Cancel
      const cancelBtn = dialog.locator("button").filter({ hasText: /ยกเลิก/ }).first();
      await cancelBtn.click();
    } else {
      // 2FA not enabled — skip this test scenario
      test.skip(true, "2FA not enabled on test account — cannot test disable flow");
    }
  });

  // TC-204: Sessions section visible on security page
  test("TC-204: security page shows active sessions section", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/security", { waitUntil: "networkidle" });

    // Should have sessions section or device info
    const body = await page.textContent("body");
    const hasSessionContent =
      body!.includes("Session") ||
      body!.includes("เซสชัน") ||
      body!.includes("อุปกรณ์") ||
      body!.includes("device") ||
      body!.includes("เข้าสู่ระบบ");
    expect(hasSessionContent).toBeTruthy();
  });

  // TC-205: 2FA section has proper Nansen DNA styling
  test("TC-205: 2FA section uses CSS variables (Nansen DNA)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/security", { waitUntil: "networkidle" });

    await page.waitForFunction(
      () => !document.querySelector(".animate-pulse"),
      { timeout: 10000 }
    ).catch(() => {});

    // Check that the page uses CSS vars, not hardcoded hex
    const hasHardcodedV2 = await page.evaluate(() => {
      const body = document.body.innerHTML;
      // Check for v2 palette colors that should be replaced
      return body.includes("#0AE99C") || body.includes("#0ae99c") || body.includes("rgb(10, 233, 156)");
    });
    expect(hasHardcodedV2).toBe(false);

    // Verify accent color is applied via CSS vars
    const accentUsed = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      const accent = styles.getPropertyValue("--accent").trim();
      return accent.length > 0;
    });
    expect(accentUsed).toBeTruthy();
  });
});
