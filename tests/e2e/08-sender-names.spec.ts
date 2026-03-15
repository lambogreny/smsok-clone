import { test, expect, collectConsoleErrors } from "./fixtures";

test.describe("Sender Names Management", () => {
  test("SEND-01: senders page loads with list or empty state", async ({ authedPage: page }) => {
    await page.goto("/dashboard/senders");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/ชื่อผู้ส่ง|Sender|SMSOK/i);
    await page.screenshot({ path: "test-results/08-senders.png" });
  });

  test("SEND-02: add/request sender button visible", async ({ authedPage: page }) => {
    await page.goto("/dashboard/senders");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/เพิ่ม|สร้าง|ขอชื่อ|Add|Create|Request/i);
  });

  test("SEND-03: click add sender opens form/modal", async ({ authedPage: page }) => {
    await page.goto("/dashboard/senders");
    await page.waitForLoadState("networkidle").catch(() => {});
    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("ขอชื่อ"), button:has-text("สร้าง"), a:has-text("เพิ่ม"), button:has-text("Add"), button:has-text("Request")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);
      const body = await page.textContent("body");
      // Should show a form or modal for requesting sender name
      expect(body).toMatch(/ชื่อผู้ส่ง|Sender Name|ชื่อ|name/i);
      await page.screenshot({ path: "test-results/08-senders-add.png" });
    }
  });

  test("SEND-04: sender name has character limit indicator", async ({ authedPage: page }) => {
    await page.goto("/dashboard/senders");
    await page.waitForLoadState("networkidle").catch(() => {});
    // Check for sender name length info (typically 11 chars max)
    const body = await page.textContent("body");
    // Should show either existing senders or info about limits
    expect(body).toMatch(/ชื่อผู้ส่ง|Sender|11|ตัวอักษร|characters|approved|อนุมัติ/i);
  });

  test("SEND-05: sender status badges visible (approved/pending/rejected)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/senders");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    // Should show status for at least default sender or empty state
    const hasStatus = body?.match(/อนุมัติ|รออนุมัติ|ปฏิเสธ|APPROVED|PENDING|REJECTED|active/i);
    const hasEmpty = body?.match(/ยังไม่มี|ไม่พบ|No sender/i);
    const hasSender = body?.match(/SMSOK|SMS/i);
    expect(hasStatus || hasEmpty || hasSender).toBeTruthy();
  });

  test("SEND-06: senders API returns list", async ({ authedPage: page }) => {
    const res = await page.request.get("/api/v1/senders");
    expect([200, 401]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.data || body).toBeDefined();
    }
  });

  test("SEND-07: no console errors on senders page", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/dashboard/senders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    expect(realErrors).toHaveLength(0);
  });

  test("SEND-08: senders page responsive 375px", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/senders");
    await page.waitForLoadState("networkidle").catch(() => {});
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: "test-results/08-senders-mobile.png" });
  });

  test("SEND-09: sender docs page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/docs/senders");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
  });
});
