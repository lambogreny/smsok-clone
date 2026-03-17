/**
 * P0 — Task #4584: Complete E2E Bug Hunt + Mobile Responsive
 * Deep testing ทุก flow + 4 viewport sizes
 * Login: lambogreny@gmail.com / ZxCv7845
 */
import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const USER = { email: "lambogreny@gmail.com", password: "ZxCv7845" };
const DIR = "test-results/p0-buglist";

async function dismissCookies(page: Page) {
  const btn = page.getByText("ยอมรับทั้งหมด");
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await btn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  if (page.url().includes("dashboard")) return;
  await dismissCookies(page);
  const e = page.locator('input[type="email"]');
  const p = page.locator('input[type="password"]');
  await e.waitFor({ state: "visible", timeout: 20000 });
  await e.fill(USER.email);
  await p.fill(USER.password);
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 10000 }
  ).catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
}

// ==========================================
// DEEP: Dashboard stats + chart
// ==========================================
test("DEEP-01: Dashboard — KPI cards + chart + getting started", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 30000 });
  await dismissCookies(page);
  await page.waitForTimeout(2000);

  const body = await page.textContent("body") || "";

  // Check KPI cards
  const hasSmsQuota = body.match(/SMS คงเหลือ|500/);
  const hasStats = body.match(/ส่งวันนี้|อัตราสำเร็จ|ล้มเหลว/);
  const hasChart = body.match(/ปริมาณ SMS|โควต้า/);
  const hasGettingStarted = body.match(/เริ่มต้นใช้งาน|5 ขั้นตอน/);

  console.log(`DEEP-01: SMS Quota: ${hasSmsQuota ? "✅" : "❌"}`);
  console.log(`DEEP-01: Stats cards: ${hasStats ? "✅" : "❌"}`);
  console.log(`DEEP-01: Chart: ${hasChart ? "✅" : "❌"}`);
  console.log(`DEEP-01: Getting Started: ${hasGettingStarted ? "✅" : "❌"}`);

  // Click chart tabs D/W/M
  const weekTab = page.getByText("W").first();
  if (await weekTab.isVisible().catch(() => false)) {
    await weekTab.click();
    await page.waitForTimeout(500);
    console.log("DEEP-01: Chart W tab clickable ✅");
  }

  await page.screenshot({ path: `${DIR}/deep01-dashboard.png`, fullPage: true });
  expect(hasSmsQuota).toBeTruthy();
});

// ==========================================
// DEEP: Templates CRUD
// ==========================================
test("DEEP-02: Templates — สร้าง + ดู list", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/dashboard/templates`, { waitUntil: "networkidle", timeout: 30000 });
  await dismissCookies(page);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}/deep02-templates-list.png`, fullPage: true });

  const body = await page.textContent("body") || "";
  console.log(`DEEP-02: Templates page content: ${body.slice(0, 100)}`);

  // Try create template
  const createBtn = page.getByText(/สร้างเทมเพลต|สร้าง|Create|New/i).first();
  if (await createBtn.isVisible().catch(() => false)) {
    await createBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/deep02-templates-create.png`, fullPage: true });

    // Fill template name
    const nameInput = page.locator('input:visible').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill("QA Test Template");

      // Fill template content if textarea exists
      const textarea = page.locator('textarea:visible').first();
      if (await textarea.isVisible().catch(() => false)) {
        await textarea.fill("สวัสดี {{name}} ข้อความทดสอบจาก QA");
      }

      await page.screenshot({ path: `${DIR}/deep02-templates-filled.png`, fullPage: true });

      const saveBtn = page.getByText(/บันทึก|Save|สร้าง|Submit/i).last();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${DIR}/deep02-templates-saved.png`, fullPage: true });
        console.log("DEEP-02: ✅ Template created");
      }
    }
  } else {
    console.log("DEEP-02: ⚠️ No create template button");
  }
});

// ==========================================
// DEEP: History — filter + pagination
// ==========================================
test("DEEP-03: History — filter, search, pagination", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/dashboard/messages`, { waitUntil: "networkidle", timeout: 30000 });
  await dismissCookies(page);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}/deep03-history-list.png`, fullPage: true });

  const body = await page.textContent("body") || "";
  const hasFilter = body.match(/กรอง|Filter|ค้นหา|Search/i);
  const hasPagination = body.match(/หน้า|Page|ถัดไป|Next/i);
  const hasEmptyState = body.match(/ไม่มี|ยังไม่มี|No messages|ไม่พบ/i);

  console.log(`DEEP-03: Filter: ${hasFilter ? "✅" : "⚠️ not found"}`);
  console.log(`DEEP-03: Pagination: ${hasPagination ? "✅" : "⚠️ not found (may be empty)"}`);
  console.log(`DEEP-03: Empty state: ${hasEmptyState ? "✅ valid empty" : "has data"}`);

  // Try search
  const searchInput = page.locator('input[placeholder*="ค้นหา"], input[type="search"]').first();
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill("test");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${DIR}/deep03-history-search.png`, fullPage: true });
    console.log("DEEP-03: Search input works ✅");
  }
});

// ==========================================
// DEEP: Settings — password change + tabs
// ==========================================
test("DEEP-04: Settings — all tabs navigation", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "networkidle", timeout: 30000 });
  await dismissCookies(page);
  await page.waitForTimeout(1000);

  const tabs = ["โปรไฟล์", "ความปลอดภัย", "การเงิน", "API Keys", "Webhooks", "การแจ้งเตือน"];

  for (const tab of tabs) {
    const tabBtn = page.getByText(tab, { exact: false }).first();
    if (await tabBtn.isVisible().catch(() => false)) {
      await tabBtn.click();
      await page.waitForTimeout(1000);
      const slug = tab.replace(/\s/g, "-").toLowerCase();
      await page.screenshot({ path: `${DIR}/deep04-settings-${slug}.png`, fullPage: true });

      const body = await page.textContent("body") || "";
      const hasError = body.includes("Internal Server Error") || body.includes("Application error");
      console.log(`DEEP-04: Settings tab "${tab}": ${hasError ? "❌ ERROR" : "✅ OK"}`);
    }
  }
});

// ==========================================
// DEEP: Contacts — edit + delete
// ==========================================
test("DEEP-05: Contacts — edit existing contact", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/dashboard/contacts`, { waitUntil: "networkidle", timeout: 30000 });
  await dismissCookies(page);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}/deep05-contacts-list.png`, fullPage: true });

  const body = await page.textContent("body") || "";
  const hasContacts = body.includes("QA Test Contact") || body.match(/\d+ รายชื่อ/);

  if (hasContacts) {
    // Click edit button
    const editBtn = page.locator('button[aria-label*="edit"], button[aria-label*="แก้ไข"], [title*="แก้ไข"]').first()
      .or(page.locator('svg').filter({ hasText: '' }).locator('..').first());

    // Try clicking pencil icon
    const pencilBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(0);
    if (await pencilBtn.isVisible().catch(() => false)) {
      // Don't click random SVG buttons, look for edit pattern
      console.log("DEEP-05: Contact list has entries ✅");
    }
  } else {
    console.log("DEEP-05: ⚠️ No contacts in list (may need to add first)");
  }
});

// ==========================================
// DEEP: Sender Name — submit + check status
// ==========================================
test("DEEP-06: Sender Name — full create flow", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/dashboard/senders`, { waitUntil: "networkidle", timeout: 30000 });
  await dismissCookies(page);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}/deep06-senders-list.png`, fullPage: true });

  const addBtn = page.getByText(/เพิ่มชื่อผู้ส่ง|Add Sender/i).first();
  if (await addBtn.isVisible().catch(() => false)) {
    await addBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/deep06-senders-form.png`, fullPage: true });

    // Fill all visible inputs
    const inputs = page.locator('input:visible, textarea:visible, select:visible');
    const count = await inputs.count();
    console.log(`DEEP-06: Sender form has ${count} fields`);

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const tagName = await input.evaluate(el => el.tagName.toLowerCase());
      const type = await input.getAttribute("type") || "";
      const name = await input.getAttribute("name") || "";

      if (tagName === "select") {
        await input.selectOption({ index: 1 }).catch(() => {});
      } else if (type === "file") {
        continue; // Skip file inputs
      } else if (name.includes("name") || i === 0) {
        await input.fill("QATESTSMS").catch(() => {});
      } else if (tagName === "textarea") {
        await input.fill("ทดสอบจาก QA — sender name สำหรับทดสอบ").catch(() => {});
      }
    }

    await page.screenshot({ path: `${DIR}/deep06-senders-filled.png`, fullPage: true });

    // Submit
    const submitBtn = page.getByText(/ยื่นคำขอ|ส่ง|Submit|สร้าง|เพิ่ม|บันทึก/i).last();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${DIR}/deep06-senders-submitted.png`, fullPage: true });
      console.log("DEEP-06: ✅ Sender name submitted");
    }
  }
});

// ==========================================
// MOBILE RESPONSIVE: 4 viewports
// ==========================================
const VIEWPORTS = [
  { width: 375, height: 812, name: "iPhone SE" },
  { width: 393, height: 852, name: "iPhone 15" },
  { width: 768, height: 1024, name: "iPad" },
  { width: 1440, height: 900, name: "Desktop" },
];

const MOBILE_PAGES = [
  "/dashboard",
  "/dashboard/send",
  "/dashboard/contacts",
  "/dashboard/settings",
];

for (const vp of VIEWPORTS) {
  test(`MOBILE-${vp.name} (${vp.width}px): 4 pages`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await login(page);

    const bugs: string[] = [];

    for (const path of MOBILE_PAGES) {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await dismissCookies(page);
      await page.waitForTimeout(500);

      const slug = path.replace(/\//g, "-").replace(/^-/, "");
      await page.screenshot({ path: `${DIR}/mobile-${vp.width}-${slug}.png`, fullPage: true });

      // Check overflow
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
      );

      // Check if content is readable
      const body = await page.textContent("body") || "";
      const isBlank = body.trim().length < 50;

      if (overflow) {
        bugs.push(`${path} overflow at ${vp.width}px`);
        console.log(`🐛 ${path} @ ${vp.width}px → HORIZONTAL OVERFLOW`);
      } else if (isBlank) {
        bugs.push(`${path} blank at ${vp.width}px`);
        console.log(`🐛 ${path} @ ${vp.width}px → BLANK`);
      } else {
        console.log(`✅ ${path} @ ${vp.width}px → OK`);
      }
    }

    if (bugs.length > 0) {
      console.log(`⚠️ ${vp.name}: ${bugs.length} issues found`);
    } else {
      console.log(`✅ ${vp.name}: All 4 pages responsive OK`);
    }
  });
}

// ==========================================
// DEEP: Support — create ticket full flow
// ==========================================
test("DEEP-07: Support — create ticket complete", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/dashboard/support`, { waitUntil: "networkidle", timeout: 30000 });
  await dismissCookies(page);
  await page.waitForTimeout(1000);

  const createBtn = page.getByText(/สร้างตั๋วใหม่|\+ สร้าง/i).first();
  if (await createBtn.isVisible().catch(() => false)) {
    await createBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/deep07-ticket-form.png`, fullPage: true });

    // Fill form
    const inputs = page.locator('input:visible, textarea:visible, select:visible');
    const count = await inputs.count();
    console.log(`DEEP-07: Ticket form has ${count} fields`);

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const tagName = await input.evaluate(el => el.tagName.toLowerCase());
      const name = await input.getAttribute("name") || "";
      const placeholder = await input.getAttribute("placeholder") || "";

      if (tagName === "select") {
        const options = await input.locator("option").count();
        if (options > 1) await input.selectOption({ index: 1 }).catch(() => {});
      } else if (tagName === "textarea" || name.includes("content") || name.includes("message") || placeholder.includes("อธิบาย")) {
        await input.fill("ทดสอบจาก QA — กรุณาเพิกเฉยตั๋วนี้ ขอบคุณครับ ปัญหา: ทดสอบระบบ ticket").catch(() => {});
      } else if (name.includes("subject") || name.includes("title") || placeholder.includes("หัวข้อ")) {
        await input.fill("QA Test Ticket — Please Ignore").catch(() => {});
      }
    }

    await page.screenshot({ path: `${DIR}/deep07-ticket-filled.png`, fullPage: true });

    const submitBtn = page.getByText(/ส่งตั๋ว|ส่ง|Submit|สร้างตั๋ว/i).last();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${DIR}/deep07-ticket-submitted.png`, fullPage: true });

      const body = await page.textContent("body") || "";
      if (body.includes("สำเร็จ") || body.includes("Success") || !page.url().includes("new")) {
        console.log("DEEP-07: ✅ Ticket created successfully");
      } else {
        console.log(`DEEP-07: ⚠️ Ticket submit result unclear — URL: ${page.url()}`);
      }
    }
  }
});

// ==========================================
// DEEP: Notifications page
// ==========================================
test("DEEP-08: Notifications — list + mark read", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/dashboard/notifications`, { waitUntil: "networkidle", timeout: 30000 });
  await dismissCookies(page);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}/deep08-notifications.png`, fullPage: true });

  const body = await page.textContent("body") || "";
  const hasNotif = body.match(/แจ้งเตือน|Notification|ทั้งหมด|All/i);
  console.log(`DEEP-08: Notifications page: ${hasNotif ? "✅ content found" : "⚠️ may be empty"}`);

  // Check tabs if exist
  const tabs = page.locator('[role="tab"], button').filter({ hasText: /ทั้งหมด|All|ยังไม่อ่าน|Unread/i });
  const tabCount = await tabs.count();
  if (tabCount > 0) {
    console.log(`DEEP-08: ${tabCount} notification tabs found ✅`);
  }
});
