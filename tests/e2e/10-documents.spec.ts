import { test, expect, collectConsoleErrors } from "./fixtures";

test.describe("Documents — Invoices, Receipts, Downloads", () => {
  // === Invoices Page ===
  test("DOC-01: invoices page loads without error", async ({ authedPage: page }) => {
    await page.goto("/dashboard/invoices", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    await page.screenshot({ path: "test-results/10-invoices-page.png" });
  });

  test("DOC-02: invoices show list or empty state", async ({ authedPage: page }) => {
    await page.goto("/dashboard/invoices", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    const hasDocs = body?.match(/ใบแจ้งหนี้|ใบเสร็จ|Invoice|Receipt|INV-|ORD-/i);
    const hasEmpty = body?.match(/ยังไม่มี|ไม่พบ|No invoices|No documents/i);
    expect(hasDocs || hasEmpty).toBeTruthy();
  });

  test("DOC-03: invoices no console errors", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/dashboard/invoices", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    expect(realErrors).toHaveLength(0);
  });

  // === Order Detail — Document Section ===
  test("DOC-04: order detail has document download section", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Click first order
    const orderRow = page.locator("tbody tr").first();
    if (await orderRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await orderRow.click();
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(3000);

      const body = await page.textContent("body");
      // Check for document section (receipt, invoice, tax invoice)
      const hasDocs = body?.match(/เอกสาร|Document|ใบแจ้งหนี้|ใบเสร็จ|ใบกำกับภาษี|Invoice|Receipt|Tax/i);
      const hasDownload = page.locator('a[download], button:has-text("ดาวน์โหลด"), a:has-text("ดาวน์โหลด"), button:has-text("Download")');
      const downloadVisible = await hasDownload.first().isVisible({ timeout: 3000 }).catch(() => false);

      // At least doc section or download button should exist for completed orders
      expect(hasDocs || downloadVisible).toBeTruthy();
      await page.screenshot({ path: "test-results/10-order-documents.png" });
    }
  });

  test("DOC-05: document download returns valid response", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Find a PAID order
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      const rowText = await rows.nth(i).textContent();
      if (rowText?.includes("PAID") || rowText?.includes("สำเร็จ") || rowText?.includes("ชำระแล้ว")) {
        await rows.nth(i).click();
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(3000);

        // Try clicking download button
        const downloadBtn = page.locator('a[download], button:has-text("ดาวน์โหลด"), a:has-text("ดาวน์โหลด")').first();
        if (await downloadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Intercept download response
          const downloadPromise = page.waitForResponse(
            r => r.url().includes("document") || r.url().includes("invoice") || r.url().includes("receipt") || r.url().includes("pdf"),
            { timeout: 10000 }
          ).catch(() => null);

          await downloadBtn.click();
          const resp = await downloadPromise;
          if (resp) {
            expect([200, 302]).toContain(resp.status());
          }
          await page.screenshot({ path: "test-results/10-document-download.png" });
        }
        break;
      }
    }
  });

  // === Quotations Page ===
  test("DOC-06: quotations page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/quotations", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    await page.screenshot({ path: "test-results/10-quotations-page.png" });
  });

  test("DOC-07: quotations show list or empty state", async ({ authedPage: page }) => {
    await page.goto("/dashboard/quotations", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    const hasQuotes = body?.match(/ใบเสนอราคา|Quotation|QUO-/i);
    const hasEmpty = body?.match(/ยังไม่มี|ไม่พบ|No quotations/i);
    const hasCreateBtn = body?.match(/สร้าง|Create|New/i);
    expect(hasQuotes || hasEmpty || hasCreateBtn).toBeTruthy();
  });

  // === Billing History ===
  test("DOC-08: billing history page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/history", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    await page.screenshot({ path: "test-results/10-billing-history.png" });
  });

  // === Responsive Tests ===
  test("DOC-09: invoices responsive 375px", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/invoices", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: "test-results/10-invoices-mobile.png" });
  });

  // === API Layer ===
  test("DOC-10: orders API returns 200", async ({ authedPage: page }) => {
    const response = await page.request.get("/api/v1/orders");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
  });
});
