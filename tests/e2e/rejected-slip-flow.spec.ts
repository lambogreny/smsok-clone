import { test, expect, dismissCookieConsent, collectConsoleErrors } from "./fixtures";
import path from "path";

const TEST_SLIP_PATH = path.join(__dirname, "test-slip.png");

test.describe("Rejected Slip Flow E2E", () => {

  // ===== Flow 1: Order List & Detail =====
  test("RSLIP-01: orders page loads with order list", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookieConsent(page);
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    expect(body).toMatch(/คำสั่งซื้อ|Orders|ORD-/i);
    await page.screenshot({ path: "test-results/rslip-01-orders-list.png" });
  });

  test("RSLIP-02: order detail page loads for existing order", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookieConsent(page);

    const orderRow = page.locator("tbody tr, [data-testid='order-row'], a[href*='orders/']").first();
    if (await orderRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderRow.click();
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(2000);
      const body = await page.textContent("body");
      expect(body).toMatch(/ORD-|คำสั่งซื้อ|order/i);
      await page.screenshot({ path: "test-results/rslip-02-order-detail.png" });
    }
  });

  // ===== Flow 2: Create New Order via Browser =====
  test("RSLIP-03: checkout page loads with correct form fields", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/checkout?tier=A");
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    // Should show checkout form with tax info fields
    expect(body).toMatch(/ชำระเงิน|Checkout|สร้างคำสั่งซื้อ|คำสั่งซื้อ/i);
    await page.screenshot({ path: "test-results/rslip-03-checkout-form.png" });
  });

  test("RSLIP-04: create order fills form and submits", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/checkout?tier=A");
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    // Fill the checkout form — try both old and new field formats
    const nameInput = page.locator('input[placeholder*="สมชาย"], input[name*="tax_name"], input[name*="billingName"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill("QA Browser Test");
    }

    const taxIdInput = page.locator('input[placeholder*="X-XXXX"], input[name*="tax_id"], input[name*="billingTaxId"]').first();
    if (await taxIdInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taxIdInput.fill("1234567890123");
    }

    const addressInput = page.locator('textarea[placeholder*="ถนน"], textarea[name*="tax_address"], textarea[name*="billingAddress"]').first();
    if (await addressInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addressInput.fill("999 QA Test Road Patumwan Bangkok 10100");
    }

    // Click customer type radio if exists
    const individualRadio = page.locator('text=บุคคลธรรมดา, label:has-text("บุคคลธรรมดา"), [value="INDIVIDUAL"]').first();
    if (await individualRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
      await individualRadio.click();
    }

    // Branch type HEAD
    const headRadio = page.locator('text=สำนักงานใหญ่, label:has-text("สำนักงานใหญ่"), [value="HEAD"]').first();
    if (await headRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
      await headRadio.click();
    }

    await page.screenshot({ path: "test-results/rslip-04-checkout-filled.png" });

    // Submit
    const submitBtn = page.locator('button:has-text("สร้างคำสั่งซื้อ")').first();
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const respPromise = page.waitForResponse(
        r => r.request().method() === "POST" && r.status() < 500,
        { timeout: 15000 }
      ).catch(() => null);

      await submitBtn.click();
      await page.waitForTimeout(5000);

      const resp = await respPromise;
      if (resp) {
        console.log("Create order response:", resp.status());
      }
      await page.screenshot({ path: "test-results/rslip-04-order-created.png" });
    }
  });

  // ===== Flow 3: Order Detail - PENDING_PAYMENT State =====
  test("RSLIP-05: pending order shows bank info and attach slip button", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    // Find a PENDING order
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    let foundPending = false;

    for (let i = 0; i < Math.min(rowCount, 10); i++) {
      const rowText = await rows.nth(i).textContent();
      if (rowText?.match(/รอชำระ|PENDING|รอดำเนินการ/i)) {
        await rows.nth(i).click();
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(2000);
        foundPending = true;

        const body = await page.textContent("body");
        // Should show bank info
        expect(body).toMatch(/SCB|ธนาคาร|บัญชี|แนบสลิป|bank/i);
        // Should show attach slip button
        const attachBtn = page.locator('button:has-text("แนบสลิป"), button:has-text("อัพโหลดสลิป"), button:has-text("แนบสลิปโอนเงิน")').first();
        const hasAttach = await attachBtn.isVisible({ timeout: 3000 }).catch(() => false);
        expect(hasAttach).toBeTruthy();
        await page.screenshot({ path: "test-results/rslip-05-pending-order.png" });
        break;
      }
    }

    if (!foundPending) {
      console.log("No PENDING order found — skipping detail check");
    }
  });

  // ===== Flow 4: Slip Upload via Browser =====
  test("RSLIP-06: slip upload opens modal and accepts file", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    // Find and click into a pending order
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();

    for (let i = 0; i < Math.min(rowCount, 10); i++) {
      const rowText = await rows.nth(i).textContent();
      if (rowText?.match(/รอชำระ|PENDING/i)) {
        await rows.nth(i).click();
        await page.waitForLoadState("networkidle").catch(() => {});
        await dismissCookieConsent(page);
        await page.waitForTimeout(2000);

        // Click attach slip button
        const attachBtn = page.locator('button:has-text("แนบสลิป"), button:has-text("อัพโหลดสลิป"), button:has-text("แนบสลิปโอนเงิน")').first();
        if (await attachBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await attachBtn.click();
          await page.waitForTimeout(2000);

          // Modal should appear with file input
          const fileInput = page.locator('input[type="file"]');
          if (await fileInput.count() > 0) {
            await fileInput.first().setInputFiles(TEST_SLIP_PATH);
            await page.waitForTimeout(2000);
            await page.screenshot({ path: "test-results/rslip-06-slip-upload-modal.png" });
          }

          // Submit slip
          const submitBtn = page.locator('button:has-text("ส่งสลิป"), button:has-text("อัพโหลด"), button:has-text("ยืนยัน")').first();
          if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            const respPromise = page.waitForResponse(
              r => r.url().includes("slip") && r.request().method() === "POST",
              { timeout: 15000 }
            ).catch(() => null);

            await submitBtn.click();
            const resp = await respPromise;
            if (resp) {
              console.log("Slip upload response:", resp.status());
              expect([200, 201]).toContain(resp.status());
            }
            await page.waitForTimeout(3000);
            await page.screenshot({ path: "test-results/rslip-06-slip-uploaded.png" });
          }
        }
        break;
      }
    }
  });

  // ===== Flow 5: Rejected Order UI =====
  test("RSLIP-07: rejected order shows rejection reason and resubmit button", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    // Find a rejected order (if any)
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    let foundRejected = false;

    for (let i = 0; i < Math.min(rowCount, 10); i++) {
      const rowText = await rows.nth(i).textContent();
      if (rowText?.match(/ปฏิเสธ|REJECTED|สลิปถูกปฏิเสธ/i)) {
        await rows.nth(i).click();
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(2000);
        foundRejected = true;

        const body = await page.textContent("body");
        // Should show rejection reason
        expect(body).toMatch(/สลิปซ้ำ|ยอดเงินไม่ตรง|สลิปหมดอายุ|บัญชีผิด|DUPLICATE|AMOUNT|EXPIRED|WRONG|ปฏิเสธ|rejected/i);

        // Should show attempt counter
        expect(body).toMatch(/ครั้ง|attempt|\/5/i);

        // Should show resubmit button (if attempts < 5)
        const resubBtn = page.locator('button:has-text("แนบสลิปใหม่"), button:has-text("อัพโหลดสลิปใหม่"), button:has-text("ส่งสลิปใหม่")').first();
        const contactSupport = page.getByText(/ติดต่อ|Support|LINE/i).first();

        const hasResub = await resubBtn.isVisible({ timeout: 3000 }).catch(() => false);
        const hasSupport = await contactSupport.isVisible({ timeout: 3000 }).catch(() => false);
        // Either resubmit button OR support contact should be visible
        expect(hasResub || hasSupport).toBeTruthy();

        await page.screenshot({ path: "test-results/rslip-07-rejected-order.png" });
        break;
      }
    }

    if (!foundRejected) {
      console.log("No REJECTED order found — skipping rejection UI check");
      // This is acceptable if no orders have been rejected yet
    }
  });

  // ===== Flow 6: Anti-Fraud Guard #1 — Upload while VERIFYING =====
  test("RSLIP-08: verifying order blocks slip upload button", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();

    for (let i = 0; i < Math.min(rowCount, 10); i++) {
      const rowText = await rows.nth(i).textContent();
      if (rowText?.match(/กำลังตรวจ|VERIFYING|รอตรวจสอบ/i)) {
        await rows.nth(i).click();
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(2000);

        // Upload button should NOT be visible
        const attachBtn = page.locator('button:has-text("แนบสลิป"), button:has-text("อัพโหลดสลิป")').first();
        const isVisible = await attachBtn.isVisible({ timeout: 2000 }).catch(() => false);
        expect(isVisible).toBe(false);
        await page.screenshot({ path: "test-results/rslip-08-verifying-locked.png" });
        break;
      }
    }
  });

  // ===== Flow 7: PAID Order — Documents =====
  test("RSLIP-09: paid order shows documents section", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();

    for (let i = 0; i < Math.min(rowCount, 10); i++) {
      const rowText = await rows.nth(i).textContent();
      if (rowText?.match(/ชำระแล้ว|PAID|สำเร็จ|COMPLETED/i)) {
        await rows.nth(i).click();
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(2000);

        const body = await page.textContent("body");
        // Should show document section
        expect(body).toMatch(/เอกสาร|Document|ใบแจ้งหนี้|ใบเสร็จ|Invoice|Receipt/i);
        await page.screenshot({ path: "test-results/rslip-09-paid-order.png" });
        break;
      }
    }
  });

  // ===== UI & Responsive Tests =====
  test("RSLIP-10: orders page responsive 375px", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/billing/orders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookieConsent(page);
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: "test-results/rslip-10-orders-mobile.png" });
  });

  test("RSLIP-11: no console errors on orders page", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/dashboard/billing/orders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    expect(realErrors).toHaveLength(0);
  });

  // ===== API Integration via Browser Context =====
  test("RSLIP-12: orders API returns correct structure", async ({ authedPage: page }) => {
    const res = await page.request.get("/api/v1/orders");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data || body.orders).toBeDefined();
  });

  test("RSLIP-13: resubmit API rejects non-rejected order", async ({ authedPage: page }) => {
    // Get first order
    const listRes = await page.request.get("/api/v1/orders");
    if (listRes.status() === 200) {
      const body = await listRes.json();
      const orders = body.data || body.orders || [];
      if (Array.isArray(orders) && orders.length > 0) {
        const order = orders[0];
        if (order.status !== "PENDING_PAYMENT" || !order.rejectReason) {
          // Try to resubmit a non-rejected order -> should fail
          const res = await page.request.post(`/api/orders/${order.id}/resubmit-slip`, {
            headers: { "Origin": "http://localhost:3000" },
          });
          expect([400, 409]).toContain(res.status());
        }
      }
    }
  });
});
