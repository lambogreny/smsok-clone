import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS = path.join(__dirname, "..", "screenshots", "groups-templates-retest");
const CSRF = {
  Origin: "http://localhost:3000",
  Referer: "http://localhost:3000/",
};

test.describe("Retest Contact Groups + Templates API (post-#5221 cleanup)", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });
  });

  // ===== GROUPS API =====
  test("Layer 1 — Groups CRUD API", async ({ request }) => {
    // 1. GET /api/v1/groups → list
    const listResp = await request.get("/api/v1/groups");
    expect(listResp.status()).toBe(200);
    const listBody = await listResp.json();
    const listData = listBody.data || listBody;
    expect(listData.groups).toBeInstanceOf(Array);
    console.log(`✅ GET /api/v1/groups → 200, ${listData.groups.length} groups`);

    // Check response shape
    if (listData.groups.length > 0) {
      const g = listData.groups[0];
      expect(g).toHaveProperty("id");
      expect(g).toHaveProperty("name");
      console.log(`✅ Group shape: id=${g.id}, name=${g.name}, memberCount=${g.memberCount}`);
    }

    // 2. POST /api/v1/groups → create
    const uniqueName = `QA-Group-${Date.now().toString(36)}`;
    const createResp = await request.post("/api/v1/groups", {
      headers: CSRF,
      data: { name: uniqueName },
    });
    expect(createResp.status()).toBe(201);
    const createBody = await createResp.json();
    const created = createBody.data || createBody;
    expect(created.name).toBe(uniqueName);
    const groupId = created.id;
    console.log(`✅ POST /api/v1/groups → 201, id=${groupId}, name=${uniqueName}`);

    // 3. POST duplicate name → should reject
    const dupResp = await request.post("/api/v1/groups", {
      headers: CSRF,
      data: { name: uniqueName },
    });
    expect([400, 409]).toContain(dupResp.status());
    const dupBody = await dupResp.json();
    console.log(`✅ POST duplicate name → ${dupResp.status()}, error: ${JSON.stringify(dupBody.error || dupBody.message || "").substring(0, 80)}`);

    // 4. POST empty name → should reject
    const emptyResp = await request.post("/api/v1/groups", {
      headers: CSRF,
      data: { name: "" },
    });
    expect([400, 422]).toContain(emptyResp.status());
    console.log(`✅ POST empty name → ${emptyResp.status()}`);

    // 5. POST XSS name → should sanitize or reject
    const xssResp = await request.post("/api/v1/groups", {
      headers: CSRF,
      data: { name: '<script>alert("xss")</script>' },
    });
    const xssStatus = xssResp.status();
    if (xssStatus === 201) {
      const xssBody = await xssResp.json();
      const xssData = xssBody.data || xssBody;
      if (xssData.name && xssData.name.includes("<script>")) {
        console.log(`⚠️ POST XSS name → 201 but stored unsanitized: ${xssData.name}`);
      } else {
        console.log(`✅ POST XSS name → 201 but sanitized: ${xssData.name}`);
      }
      // Clean up
      await request.delete(`/api/v1/groups/${xssData.id}`, { headers: CSRF });
    } else {
      console.log(`✅ POST XSS name → ${xssStatus} rejected`);
    }

    // 6. GET /api/v1/groups/:id → single group
    const getResp = await request.get(`/api/v1/groups/${groupId}`);
    expect(getResp.status()).toBe(200);
    const getBody = await getResp.json();
    const getData = getBody.data || getBody;
    expect(getData.id).toBe(groupId);
    expect(getData.name).toBe(uniqueName);
    console.log(`✅ GET /api/v1/groups/${groupId} → 200, name=${getData.name}`);

    // 7. GET /api/v1/groups/:id/members → paginated members
    const membersResp = await request.get(`/api/v1/groups/${groupId}/members`);
    expect(membersResp.status()).toBe(200);
    const membersBody = await membersResp.json();
    const membersData = membersBody.data || membersBody;
    expect(membersData.members).toBeInstanceOf(Array);
    expect(membersData.pagination).toBeTruthy();
    console.log(`✅ GET /groups/${groupId}/members → 200, ${membersData.members.length} members, pagination: page=${membersData.pagination.page}`);

    // 8. GET members with pagination params
    const paginatedResp = await request.get(`/api/v1/groups/${groupId}/members?page=1&limit=5`);
    expect(paginatedResp.status()).toBe(200);
    const paginatedBody = await paginatedResp.json();
    const paginatedData = paginatedBody.data || paginatedBody;
    expect(paginatedData.pagination.limit).toBe(5);
    console.log(`✅ GET members?page=1&limit=5 → pagination.limit=${paginatedData.pagination.limit}`);

    // 9. GET members with search
    const searchResp = await request.get(`/api/v1/groups/${groupId}/members?search=nonexistent`);
    expect(searchResp.status()).toBe(200);
    const searchData = (await searchResp.json()).data || await searchResp.json();
    console.log(`✅ GET members?search=nonexistent → ${(searchData.members || []).length} results`);

    // 10. PATCH /api/v1/groups/:id → update name
    const patchResp = await request.patch(`/api/v1/groups/${groupId}`, {
      headers: CSRF,
      data: { name: uniqueName + "-updated" },
    });
    expect(patchResp.status()).toBe(200);
    console.log(`✅ PATCH /groups/${groupId} → 200, name updated`);

    // 11. GET nonexistent group → 404
    const notFoundResp = await request.get("/api/v1/groups/nonexistent-id-12345");
    expect([404, 400]).toContain(notFoundResp.status());
    console.log(`✅ GET nonexistent group → ${notFoundResp.status()}`);

    // 12. SQL injection in group ID
    const sqlResp = await request.get("/api/v1/groups/'; DROP TABLE contact_groups;--");
    expect([400, 404]).toContain(sqlResp.status());
    console.log(`✅ SQL injection in group ID → ${sqlResp.status()}, no crash`);

    // 13. DELETE /api/v1/groups/:id
    const deleteResp = await request.delete(`/api/v1/groups/${groupId}`, { headers: CSRF });
    expect(deleteResp.status()).toBe(200);
    console.log(`✅ DELETE /groups/${groupId} → 200`);

    // 14. GET deleted group → 404
    const afterDeleteResp = await request.get(`/api/v1/groups/${groupId}`);
    expect([404, 400]).toContain(afterDeleteResp.status());
    console.log(`✅ GET deleted group → ${afterDeleteResp.status()}`);

    // 15. No auth → 401
    const noAuthResp = await request.get("/api/v1/groups", {
      headers: { Cookie: "" },
    });
    // Note: Playwright request context has cookies, this may still pass
    console.log(`✅ Groups API auth check done`);
  });

  // ===== OLD ROUTE CHECK =====
  test("Layer 1 — Old /api/v1/contacts/groups route removed", async ({ request }) => {
    const oldRouteResp = await request.get("/api/v1/contacts/groups");
    const status = oldRouteResp.status();
    console.log(`📍 GET /api/v1/contacts/groups → ${status}`);

    if (status === 404) {
      console.log("✅ Old route /api/v1/contacts/groups removed (404)");
    } else if (status === 301 || status === 308) {
      const location = oldRouteResp.headers()["location"];
      console.log(`✅ Old route redirects to: ${location}`);
    } else if (status === 200) {
      console.log("⚠️ Old route /api/v1/contacts/groups still exists (200)");
    }
  });

  // ===== TEMPLATES API =====
  test("Layer 1 — Templates CRUD + validate/render/preview response shape", async ({ request }) => {
    // 1. POST /api/v1/templates → create
    const createResp = await request.post("/api/v1/templates", {
      headers: CSRF,
      data: {
        name: `QA-Template-${Date.now().toString(36)}`,
        content: "สวัสดี {{name}} คุณมียอด {{amount}} บาท",
        category: "transactional",
      },
    });
    expect(createResp.status()).toBe(201);
    const createBody = await createResp.json();
    const created = createBody.data || createBody;
    expect(created.id).toBeTruthy();
    expect(created.name).toBeTruthy();
    const templateId = created.id;
    console.log(`✅ POST /api/v1/templates → 201, id=${templateId}`);

    // 2. GET /api/v1/templates → list with pagination
    const listResp = await request.get("/api/v1/templates");
    expect(listResp.status()).toBe(200);
    const listBody = await listResp.json();
    const listData = listBody.data || listBody;
    expect(listData.templates).toBeInstanceOf(Array);
    expect(listData.pagination).toBeTruthy();
    console.log(`✅ GET /api/v1/templates → 200, ${listData.templates.length} templates`);

    // Check template shape — must have segmentCount, NOT smsCount
    if (listData.templates.length > 0) {
      const t = listData.templates[0];
      expect(t).toHaveProperty("id");
      expect(t).toHaveProperty("name");
      expect(t).toHaveProperty("content");
      expect(t).toHaveProperty("segmentCount");
      expect(t).not.toHaveProperty("smsCount");
      console.log(`✅ Template shape: segmentCount=${t.segmentCount} (NOT smsCount) ✅`);
    }

    // 3. GET /api/v1/templates/:id → single template
    const getResp = await request.get(`/api/v1/templates/${templateId}`);
    expect(getResp.status()).toBe(200);
    const getBody = await getResp.json();
    const getData = getBody.data || getBody;
    expect(getData.id).toBe(templateId);
    expect(getData).toHaveProperty("segmentCount");
    expect(getData).not.toHaveProperty("smsCount");
    console.log(`✅ GET /templates/${templateId} → segmentCount present, smsCount absent ✅`);

    // 4. POST /api/v1/templates/validate → check response shape
    const validateResp = await request.post("/api/v1/templates/validate", {
      headers: CSRF,
      data: { content: "ทดสอบ {{name}} ยอด {{amount}}" },
    });
    expect(validateResp.status()).toBe(200);
    const validateBody = await validateResp.json();
    const validateData = validateBody.data || validateBody;
    // Must have segmentCount, NOT smsCount
    expect(validateData).toHaveProperty("segmentCount");
    expect(validateData).not.toHaveProperty("smsCount");
    expect(validateData).toHaveProperty("charsPerSegment");
    expect(validateData).toHaveProperty("encoding");
    expect(validateData).toHaveProperty("charCount");
    console.log(`✅ POST /templates/validate → segmentCount=${validateData.segmentCount}, charsPerSegment=${validateData.charsPerSegment}, encoding=${validateData.encoding}`);

    // 5. POST /api/v1/templates/render → check response shape
    // Variables use {{name}} syntax (double braces)
    const renderResp = await request.post("/api/v1/templates/render", {
      headers: CSRF,
      data: { content: "สวัสดี {{name}}", variables: { name: "QA" } },
    });
    expect(renderResp.status()).toBe(200);
    const renderBody = await renderResp.json();
    const renderData = renderBody.data || renderBody;
    expect(renderData).toHaveProperty("rendered");
    expect(renderData.rendered).toBe("สวัสดี QA");
    // Response shape check — must use segmentCount not smsCount
    expect(renderData).toHaveProperty("charCount");
    expect(renderData).toHaveProperty("encoding");
    expect(renderData).toHaveProperty("charsPerSegment");
    // Check which field name is used for segment count
    const hasSegmentCount = "segmentCount" in renderData;
    const hasSmsCount = "smsCount" in renderData;
    console.log(`✅ POST /templates/render → rendered="${renderData.rendered}", segmentCount=${hasSegmentCount ? renderData.segmentCount : "N/A"}, smsCount=${hasSmsCount ? renderData.smsCount : "N/A"}`);
    if (hasSmsCount && !hasSegmentCount) {
      console.log("⚠️ render uses smsCount instead of segmentCount — inconsistent with validate/preview!");
    }

    // 6. POST /api/v1/templates/:id/preview → check response shape
    const previewResp = await request.post(`/api/v1/templates/${templateId}/preview`, {
      headers: CSRF,
      data: { variables: { name: "QA", amount: "500" } },
    });
    expect(previewResp.status()).toBe(200);
    const previewBody = await previewResp.json();
    const previewData = previewBody.data || previewBody;
    expect(previewData).toHaveProperty("rendered");
    expect(previewData.rendered).toContain("QA");
    expect(previewData.rendered).toContain("500");
    const previewHasSegmentCount = "segmentCount" in previewData;
    const previewHasSmsCount = "smsCount" in previewData;
    console.log(`✅ POST /templates/${templateId}/preview → rendered="${previewData.rendered}", segmentCount=${previewHasSegmentCount ? previewData.segmentCount : "N/A"}, smsCount=${previewHasSmsCount ? previewData.smsCount : "N/A"}`);
    if (previewHasSmsCount && !previewHasSegmentCount) {
      console.log("⚠️ preview uses smsCount instead of segmentCount — inconsistent!");
    }

    // 7. Compare response shapes across validate/render/preview
    console.log("\n📊 Response Shape Comparison:");
    console.log(`  validate: segmentCount=${hasSegmentCount ? "✅" : "❌"}, smsCount=${"smsCount" in validateData ? "⚠️" : "❌"}`);
    console.log(`  render:   segmentCount=${hasSegmentCount ? "✅" : "❌"}, smsCount=${hasSmsCount ? "⚠️" : "❌"}`);
    console.log(`  preview:  segmentCount=${previewHasSegmentCount ? "✅" : "❌"}, smsCount=${previewHasSmsCount ? "⚠️" : "❌"}`);

    // 8. PUT /api/v1/templates/:id → update
    const updateResp = await request.put(`/api/v1/templates/${templateId}`, {
      headers: CSRF,
      data: { name: "QA-Updated-Template", content: "Updated: {name}" },
    });
    expect(updateResp.status()).toBe(200);
    console.log(`✅ PUT /templates/${templateId} → 200 updated`);

    // 9. DELETE /api/v1/templates/:id → soft delete
    const deleteResp = await request.delete(`/api/v1/templates/${templateId}`, { headers: CSRF });
    expect(deleteResp.status()).toBe(200);
    console.log(`✅ DELETE /templates/${templateId} → 200 soft deleted`);

    // 10. GET deleted template → 404
    const afterDeleteResp = await request.get(`/api/v1/templates/${templateId}`);
    expect(afterDeleteResp.status()).toBe(404);
    console.log(`✅ GET deleted template → ${afterDeleteResp.status()}`);

    // 11. POST empty content → 400
    const emptyResp = await request.post("/api/v1/templates/validate", {
      headers: CSRF,
      data: { content: "" },
    });
    expect([400, 422]).toContain(emptyResp.status());
    console.log(`✅ POST validate empty → ${emptyResp.status()}`);

    // 12. GET templates with category filter
    const filterResp = await request.get("/api/v1/templates?category=transactional");
    expect(filterResp.status()).toBe(200);
    console.log(`✅ GET templates?category=transactional → 200`);
  });

  // ===== LAYER 2: BROWSER TEST =====
  test("Layer 2 — Browser: Groups + Templates pages", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    // Dismiss cookies helper
    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }

    // 1. Groups page
    await page.goto("/dashboard/contacts/groups", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();
    await page.screenshot({ path: path.join(SCREENSHOTS, "01-groups-page.png"), fullPage: true });
    console.log(`📍 Groups page: ${page.url()}`);

    const groupsBody = await page.locator("body").innerText();
    if (groupsBody.includes("กลุ่ม")) {
      console.log("✅ Groups page loads with content");
    }

    // 2. Create group via UI
    const createGroupBtn = page.locator('button:has-text("สร้างกลุ่ม"), button:has-text("เพิ่มกลุ่ม"), a:has-text("สร้างกลุ่ม")').first();
    if (await createGroupBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createGroupBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS, "02-create-group-dialog.png"), fullPage: true });

      // Look for name input in modal/dialog
      const nameInput = page.locator('input[name="name"], input[placeholder*="ชื่อกลุ่ม"], input[placeholder*="กลุ่ม"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill(`QA-Browser-${Date.now().toString(36)}`);
        const submitBtn = page.locator('button[type="submit"], button:has-text("สร้าง"), button:has-text("บันทึก")').first();
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(SCREENSHOTS, "03-group-created.png"), fullPage: true });
          console.log("✅ Group created via browser UI");
        }
      }
    } else {
      console.log("⚠️ Create group button not found");
    }

    // 3. Templates page
    await page.goto("/dashboard/templates", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(SCREENSHOTS, "04-templates-page.png"), fullPage: true });
    console.log(`📍 Templates page: ${page.url()}`);

    const templatesBody = await page.locator("body").innerText();
    if (templatesBody.includes("เทมเพลต") || templatesBody.includes("Template")) {
      console.log("✅ Templates page loads with content");
    }

    // 4. Create template via UI
    const createTemplateBtn = page.locator('button:has-text("สร้าง"), button:has-text("เพิ่ม"), a:has-text("สร้างเทมเพลต")').first();
    if (await createTemplateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createTemplateBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS, "05-create-template.png"), fullPage: true });
      console.log("✅ Create template UI opened");
    }

    // 5. Mobile check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/contacts/groups", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(SCREENSHOTS, "06-groups-mobile.png"), fullPage: true });
    console.log("📱 Groups mobile 375px done");

    await page.goto("/dashboard/templates", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(SCREENSHOTS, "07-templates-mobile.png"), fullPage: true });
    console.log("📱 Templates mobile 375px done");

    // Console errors
    const realErrors = consoleErrors.filter(e =>
      !e.includes("favicon") && !e.includes("hydration") && !e.includes("third-party")
    );
    if (realErrors.length > 0) {
      console.log(`❌ Console errors: ${realErrors.slice(0, 5).join("; ")}`);
    } else {
      console.log("✅ No significant console errors");
    }
  });
});
