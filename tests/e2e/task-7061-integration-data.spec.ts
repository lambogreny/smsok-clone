import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const BASE = "http://localhost:3000";
const QA_USER = { email: "qa-suite@smsok.test", password: process.env.E2E_USER_PASSWORD! };

async function dismissCookies(page: Page) {
  for (const text of ["ยอมรับทั้งหมด", "ยอมรับ", "Accept All"]) {
    const btn = page.getByText(text, { exact: false });
    if (await btn.first().isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.first().click({ force: true });
      await page.waitForTimeout(500);
      return;
    }
  }
}

async function snap(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/integ-${name}.png`, fullPage: true });
}

async function loginCtx(browser: any): Promise<BrowserContext> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await dismissCookies(page);
  await page.locator('input[type="email"]').fill(QA_USER.email);
  await page.locator('input[type="password"]').fill(QA_USER.password);
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 10000 }
  ).catch(() => {});
  await page.locator('button[type="submit"]').click({ force: true });
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.close();
  return ctx;
}

// ===================== CREATE DATA FOR INTEGRATION TEST =====================

test("Integration: Create data in clone for backoffice verify", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState("domcontentloaded").catch(() => {});

  const timestamp = Date.now();
  const results: { action: string; status: string; data?: string }[] = [];

  console.log("\n" + "=".repeat(70));
  console.log("INTEGRATION TEST — CREATE DATA IN CLONE");
  console.log("=".repeat(70));

  // 1. Create contact via API
  const contactResp = await page.request.fetch(`${BASE}/api/v1/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      firstName: "IntegTest",
      lastName: `${timestamp}`,
      phone: `09${String(timestamp).slice(-8)}`,
      email: `integ-${timestamp}@test.com`,
    }),
  });
  const contactStatus = contactResp.status();
  const contactBody = await contactResp.json().catch(() => ({}));
  const contactId = contactBody.id || contactBody.data?.id || "unknown";
  results.push({
    action: "Create Contact",
    status: contactStatus < 400 ? "OK" : "FAIL",
    data: `id=${contactId} phone=09${String(timestamp).slice(-8)} email=integ-${timestamp}@test.com`,
  });
  console.log(`Contact: ${contactStatus} → id=${contactId}`);

  // 2. Create template via API
  const templateResp = await page.request.fetch(`${BASE}/api/v1/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      name: `IntegTemplate-${timestamp}`,
      content: "Integration test message {{name}}",
    }),
  });
  const templateStatus = templateResp.status();
  const templateBody = await templateResp.json().catch(() => ({}));
  const templateId = templateBody.id || templateBody.data?.id || "unknown";
  results.push({
    action: "Create Template",
    status: templateStatus < 400 ? "OK" : "FAIL",
    data: `id=${templateId} name=IntegTemplate-${timestamp}`,
  });
  console.log(`Template: ${templateStatus} → id=${templateId}`);

  // 3. Create API key
  const keyResp = await page.request.fetch(`${BASE}/api/v1/api-keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ name: `IntegKey-${timestamp}` }),
  });
  const keyStatus = keyResp.status();
  const keyBody = await keyResp.json().catch(() => ({}));
  const keyId = keyBody.id || keyBody.data?.id || "unknown";
  results.push({
    action: "Create API Key",
    status: keyStatus < 400 ? "OK" : "FAIL",
    data: `id=${keyId} name=IntegKey-${timestamp}`,
  });
  console.log(`API Key: ${keyStatus} → id=${keyId}`);

  // 4. Create support ticket
  const ticketResp = await page.request.fetch(`${BASE}/api/v1/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      subject: `IntegTicket-${timestamp}`,
      message: "Integration test ticket from QA",
      category: "general",
    }),
  });
  const ticketStatus = ticketResp.status();
  const ticketBody = await ticketResp.json().catch(() => ({}));
  const ticketId = ticketBody.id || ticketBody.data?.id || "unknown";
  results.push({
    action: "Create Ticket",
    status: ticketStatus < 400 ? "OK" : "FAIL",
    data: `id=${ticketId} subject=IntegTicket-${timestamp}`,
  });
  console.log(`Ticket: ${ticketStatus} → id=${ticketId}`);

  // 5. Check user data exists
  const meResp = await page.request.fetch(`${BASE}/api/auth/me`);
  const meBody = await meResp.json().catch(() => ({}));
  const userId = meBody.id || meBody.user?.id || "unknown";
  const userEmail = meBody.email || meBody.user?.email || "unknown";
  results.push({
    action: "User Identity",
    status: "OK",
    data: `id=${userId} email=${userEmail}`,
  });
  console.log(`User: id=${userId} email=${userEmail}`);

  // 6. Check orders (existing)
  const ordersResp = await page.request.fetch(`${BASE}/api/v1/orders`);
  const ordersBody = await ordersResp.json().catch(() => ({}));
  const orders = Array.isArray(ordersBody) ? ordersBody : (ordersBody.data || ordersBody.orders || []);
  results.push({
    action: "Orders List",
    status: "OK",
    data: `count=${orders.length}`,
  });
  console.log(`Orders: ${orders.length} existing`);

  // 7. Both servers running check
  const clone3000 = await page.request.fetch(`${BASE}/api/health`).catch(() => null);
  let bo3001Status = "UNKNOWN";
  try {
    const bo = await page.request.fetch("http://localhost:3001/api/health");
    bo3001Status = String(bo.status());
  } catch { bo3001Status = "UNREACHABLE"; }

  results.push({
    action: "Clone :3000",
    status: clone3000 ? "OK" : "FAIL",
    data: `health=${clone3000?.status()}`,
  });
  results.push({
    action: "Backoffice :3001",
    status: bo3001Status === "200" ? "OK" : "CHECK",
    data: `health=${bo3001Status}`,
  });

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("DATA CREATED — FOR QA-2 TO VERIFY IN BACKOFFICE");
  console.log("=".repeat(70));
  for (const r of results) {
    const icon = r.status === "OK" ? "✅" : r.status === "FAIL" ? "❌" : "⚠️";
    console.log(`${icon} ${r.action.padEnd(20)} → ${r.data}`);
  }
  console.log("=".repeat(70));

  await snap(page, "data-created");
  await ctx.close();
});
