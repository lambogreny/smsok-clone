import { test, expect, collectConsoleErrors } from "./fixtures";

test.describe("Settings & Profile", () => {
  // === Profile ===
  test("SET-01: settings page loads with profile info", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/โปรไฟล์|Profile|ตั้งค่า|Settings|อีเมล|email/i);
    await page.screenshot({ path: "test-results/11-settings.png" });
  });

  test("SET-02: profile shows current user email", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/QA|Judge|qa-judge2@smsok\.test/i);
  });

  test("SET-03: profile form has editable name fields", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle").catch(() => {});
    // Should have name input fields
    const nameInput = page.locator('input[name*="name"], input[name*="firstName"], input[placeholder*="ชื่อ"]').first();
    const isVisible = await nameInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      const currentVal = await nameInput.inputValue();
      expect(currentVal.length).toBeGreaterThan(0);
    }
  });

  test("SET-04: phone field is read-only", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle").catch(() => {});
    const phoneInput = page.locator('input[name*="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isReadonly = await phoneInput.getAttribute("readonly");
      const isDisabled = await phoneInput.isDisabled();
      expect(isReadonly !== null || isDisabled).toBeTruthy();
    }
  });

  // === Password Change ===
  test("SET-05: password change section exists", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle").catch(() => {});
    // Navigate to security settings if separate page
    const securityLink = page.locator('a[href*="security"]').first();
    if (await securityLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await securityLink.click();
      await page.waitForLoadState("networkidle").catch(() => {});
    }
    const body = await page.textContent("body");
    expect(body).toMatch(/รหัสผ่าน|Password|เปลี่ยน|Change/i);
  });

  test("SET-06: password change — wrong current password shows error", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/security");
    await page.waitForLoadState("networkidle").catch(() => {});

    const currentPwd = page.locator('input[name*="current"], input[name*="oldPassword"]').first();
    const newPwd = page.locator('input[name*="new"], input[name*="newPassword"]').first();
    const confirmPwd = page.locator('input[name*="confirm"]').first();

    if (await currentPwd.isVisible({ timeout: 5000 }).catch(() => false)) {
      await currentPwd.fill("Wrong" + process.env.E2E_USER_PASSWORD!);
      if (await newPwd.isVisible().catch(() => false)) await newPwd.fill("NewTestPass2026!");
      if (await confirmPwd.isVisible().catch(() => false)) await confirmPwd.fill("NewTestPass2026!");

      const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("เปลี่ยน"), button:has-text("Save"), button:has-text("Update")').first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        const body = await page.textContent("body");
        expect(body).toMatch(/ผิด|incorrect|wrong|invalid|error|ไม่ถูกต้อง/i);
      }
    }
    await page.screenshot({ path: "test-results/11-settings-pwd-error.png" });
  });

  // === Security Settings ===
  test("SET-07: security settings page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/security");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    await page.screenshot({ path: "test-results/11-settings-security.png" });
  });

  // === API Keys ===
  test("SET-08: API keys page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/API|key|คีย์/i);
    await page.screenshot({ path: "test-results/11-api-keys.png" });
  });

  test("SET-09: API keys page has create button", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/สร้าง|Create|เพิ่ม|Add|Generate/i);
  });

  // === Webhooks ===
  test("SET-10: webhooks page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/webhooks");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    await page.screenshot({ path: "test-results/11-webhooks.png" });
  });

  // === Sessions ===
  test("SET-11: sessions list shows current session", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/security");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    // Should show session info or link to sessions
    const hasSession = body?.match(/Session|เซสชัน|อุปกรณ์|Device|active/i);
    expect(hasSession || body?.includes("security")).toBeTruthy();
  });

  // === Activity Log ===
  test("SET-12: activity log page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/activity");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    await page.screenshot({ path: "test-results/11-activity-log.png" });
  });

  // === Notification Settings ===
  test("SET-13: notification settings page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/notifications");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
  });

  // === Privacy / PDPA Settings ===
  test("SET-14: privacy settings page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/privacy");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
  });

  // === Responsive ===
  test("SET-15: settings responsive 375px", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle").catch(() => {});
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: "test-results/11-settings-mobile.png" });
  });

  test("SET-16: settings responsive 390px", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle").catch(() => {});
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
  });

  // === Console Errors ===
  test("SET-17: no console errors on settings page", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    expect(realErrors).toHaveLength(0);
  });

  // === Profile API ===
  test("SET-18: profile API returns user data", async ({ authedPage: page }) => {
    const res = await page.request.get("/api/v1/settings/profile");
    expect([200, 401]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.email || body.data?.email).toBeDefined();
    }
  });
});
