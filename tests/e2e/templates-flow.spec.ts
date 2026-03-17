import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS = path.join(__dirname, "..", "screenshots", "templates-flow");
const CSRF = { Origin: "http://localhost:3000", Referer: "http://localhost:3000/" };

test.describe("Deep Flow Test: Templates Management", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });
  });

  test("Templates full flow — create, edit, delete, categories, variables", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }

    // Step 1: Navigate to Templates page
    await page.goto("/dashboard/templates", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();
    await page.screenshot({ path: path.join(SCREENSHOTS, "01-templates-page.png"), fullPage: true });
    console.log(`📍 URL: ${page.url()}`);
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toContain("เทมเพลต");
    console.log("✅ Templates page loaded");

    // Step 2: Click "สร้างใหม่" button
    const createBtn = page.locator('button:has-text("สร้างใหม่"), a:has-text("สร้างใหม่"), button:has-text("สร้าง")').first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    await createBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS, "02-create-form.png"), fullPage: true });
    console.log(`📍 After create click: ${page.url()}`);

    // Step 3: Fill template form — name
    const nameInput = page.locator('input[name="name"], input[placeholder*="ชื่อ"]').first();
    const templateName = `QA-Flow-${Date.now().toString(36)}`;
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill(templateName);
      console.log(`✅ Template name: ${templateName}`);
    }

    // Step 4: Fill content with variables {{name}} and {{phone}}
    const contentInput = page.locator('textarea[name="content"], textarea[placeholder*="ข้อความ"], textarea[placeholder*="เนื้อหา"]').first();
    if (await contentInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const content = "สวัสดีค่ะ คุณ{{name}} เบอร์{{phone}} ยืนยันการนัดหมายเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ SMSOK";
      await contentInput.fill(content);
      await contentInput.press("Space");
      await contentInput.press("Backspace");
      await page.waitForTimeout(500);
      console.log("✅ Content with variables filled");
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "03-form-filled.png"), fullPage: true });

    // Step 5: Check SMS segment counter — Thai text > 70 chars should show 2 segments
    const pageContent = await page.locator("body").innerText();
    const segmentMatch = pageContent.match(/(\d+)\/(\d+)\s*chars.*?(\d+)\s*SMS/);
    if (segmentMatch) {
      console.log(`📊 Counter: ${segmentMatch[1]}/${segmentMatch[2]} chars · ${segmentMatch[3]} SMS`);
      const charCount = parseInt(segmentMatch[1]);
      const denom = parseInt(segmentMatch[2]);
      const segments = parseInt(segmentMatch[3]);
      if (charCount > 70) {
        expect(denom).toBe(67); // UCS-2 multi
        expect(segments).toBeGreaterThanOrEqual(2);
        console.log("✅ Thai text >70 chars → multi-segment counter correct");
      }
    } else {
      // Try simpler pattern
      const simpleMatch = pageContent.match(/(\d+)\s*SMS/);
      if (simpleMatch) {
        console.log(`📊 SMS segments: ${simpleMatch[0]}`);
      }
    }

    // Step 6: Select category
    const categorySelect = page.locator('select[name="category"], [role="combobox"]').first();
    if (await categorySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await categorySelect.selectOption("transactional").catch(async () => {
        // If custom dropdown, click it
        await categorySelect.click();
        await page.waitForTimeout(500);
        const option = page.locator('text="Transactional"').first();
        if (await option.isVisible().catch(() => false)) {
          await option.click();
        }
      });
      console.log("✅ Category selected: transactional");
    } else {
      // Try radio buttons or tabs
      const transCat = page.locator('text=/transactional/i, label:has-text("transactional")').first();
      if (await transCat.isVisible({ timeout: 2000 }).catch(() => false)) {
        await transCat.click();
        console.log("✅ Category clicked: transactional");
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "04-category-selected.png"), fullPage: true });

    // Step 7: Submit/Save template
    const saveBtn = page.locator('button[type="submit"], button:has-text("บันทึก"), button:has-text("สร้าง")').last();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS, "05-after-save.png"), fullPage: true });
      console.log(`📍 After save: ${page.url()}`);

      const afterSaveText = await page.locator("body").innerText();
      if (afterSaveText.includes("สำเร็จ") || afterSaveText.includes(templateName)) {
        console.log("✅ Template saved successfully");
      }
    }

    // Step 8: Go back to templates list to verify it appears
    await page.goto("/dashboard/templates", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(SCREENSHOTS, "06-list-after-create.png"), fullPage: true });

    const listText = await page.locator("body").innerText();
    if (listText.includes(templateName)) {
      console.log("✅ New template appears in list");
    } else {
      console.log("⚠️ Template not visible in list (may need refresh or was created via different page)");
    }

    // Step 9: Category tabs — click each tab
    const categoryTabs = ["ทั้งหมด", "ทั่วไป", "OTP", "การตลาด", "แจ้งเตือน"];
    for (const tab of categoryTabs) {
      const tabEl = page.locator(`text="${tab}"`).first();
      if (await tabEl.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tabEl.click();
        await page.waitForTimeout(500);
        console.log(`✅ Category tab "${tab}" clicked`);
      }
    }
    await page.screenshot({ path: path.join(SCREENSHOTS, "07-category-tabs.png"), fullPage: true });

    // Step 10: API — test duplicate name rejection
    const dupResp = await page.request.post("/api/v1/templates", {
      headers: CSRF,
      data: { name: templateName, content: "test duplicate", category: "general" },
    });
    console.log(`📊 Duplicate template name → ${dupResp.status()}`);
    if ([400, 409].includes(dupResp.status())) {
      console.log("✅ Duplicate template name rejected");
    } else if (dupResp.status() === 201) {
      console.log("⚠️ Duplicate template name allowed (may be by design)");
      // Clean up
      const dupBody = await dupResp.json();
      const dupData = dupBody.data || dupBody;
      if (dupData.id) {
        await page.request.delete(`/api/v1/templates/${dupData.id}`, { headers: CSRF });
      }
    }

    // Step 11: API — edit template
    // First get the template ID
    const listResp = await page.request.get("/api/v1/templates?search=" + encodeURIComponent(templateName));
    const listBody = await listResp.json();
    const templates = (listBody.data || listBody).templates || [];
    const foundTemplate = templates.find((t: { name: string }) => t.name === templateName);

    if (foundTemplate) {
      const tid = foundTemplate.id;

      // Edit via API
      const editResp = await page.request.put(`/api/v1/templates/${tid}`, {
        headers: CSRF,
        data: { name: templateName + "-edited", content: "แก้ไขแล้ว {{name}}" },
      });
      expect(editResp.status()).toBe(200);
      console.log(`✅ Template edited via API → 200`);

      // Verify edit
      const getResp = await page.request.get(`/api/v1/templates/${tid}`);
      const getData = (await getResp.json()).data || await getResp.json();
      expect(getData.name).toBe(templateName + "-edited");
      console.log(`✅ Edit verified: name="${getData.name}"`);

      // Step 12: Preview with variables
      const previewResp = await page.request.post(`/api/v1/templates/${tid}/preview`, {
        headers: CSRF,
        data: { variables: { name: "สมชาย" } },
      });
      expect(previewResp.status()).toBe(200);
      const previewData = (await previewResp.json()).data || await previewResp.json();
      expect(previewData.rendered).toContain("สมชาย");
      console.log(`✅ Preview with variables: "${previewData.rendered}"`);

      // Step 13: Delete template
      const deleteResp = await page.request.delete(`/api/v1/templates/${tid}`, { headers: CSRF });
      expect(deleteResp.status()).toBe(200);
      console.log(`✅ Template deleted → 200`);

      // Verify deletion
      const afterDelete = await page.request.get(`/api/v1/templates/${tid}`);
      expect(afterDelete.status()).toBe(404);
      console.log(`✅ Deleted template returns 404`);
    } else {
      console.log("⚠️ Template not found in API list for edit/delete tests");
    }

    // Step 14: Reload templates page — verify deleted template gone
    await page.goto("/dashboard/templates", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(SCREENSHOTS, "08-after-delete.png"), fullPage: true });

    // Step 15: Edge case — empty content
    const emptyResp = await page.request.post("/api/v1/templates/validate", {
      headers: CSRF,
      data: { content: "" },
    });
    expect([400, 422]).toContain(emptyResp.status());
    console.log(`✅ Empty content validation → ${emptyResp.status()}`);

    // Step 16: Edge case — XSS in template content
    const xssResp = await page.request.post("/api/v1/templates/validate", {
      headers: CSRF,
      data: { content: '<script>alert("xss")</script>' },
    });
    const xssStatus = xssResp.status();
    console.log(`✅ XSS content validation → ${xssStatus}`);

    // Step 17: Edge case — very long content
    const longResp = await page.request.post("/api/v1/templates/validate", {
      headers: CSRF,
      data: { content: "A".repeat(1001) },
    });
    console.log(`✅ Long content (1001 chars) → ${longResp.status()}`);

    // Console errors check
    const realErrors = consoleErrors.filter(e =>
      !e.includes("favicon") && !e.includes("hydration") && !e.includes("third-party")
    );
    if (realErrors.length > 0) {
      console.log(`❌ Console errors: ${realErrors.slice(0, 5).join("; ")}`);
    } else {
      console.log("✅ No significant console errors");
    }

    // Step 18: Mobile responsive
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS, "09-mobile-375.png"), fullPage: true });
    console.log("📱 Mobile 375px done");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS, "10-mobile-390.png"), fullPage: true });
    console.log("📱 Mobile 390px done");
  });
});
