import { test, expect } from "./fixtures";

test.describe("Settings & Profile", () => {
  test("SET-01: settings page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/โปรไฟล์|Profile|ตั้งค่า|Settings|อีเมล|email/i);
    await page.screenshot({ path: "test-results/11-settings.png" });
  });

  test("SET-02: profile shows current user info", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/QA|Judge|qa-judge2@smsok\.test/i);
  });

  test("SET-03: password change section exists", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/รหัสผ่าน|Password|เปลี่ยน/i);
  });

  test("SET-04: API keys page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/API|key|คีย์/i);
    await page.screenshot({ path: "test-results/11-api-keys.png" });
  });

  test("SET-05: responsive 375px settings", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle").catch(() => {});
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
  });
});
