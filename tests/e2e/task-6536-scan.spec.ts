/**
 * Task #6536 — P0 Full bug scan (no global-setup dependency)
 * Uses manual login to avoid global-setup Prisma crash
 */
import { test as base, expect } from "@playwright/test";
import { dismissCookieConsent, TEST_USER } from "./fixtures";

const SS = "tests/screenshots/task-6536";
const test = base;

async function manualLogin(page: any) {
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await dismissCookieConsent(page);

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  await emailInput.fill(TEST_USER.email);
  await passwordInput.fill(TEST_USER.password);

  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 10000 }
  ).catch(async () => {
    await emailInput.clear();
    await emailInput.type(TEST_USER.email);
    await passwordInput.clear();
    await passwordInput.type(TEST_USER.password);
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 5000 }
    );
  });

  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await dismissCookieConsent(page);
}

test.describe("Full Bug Scan — All Pages", () => {
  const pages = [
    { name: "Dashboard", url: "/dashboard" },
    { name: "ส่ง SMS", url: "/dashboard/send" },
    { name: "ประวัติการส่ง", url: "/dashboard/messages" },
    { name: "บริการ OTP", url: "/dashboard/otp" },
    { name: "เทมเพลต", url: "/dashboard/templates" },
    { name: "ซื้อแพ็กเกจ", url: "/dashboard/billing/packages" },
    { name: "แพ็กเกจของฉัน", url: "/dashboard/packages/my" },
    { name: "ประวัติคำสั่งซื้อ", url: "/dashboard/billing/orders" },
    { name: "รายชื่อผู้ติดต่อ", url: "/dashboard/contacts" },
    { name: "แท็ก", url: "/dashboard/tags" },
    { name: "กลุ่ม", url: "/dashboard/groups" },
    { name: "ชื่อผู้ส่ง", url: "/dashboard/senders" },
    { name: "แคมเปญ", url: "/dashboard/campaigns" },
    { name: "รายงาน", url: "/dashboard/analytics" },
    { name: "คีย์ API", url: "/dashboard/api-keys" },
    { name: "Webhooks", url: "/dashboard/webhooks" },
    { name: "API Logs", url: "/dashboard/logs" },
    { name: "เอกสาร API", url: "/dashboard/api-docs" },
    { name: "ตั้งค่า", url: "/dashboard/settings" },
  ];

  test("Scan all pages after login", async ({ page }) => {
    // Login first
    await manualLogin(page);
    console.log("✅ Logged in successfully");

    const bugs: string[] = [];
    const consoleErrors: string[] = [];
    const serverErrors: string[] = [];

    page.on("console", (msg: any) => {
      if (msg.type() === "error") consoleErrors.push(msg.text().substring(0, 100));
    });
    page.on("response", (r: any) => {
      if (r.status() >= 500) serverErrors.push(`${r.url()} → ${r.status()}`);
    });

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const errsBefore = serverErrors.length;

      await page.goto(`http://localhost:3000${p.url}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SS}/${String(i).padStart(2, "0")}-${p.name}.png`, fullPage: true });

      const body = await page.textContent("body");
      const is404 = body?.includes("ไม่พบหน้าที่คุณต้องการ") || false;
      const hasError = body?.includes("ข้อผิดพลาด") || body?.includes("Error") || false;
      const new500s = serverErrors.slice(errsBefore);

      let status = "✅";
      if (is404) { status = "❌ 404"; bugs.push(`${p.name} (${p.url}) → 404`); }
      if (new500s.length > 0) { status = "🔴 500"; bugs.push(`${p.name} (${p.url}) → 500: ${new500s.join(", ")}`); }

      console.log(`${status} ${p.name} (${p.url})`);
    }

    console.log(`\n════════════════════════════`);
    console.log(`📊 SCAN COMPLETE`);
    console.log(`Pages scanned: ${pages.length}`);
    console.log(`Bugs found: ${bugs.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Server 500s: ${serverErrors.length}`);

    if (bugs.length > 0) {
      console.log(`\n🐛 BUG LIST:`);
      bugs.forEach(b => console.log(`  ❌ ${b}`));
    }
    if (serverErrors.length > 0) {
      console.log(`\n🔴 500 ERRORS:`);
      serverErrors.forEach(e => console.log(`  ${e}`));
    }
    if (consoleErrors.length > 0) {
      console.log(`\n⚠️ CONSOLE ERRORS (first 10):`);
      consoleErrors.slice(0, 10).forEach(e => console.log(`  ${e}`));
    }
  });
});
