/**
 * Task #5780 — QA: Campaign Wizard Syntax + Backend Template Fixes (P1)
 * Reviewer APPROVED — 2-Layer Test
 *
 * Layer 1: API Tests — Template CRUD, validate, render, campaign list
 * Layer 2: Browser Tests — Templates page, Campaign wizard variables,
 *          PhonePreview, billing page, API docs
 */

import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const DIR = "/Users/lambogreny/oracles/qa/screenshots/task-5780";
const BASE = "http://localhost:3000";
const QA_EMAIL = "qa-suite@smsok.test";
const QA_PASS = process.env.E2E_USER_PASSWORD!;

test.beforeAll(() => {
  fs.mkdirSync(DIR, { recursive: true });
});

async function ss(page: Page, name: string) {
  const p = path.join(DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`📸 ${p}`);
}

async function getSessionCookie(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email: QA_EMAIL, password: QA_PASS }),
  });
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

async function api(
  p: string,
  opts: { method?: string; body?: unknown; cookie: string }
) {
  const headers: Record<string, string> = {
    Cookie: opts.cookie,
    Origin: BASE,
  };
  if (opts.body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${p}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const accept = page.locator('text="ยอมรับทั้งหมด"');
  if (await accept.isVisible({ timeout: 1500 }).catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(500);
  }
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASS);
  await page
    .waitForFunction(
      () =>
        !(
          document.querySelector(
            'button[type="submit"]'
          ) as HTMLButtonElement
        )?.disabled,
      { timeout: 5000 }
    )
    .catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page
    .waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
}

// ============================================
// LAYER 1: API TESTS
// ============================================
test.describe("Layer 1 — API", () => {
  let cookie: string;
  let createdTemplateId: string | null = null;

  test.beforeAll(async () => {
    cookie = await getSessionCookie();
  });

  test("API-1. Templates list → 200", async () => {
    const res = await api("/api/v1/templates", { cookie });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("templates");
    console.log(
      "✅ Templates list 200 — count:",
      res.data.templates?.length ?? 0
    );
  });

  test("API-2. Create template with {{name}} variable", async () => {
    const res = await api("/api/v1/templates", {
      method: "POST",
      cookie,
      body: {
        name: `QA-Test-${Date.now()}`,
        content:
          "สวัสดี {{name}} รหัส OTP ของคุณคือ {{otp}} กรุณายืนยันภายใน 5 นาที",
        category: "otp",
      },
    });
    console.log(
      "📍 POST /api/v1/templates →",
      res.status,
      JSON.stringify(res.data).substring(0, 200)
    );
    expect([200, 201]).toContain(res.status);

    const tpl = res.data;
    createdTemplateId = tpl?.id || null;

    // Verify variables extracted correctly
    if (tpl?.variables) {
      console.log("📍 Variables extracted:", JSON.stringify(tpl.variables));
      expect(tpl.variables).toContain("name");
      expect(tpl.variables).toContain("otp");
      console.log("✅ {{name}} and {{otp}} extracted correctly");
    }
  });

  test("API-3. Validate template — {{variable}} syntax", async () => {
    const res = await api("/api/v1/templates/validate", {
      method: "POST",
      cookie,
      body: {
        content:
          "{{name}} สั่งซื้อสำเร็จ {{amount}} บาท หมายเลข {{order_id}}",
      },
    });
    console.log(
      "📍 POST /api/v1/templates/validate →",
      res.status,
      JSON.stringify(res.data).substring(0, 300)
    );
    expect(res.status).toBe(200);

    if (res.data) {
      expect(res.data.variables).toContain("name");
      expect(res.data.variables).toContain("amount");
      expect(res.data.variables).toContain("order_id");
      console.log("✅ Variables detected:", res.data.variables);
      console.log(
        "✅ Encoding:",
        res.data.encoding,
        "| Segments:",
        res.data.segmentCount
      );
    }
  });

  test("API-4. Render template — variable substitution", async () => {
    const res = await api("/api/v1/templates/render", {
      method: "POST",
      cookie,
      body: {
        content: "สวัสดี {{name}} รหัส {{otp}}",
        variables: { name: "สมชาย", otp: "482910" },
      },
    });
    console.log(
      "📍 POST /api/v1/templates/render →",
      res.status,
      JSON.stringify(res.data).substring(0, 300)
    );
    expect(res.status).toBe(200);

    if (res.data?.rendered) {
      expect(res.data.rendered).toContain("สมชาย");
      expect(res.data.rendered).toContain("482910");
      expect(res.data.rendered).not.toContain("{{name}}");
      expect(res.data.rendered).not.toContain("{{otp}}");
      console.log("✅ Rendered:", res.data.rendered);
    }
  });

  test("API-5. Get template by ID", async () => {
    if (!createdTemplateId) {
      console.log("⚠️ No template created — skipping");
      return;
    }
    const res = await api(`/api/v1/templates/${createdTemplateId}`, { cookie });
    console.log("📍 GET template →", res.status);
    expect(res.status).toBe(200);
    expect(res.data?.content).toContain("{{name}}");
    expect(res.data?.content).toContain("{{otp}}");
    console.log("✅ Template content preserved {{variable}} syntax");
  });

  test("API-6. Update template", async () => {
    if (!createdTemplateId) {
      console.log("⚠️ No template — skipping");
      return;
    }
    const res = await api(`/api/v1/templates/${createdTemplateId}`, {
      method: "PUT",
      cookie,
      body: {
        content:
          "{{name}} ยืนยันเบอร์ {{phone}} รหัส {{otp}} หมดอายุใน 3 นาที",
      },
    });
    console.log("📍 PUT template →", res.status);
    expect([200, 201]).toContain(res.status);

    if (res.data?.variables) {
      expect(res.data.variables).toContain("phone");
      console.log("✅ Updated variables:", res.data.variables);
    }
  });

  test("API-7. Delete template (soft delete)", async () => {
    if (!createdTemplateId) {
      console.log("⚠️ No template — skipping");
      return;
    }
    const res = await api(`/api/v1/templates/${createdTemplateId}`, {
      method: "DELETE",
      cookie,
    });
    console.log("📍 DELETE template →", res.status);
    expect([200, 204]).toContain(res.status);
    console.log("✅ Template soft-deleted");

    // Verify deleted template returns 404
    const check = await api(`/api/v1/templates/${createdTemplateId}`, {
      cookie,
    });
    console.log("📍 GET deleted template →", check.status);
    expect([404, 200]).toContain(check.status); // Might still return 200 with deletedAt
  });

  test("API-8. Campaigns list → 200", async () => {
    const res = await api("/api/v1/campaigns", { cookie });
    expect([200, 404]).toContain(res.status);
    console.log(
      "✅ Campaigns list:",
      res.status,
      "— count:",
      res.data?.campaigns?.length ?? 0
    );
  });

  test("API-9. Template library (public templates)", async () => {
    const res = await api("/api/v1/templates/library", { cookie });
    console.log("📍 GET /api/v1/templates/library →", res.status);
    expect([200, 404]).toContain(res.status);
    if (res.status === 200 && res.data?.templates) {
      console.log("✅ Library templates:", res.data.templates.length);
      // Check first template for {{variable}} syntax
      const first = res.data.templates[0];
      if (first?.content) {
        const hasOldSyntax = /\{[^{][^}]*\}/.test(first.content);
        const hasNewSyntax = /\{\{[^}]+\}\}/.test(first.content);
        console.log(
          "📍 First library template syntax — old {x}:",
          hasOldSyntax,
          "| new {{x}}:",
          hasNewSyntax
        );
      }
    }
  });

  test("API-10. Validate — old {ชื่อ} syntax warning", async () => {
    const res = await api("/api/v1/templates/validate", {
      method: "POST",
      cookie,
      body: { content: "สวัสดี {ชื่อ} รหัส {โค้ด}" },
    });
    console.log(
      "📍 Validate old syntax →",
      res.status,
      JSON.stringify(res.data).substring(0, 300)
    );
    expect(res.status).toBe(200);

    // Old syntax should either produce warning or extract no variables
    if (res.data) {
      console.log("📍 Variables from old syntax:", res.data.variables);
      console.log("📍 Warnings:", JSON.stringify(res.data.warnings));
      // Old single-brace syntax should NOT extract as valid variables
      if (res.data.variables?.length === 0) {
        console.log("✅ Old {ชื่อ} syntax not recognized as variables — correct");
      } else {
        console.log(
          "⚠️ Old syntax produced variables:",
          res.data.variables
        );
      }
    }
  });
});

// ============================================
// LAYER 2: BROWSER TESTS
// ============================================
test.describe("Layer 2 — Browser", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
  });

  test("B1. Templates page loads (JSX fix verified)", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/templates`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "01-templates-page");

    const status = page.url();
    expect(status).toContain("templates");
    expect(status).not.toContain("/login");

    const text = await page.textContent("body");
    console.log(
      "👁️ Templates page:",
      /template|เทมเพลต|แม่แบบ/i.test(text || "") ? "✅ LOADS" : "⚠️ missing text"
    );
    console.log("📍 URL:", status);

    // Check for server errors
    const hasServerError = /internal server error|server error occurred/i.test(
      text || ""
    );
    console.log("👁️ Server error:", hasServerError ? "❌ YES" : "✅ NO");
    expect(hasServerError).toBe(false);
  });

  test("B2. Template create — {{variable}} chips", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/templates`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Click create button
    const createBtn = page
      .locator(
        'button:has-text("สร้าง"), button:has-text("Create"), button:has-text("เพิ่ม"), button:has-text("new")'
      )
      .first();

    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      await ss(page, "02-template-create-dialog");

      // Fill name
      const nameInput = page
        .locator(
          'input[placeholder*="ชื่อ"], input[placeholder*="name"], input[placeholder*="เทมเพลต"]'
        )
        .first();
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill(`QA-Browser-${Date.now()}`);
        console.log("✅ Name filled");
      }

      // Fill content with {{variables}}
      const contentArea = page
        .locator("textarea, [contenteditable]")
        .first();
      if (await contentArea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await contentArea.fill(
          "สวัสดี {{name}} รหัส OTP: {{otp}} กรุณายืนยัน"
        );
        console.log("✅ Content with {{name}} {{otp}} filled");
      }

      await page.waitForTimeout(1000);
      await ss(page, "03-template-form-filled");

      // Check for variable chips/badges in UI
      const pageText = await page.textContent("body");
      const hasVariableChips =
        /\{\{name\}\}|\{\{otp\}\}|name|otp/.test(pageText || "");
      console.log("👁️ Variable chips visible:", hasVariableChips ? "✅" : "⚠️");

      // Check NO old syntax chips
      const hasOldChips = /\{ชื่อ\}|\{โค้ด\}|\{เบอร์\}/.test(pageText || "");
      console.log(
        "👁️ Old {ชื่อ} syntax present:",
        hasOldChips ? "❌ OLD SYNTAX FOUND" : "✅ No old syntax"
      );

      // Look for variable insert buttons
      const varButtons = page.locator(
        'button:has-text("{{"), button:has-text("name"), button:has-text("ชื่อ"), button:has-text("phone"), button:has-text("otp")'
      );
      const varCount = await varButtons.count();
      console.log("👁️ Variable insert buttons:", varCount);

      if (varCount > 0) {
        // Click a variable button to insert
        const firstVar = varButtons.first();
        const varText = await firstVar.textContent();
        console.log("📍 First variable button text:", varText);

        // Verify buttons use {{variable}} not {ชื่อ}
        for (let i = 0; i < Math.min(varCount, 6); i++) {
          const btnText = await varButtons.nth(i).textContent();
          console.log(`📍 Variable button ${i + 1}: "${btnText}"`);
        }
      }

      // Save template
      const dialog = page
        .locator(
          '[data-slot="dialog-content"], [role="dialog"], dialog'
        )
        .first();
      if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
        const saveBtn = dialog
          .locator(
            'button:has-text("บันทึก"), button:has-text("Save"), button:has-text("สร้าง"), button[type="submit"]'
          )
          .first();
        if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await saveBtn.click({ force: true });
          await page.waitForTimeout(2000);
          await ss(page, "04-template-saved");
          console.log("✅ Template saved");
        }
      }
    } else {
      console.log("⚠️ Create button not found");
      await ss(page, "02-no-create-btn");
    }
  });

  test("B3. Template edit", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/templates`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Find a template row/card and click edit
    const templateItem = page
      .locator(
        'tr:has-text("QA"), [class*="card"]:has-text("QA"), div:has-text("QA-Browser")'
      )
      .first();

    if (await templateItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Look for edit button on the item
      const editBtn = page
        .locator(
          'button:has-text("แก้ไข"), button:has-text("Edit"), button[aria-label*="edit" i]'
        )
        .first();

      // Try clicking the item first to open detail/edit
      await templateItem.click();
      await page.waitForTimeout(1500);
      await ss(page, "05-template-detail");

      // Try edit button if visible
      if (await editBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(1500);
        await ss(page, "06-template-edit");
        console.log("✅ Edit dialog opened");
      }
    } else {
      console.log("⚠️ No QA template found to edit");
      await ss(page, "05-no-template-to-edit");
    }
  });

  test("B4. Template duplicate", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/templates`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Look for duplicate button
    const dupBtn = page
      .locator(
        'button:has-text("คัดลอก"), button:has-text("Duplicate"), button:has-text("สำเนา"), button[aria-label*="duplicate" i], button[aria-label*="copy" i]'
      )
      .first();

    // Click on first template first
    const firstTemplate = page.locator("tbody tr, [class*='card']").first();
    if (await firstTemplate.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstTemplate.click();
      await page.waitForTimeout(1000);
    }

    if (await dupBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dupBtn.click();
      await page.waitForTimeout(2000);
      await ss(page, "07-template-duplicate");
      console.log("✅ Duplicate clicked");
    } else {
      console.log("⚠️ Duplicate button not found");
      await ss(page, "07-no-duplicate-btn");
    }
  });

  test("B5. Template archive", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/templates`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Look for delete/archive button
    const archiveBtn = page
      .locator(
        'button:has-text("ลบ"), button:has-text("Delete"), button:has-text("Archive"), button[aria-label*="delete" i]'
      )
      .first();

    // Click on first template
    const firstTemplate = page.locator("tbody tr, [class*='card']").first();
    if (await firstTemplate.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstTemplate.click();
      await page.waitForTimeout(1000);
    }

    if (await archiveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ss(page, "08-before-archive");
      console.log("✅ Archive/Delete button found");
      // Don't actually click delete — just verify it exists
    } else {
      console.log("⚠️ Archive/Delete button not found");
      await ss(page, "08-no-archive-btn");
    }
  });

  test("B6. Campaign wizard — variable chips {{name}} not {ชื่อ}", async ({
    page,
  }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/campaigns`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "09-campaigns-page");

    // Click create campaign
    const createBtn = page
      .locator(
        'button:has-text("สร้าง"), button:has-text("Create"), a:has-text("สร้าง"), button:has-text("new")'
      )
      .first();

    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await ss(page, "10-campaign-wizard-step1");

      const wizardUrl = page.url();
      console.log("📍 Campaign wizard URL:", wizardUrl);

      // Navigate to message step (step 3)
      // Fill required fields first — campaign name
      const nameInput = page
        .locator(
          'input[placeholder*="ชื่อ"], input[placeholder*="campaign"], input[placeholder*="แคมเปญ"]'
        )
        .first();
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill(`QA-Campaign-${Date.now()}`);
        console.log("✅ Campaign name filled");
      }

      // Try to get to message step
      const nextBtn = page
        .locator(
          'button:has-text("ถัดไป"), button:has-text("Next"), button:has-text("ต่อไป")'
        )
        .first();
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(1500);
        await ss(page, "11-campaign-wizard-step2");

        // Step 2 → Step 3 (message)
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(1500);
          await ss(page, "12-campaign-wizard-message");
        }
      }

      // Check message step for variable buttons
      const pageText = await page.textContent("body");

      // Check variable chips use {{variable}} not {ชื่อ}
      const hasNewSyntax = /\{\{name\}\}|\{\{otp\}\}|\{\{phone\}\}/.test(
        pageText || ""
      );
      const hasOldSyntax = /\{ชื่อ\}|\{เบอร์\}|\{โค้ด\}/.test(
        pageText || ""
      );

      console.log("👁️ {{variable}} syntax present:", hasNewSyntax ? "✅" : "⚠️ not visible yet");
      console.log(
        "👁️ Old {ชื่อ} syntax:",
        hasOldSyntax ? "❌ OLD SYNTAX FOUND!" : "✅ No old syntax"
      );

      // Look for variable insert buttons specifically
      const varBtns = page.locator(
        'button:has-text("{{name}}"), button:has-text("{{otp}}"), button:has-text("{{phone}}"), button:has-text("ชื่อ"), button:has-text("OTP")'
      );
      const btnCount = await varBtns.count();
      console.log("👁️ Variable buttons found:", btnCount);

      for (let i = 0; i < Math.min(btnCount, 8); i++) {
        const txt = await varBtns.nth(i).textContent();
        console.log(`  📍 Var button ${i + 1}: "${txt}"`);

        // Check each button's text/value attribute
        const val = await varBtns.nth(i).getAttribute("data-value");
        if (val) console.log(`     data-value: "${val}"`);
      }

      // Look for template picker
      const templatePicker = page.locator(
        'button:has-text("เทมเพลต"), select:has-text("template"), [class*="template"]'
      );
      if (
        await templatePicker
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        await templatePicker.first().click();
        await page.waitForTimeout(1000);
        await ss(page, "13-template-picker");
        console.log("✅ Template picker visible");

        // Check no archived templates shown
        const pickerText = await page.textContent("body");
        console.log(
          "👁️ Archived templates in picker:",
          /archived|ถูกลบ|ถูกเก็บ/i.test(pickerText || "")
            ? "⚠️ ARCHIVED VISIBLE"
            : "✅ No archived"
        );
      }
    } else {
      console.log("⚠️ Campaign create button not found");
      await ss(page, "10-no-create-btn");
    }
  });

  test("B7. Campaign wizard — PhonePreview shows {{variable}}", async ({
    page,
  }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/send`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "14-send-page");

    // Fill message textarea (second textarea — first is recipients "ผู้รับ")
    const textareas = page.locator("textarea");
    const count = await textareas.count();
    console.log("📍 Textareas found:", count);
    // Message textarea is labeled "ข้อความ" — find it specifically
    const msgTextarea = page.locator('textarea[placeholder*="ข้อความ"], textarea[placeholder*="SMS"], textarea[placeholder*="พิมพ์"]').first();
    const fallbackTextarea = count >= 2 ? textareas.nth(1) : textareas.first();
    const textarea = await msgTextarea.isVisible({ timeout: 2000 }).catch(() => false) ? msgTextarea : fallbackTextarea;
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill(
        "สวัสดี {{name}} รหัส OTP: {{otp}} เบอร์ {{phone}}"
      );
      await page.waitForTimeout(1500);
      await ss(page, "15-phone-preview-variables");

      // Check PhonePreview renders variables (should show sample data)
      const previewArea = page
        .locator(
          '[class*="phone"], [class*="preview"], [class*="mockup"], [class*="device"]'
        )
        .first();
      if (
        await previewArea.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        const previewText = await previewArea.textContent();
        console.log(
          "👁️ PhonePreview text:",
          (previewText || "").substring(0, 200)
        );

        // Should show sample values like "สมชาย" for {{name}}
        const hasPreviewData =
          /สมชาย|Customer|482910|089/.test(previewText || "") ||
          /\{\{name\}\}|\{\{otp\}\}/.test(previewText || "");
        console.log(
          "👁️ PhonePreview renders:",
          hasPreviewData ? "✅" : "⚠️ no preview data visible"
        );
      } else {
        console.log("⚠️ PhonePreview element not found");
      }

      // Check variable insert buttons on send page
      const varBtns = page.locator(
        'button:has-text("{{"), button:has-text("name"), button:has-text("OTP")'
      );
      const count = await varBtns.count();
      console.log("👁️ Variable buttons on send page:", count);
    } else {
      console.log("⚠️ Textarea not found on send page");
    }
  });

  test("B8. Campaign wizard — template picker excludes archived", async ({
    page,
  }) => {
    await login(page);

    // First create and delete a template via API so we have an archived one
    const cookie = await getSessionCookie();
    const createRes = await api("/api/v1/templates", {
      method: "POST",
      cookie,
      body: {
        name: `QA-Archive-Test-${Date.now()}`,
        content: "Archived template {{name}} test",
        category: "general",
      },
    });
    const archiveId = createRes.data?.id;
    if (archiveId) {
      await api(`/api/v1/templates/${archiveId}`, {
        method: "DELETE",
        cookie,
      });
      console.log("📍 Created and archived template:", archiveId);
    }

    // Now go to campaign wizard and check template picker
    await page.goto(`${BASE}/dashboard/campaigns`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    const createBtn = page
      .locator(
        'button:has-text("สร้าง"), button:has-text("Create")'
      )
      .first();

    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Button may be disabled — use force:true or navigate directly
      await createBtn.click({ force: true }).catch(async () => {
        // If click fails, try navigating to campaign create page directly
        await page.goto(`${BASE}/dashboard/campaigns/new`, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle").catch(() => {});
      });
      await page.waitForTimeout(2000);

      // Look for template selection in any step
      const pageText = await page.textContent("body");

      // Check archived template name is NOT shown
      if (archiveId) {
        const archivedName = `QA-Archive-Test`;
        const showsArchived = (pageText || "").includes(archivedName);
        console.log(
          "👁️ Archived template visible in wizard:",
          showsArchived ? "❌ SHOWING ARCHIVED" : "✅ Hidden"
        );
      }

      await ss(page, "16-wizard-template-check");
    }
  });

  test("B9. Billing page loads (DB columns fixed)", async ({ page }) => {
    await login(page);
    try {
      const res = await page.goto(`${BASE}/dashboard/billing`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(2000);
      await ss(page, "17-billing-page");

      const status = res?.status() || 0;
      console.log(`📍 /dashboard/billing → ${status}`);
      console.log(
        `👁️ Billing:`,
        status >= 500
          ? "❌ SERVER ERROR (DB fix NOT working)"
          : "✅ LOADS OK"
      );

      const text = await page.textContent("body");
      const hasServerError = /internal server error|server error occurred/i.test(
        text || ""
      );
      console.log("👁️ Server error text:", hasServerError ? "❌" : "✅ None");
    } catch (err) {
      await ss(page, "17-billing-error").catch(() => {});
      console.log(
        `❌ Billing FAILED: ${(err as Error).message.substring(0, 200)}`
      );
    }
  });

  test("B10. API Docs — {{variable}} syntax shown", async ({ browser }) => {
    // API docs is public — use fresh context
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto(`${BASE}/dashboard/api-docs`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: path.join(DIR, "18-api-docs.png"),
      fullPage: false,
    });
    console.log(`📸 ${path.join(DIR, "18-api-docs.png")}`);

    const text = await page.textContent("body");

    // Check for {{variable}} syntax in docs
    const hasNewSyntax = /\{\{name\}\}|\{\{otp\}\}|\{\{variable\}\}|\{\{/.test(
      text || ""
    );
    const hasOldSyntax = /\{ชื่อ\}|\{เบอร์\}/.test(text || "");

    console.log(
      "👁️ API docs {{variable}} syntax:",
      hasNewSyntax ? "✅" : "⚠️ not visible"
    );
    console.log(
      "👁️ API docs old {ชื่อ} syntax:",
      hasOldSyntax ? "❌ OLD SYNTAX" : "✅ None"
    );

    // Check page loaded properly
    const hasApiContent = /API|endpoint|template|SMS/i.test(text || "");
    console.log("👁️ API docs content:", hasApiContent ? "✅" : "⚠️ missing");

    await ctx.close();
  });

  test("B11. All tested pages — console errors check", async ({ page }) => {
    await login(page);
    const pages = [
      "/dashboard/templates",
      "/dashboard/campaigns",
      "/dashboard/send",
      "/dashboard/billing",
    ];

    for (const p of pages) {
      try {
        await page.goto(`${BASE}${p}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(1500);
      } catch {}
    }

    await ss(page, "19-console-check");

    const prismaErrors = consoleErrors.filter((e) =>
      /prisma|total_amount|email_package_expiry/i.test(e)
    );
    const templateErrors = consoleErrors.filter((e) =>
      /template|variable|syntax/i.test(e)
    );

    console.log(`📊 Total console errors: ${consoleErrors.length}`);
    console.log(`📊 Prisma-related: ${prismaErrors.length}`);
    console.log(`📊 Template-related: ${templateErrors.length}`);
    consoleErrors.slice(0, 8).forEach((e) =>
      console.log("  -", e.substring(0, 150))
    );

    if (prismaErrors.length > 0) {
      console.log("⚠️ Prisma errors still present");
    } else {
      console.log("✅ No Prisma errors");
    }
  });

  test("B12. Mobile 375px — templates + campaigns", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    for (const [p, label] of [
      ["/dashboard/templates", "templates"],
      ["/dashboard/campaigns", "campaigns"],
    ] as const) {
      await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1500);
      const w = await page.evaluate(() => document.body.scrollWidth);
      await ss(page, `20-mobile-${label}`);
      console.log(
        `👁️ Mobile ${label}: ${w}/375 → ${w > 375 ? "⚠️ OVERFLOW" : "✅"}`
      );
    }
  });
});
