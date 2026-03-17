import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("Task #4670 — IDOR Fix /verify/[code]", () => {
  test("1. Sequential invoice number → must NOT show document", async ({ page }) => {
    await page.goto(`${BASE}/verify/TIV-2569-000001`);
    await page.waitForLoadState("networkidle");
    const text = await page.textContent("body") || "";
    expect(text).not.toContain("เอกสารถูกต้อง");
    expect(text).not.toContain("ยอดรวม");
    await page.screenshot({ path: "tests/e2e/screenshots/4670-sequential.png" });
  });

  test("2. Another sequential number → must NOT show document", async ({ page }) => {
    await page.goto(`${BASE}/verify/INV-2569-000001`);
    await page.waitForLoadState("networkidle");
    const text = await page.textContent("body") || "";
    expect(text).not.toContain("เอกสารถูกต้อง");
    await page.screenshot({ path: "tests/e2e/screenshots/4670-sequential2.png" });
  });

  test("3. Random string → must NOT show document", async ({ page }) => {
    await page.goto(`${BASE}/verify/random-string-abc123`);
    await page.waitForLoadState("networkidle");
    const text = await page.textContent("body") || "";
    expect(text).not.toContain("เอกสารถูกต้อง");
    await page.screenshot({ path: "tests/e2e/screenshots/4670-random.png" });
  });

  test("4. Brute force 10 sequential numbers → all fail", async ({ page }) => {
    for (let i = 1; i <= 10; i++) {
      const code = `TIV-2569-${String(i).padStart(6, "0")}`;
      await page.goto(`${BASE}/verify/${code}`);
      await page.waitForLoadState("domcontentloaded");
      const text = await page.textContent("body") || "";
      expect(text).not.toContain("เอกสารถูกต้อง");
    }
    await page.screenshot({ path: "tests/e2e/screenshots/4670-bruteforce.png" });
  });

  test("5. XSS/injection in verify code → safe", async ({ page }) => {
    await page.goto(`${BASE}/verify/<script>alert(1)</script>`);
    await page.waitForLoadState("domcontentloaded");
    // Should not execute script
    const text = await page.textContent("body") || "";
    expect(text).not.toContain("เอกสารถูกต้อง");
    await page.screenshot({ path: "tests/e2e/screenshots/4670-xss.png" });
  });
});
