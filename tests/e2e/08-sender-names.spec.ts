import { test, expect } from "./fixtures";

test.describe("Sender Names", () => {
  test("SEND-01: senders page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/senders");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/ชื่อผู้ส่ง|Sender|SMSOK/i);
    await page.screenshot({ path: "test-results/08-senders.png" });
  });

  test("SEND-02: add sender button visible", async ({ authedPage: page }) => {
    await page.goto("/dashboard/senders");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/เพิ่ม|สร้าง|ขอชื่อ|Add|Create/i);
  });

  test("SEND-03: no console errors on senders page", async ({ authedPage: page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
    await page.goto("/dashboard/senders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    expect(realErrors).toHaveLength(0);
  });
});
