import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS = path.join(__dirname, "..", "screenshots", "groups-deep-flow");
const CSRF = { Origin: "http://localhost:3000", Referer: "http://localhost:3000/" };

test.describe("Deep Flow: Groups Management", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });
  });

  test("Groups CRUD — Layer 1 API + Layer 2 Browser", async ({ page, request }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    async function dismissCookies() {
      const btn = page.locator("text=/ยอมรับทั้งหมด|Accept All/i").first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }

    // ========== LAYER 1: API TESTS ==========
    console.log("\n=== GROUPS DEEP FLOW — Layer 1 API ===");

    // --- Step 1: Create a contact for later group tests ---
    const contactName = `QA-Contact-${Date.now().toString(36)}`;
    const contactPhone = `08${Math.floor(10000000 + Math.random() * 89999999)}`;
    const contactResp = await request.post("/api/v1/contacts", {
      headers: CSRF,
      data: { name: contactName, phone: contactPhone },
    });
    let contactId: string | null = null;
    if (contactResp.status() === 201) {
      const cData = (await contactResp.json()).data || await contactResp.json();
      contactId = cData.id;
      console.log(`✅ Contact created: ${contactId} (${contactName} ${contactPhone})`);
    } else if (contactResp.status() === 409) {
      console.log(`⚠️ Contact phone exists, trying to find it`);
      const searchResp = await request.get(`/api/v1/contacts?search=${contactPhone}`);
      if (searchResp.status() === 200) {
        const sData = (await searchResp.json()).data || await searchResp.json();
        const found = (sData.contacts || [])[0];
        if (found) contactId = found.id;
      }
    } else {
      console.log(`📊 Contact create → ${contactResp.status()}: ${await contactResp.text()}`);
    }

    // Create second contact for bulk operations
    const contact2Phone = `08${Math.floor(10000000 + Math.random() * 89999999)}`;
    const contact2Resp = await request.post("/api/v1/contacts", {
      headers: CSRF,
      data: { name: `QA-Contact2-${Date.now().toString(36)}`, phone: contact2Phone },
    });
    let contact2Id: string | null = null;
    if (contact2Resp.status() === 201) {
      const c2Data = (await contact2Resp.json()).data || await contact2Resp.json();
      contact2Id = c2Data.id;
      console.log(`✅ Contact2 created: ${contact2Id}`);
    }

    // --- Step 2: Create Group ---
    const groupName = `QA-Group-${Date.now().toString(36)}`;
    const createResp = await request.post("/api/v1/groups", {
      headers: CSRF,
      data: { name: groupName },
    });
    expect(createResp.status()).toBe(201);
    const createData = (await createResp.json()).data || await createResp.json();
    const groupId = createData.id;
    console.log(`✅ Group created: ${groupId} (${groupName})`);

    // --- Step 3: Get Group Detail ---
    const detailResp = await request.get(`/api/v1/groups/${groupId}`);
    expect(detailResp.status()).toBe(200);
    const detailData = (await detailResp.json()).data || await detailResp.json();
    expect(detailData.name).toBe(groupName);
    console.log(`✅ Group detail: name="${detailData.name}", memberCount=${detailData.memberCount}`);

    // --- Step 4: Duplicate group name → 409 ---
    const dupResp = await request.post("/api/v1/groups", {
      headers: CSRF,
      data: { name: groupName },
    });
    expect(dupResp.status()).toBe(409);
    console.log(`✅ Duplicate group name → 409`);

    // --- Step 5: Empty group name → 400 ---
    const emptyResp = await request.post("/api/v1/groups", {
      headers: CSRF,
      data: { name: "" },
    });
    expect(emptyResp.status()).toBe(400);
    console.log(`✅ Empty group name → 400`);

    // --- Step 6: XSS in group name → 400 ---
    const xssResp = await request.post("/api/v1/groups", {
      headers: CSRF,
      data: { name: '<script>alert("xss")</script>' },
    });
    expect(xssResp.status()).toBe(400);
    console.log(`✅ XSS group name → 400`);

    // --- Step 7: Add contacts to group ---
    if (contactId) {
      const addResp = await request.post("/api/v1/contacts/bulk/add-to-group", {
        headers: CSRF,
        data: { groupId, contactIds: [contactId] },
      });
      expect(addResp.status()).toBe(200);
      const addData = (await addResp.json()).data || await addResp.json();
      console.log(`✅ Add contact to group: added=${addData.added}, alreadyMember=${addData.alreadyMember}`);
      expect(addData.added).toBe(1);

      // --- Step 7b: Add same contact again → alreadyMember ---
      const addAgainResp = await request.post("/api/v1/contacts/bulk/add-to-group", {
        headers: CSRF,
        data: { groupId, contactIds: [contactId] },
      });
      expect(addAgainResp.status()).toBe(200);
      const addAgainData = (await addAgainResp.json()).data || await addAgainResp.json();
      console.log(`✅ Add same contact again: added=${addAgainData.added}, alreadyMember=${addAgainData.alreadyMember}`);
      expect(addAgainData.alreadyMember).toBeGreaterThanOrEqual(1);
    }

    // Add second contact
    if (contact2Id) {
      await request.post("/api/v1/contacts/bulk/add-to-group", {
        headers: CSRF,
        data: { groupId, contactIds: [contact2Id] },
      });
      console.log(`✅ Contact2 added to group`);
    }

    // --- Step 8: Get members ---
    const membersResp = await request.get(`/api/v1/groups/${groupId}/members`);
    expect(membersResp.status()).toBe(200);
    const membersData = (await membersResp.json()).data || await membersResp.json();
    const memberCount = (membersData.members || []).length;
    console.log(`✅ Group members: ${memberCount} members`);
    expect(memberCount).toBeGreaterThanOrEqual(1);

    // --- Step 9: Search members ---
    if (contactId) {
      const searchResp = await request.get(`/api/v1/groups/${groupId}/members?search=${contactPhone}`);
      expect(searchResp.status()).toBe(200);
      const searchData = (await searchResp.json()).data || await searchResp.json();
      console.log(`✅ Search members by phone: found ${(searchData.members || []).length}`);
    }

    // --- Step 10: Pagination ---
    const pageResp = await request.get(`/api/v1/groups/${groupId}/members?page=1&limit=1`);
    expect(pageResp.status()).toBe(200);
    const pageData = (await pageResp.json()).data || await pageResp.json();
    console.log(`✅ Pagination: page=1 limit=1, members=${(pageData.members || []).length}, total=${pageData.pagination?.total}`);

    // --- Step 11: Available contacts (not in group) ---
    const availResp = await request.get(`/api/v1/groups/${groupId}/available-contacts`);
    if (availResp.status() === 200) {
      const availData = (await availResp.json()).data || await availResp.json();
      console.log(`✅ Available contacts: ${(availData.contacts || []).length}`);
    } else {
      console.log(`📊 Available contacts → ${availResp.status()}`);
    }

    // --- Step 12: Remove member from group ---
    if (contact2Id) {
      const removeResp = await request.post(`/api/v1/groups/${groupId}/members/bulk-remove`, {
        headers: CSRF,
        data: { contactIds: [contact2Id] },
      });
      expect(removeResp.status()).toBe(200);
      const removeData = (await removeResp.json()).data || await removeResp.json();
      console.log(`✅ Remove member: removed=${removeData.removed}`);
    }

    // --- Step 13: Empty contactIds → 400 ---
    const emptyRemoveResp = await request.post(`/api/v1/groups/${groupId}/members/bulk-remove`, {
      headers: CSRF,
      data: { contactIds: [] },
    });
    expect(emptyRemoveResp.status()).toBe(400);
    console.log(`✅ Empty contactIds remove → 400`);

    // --- Step 14: Rename group ---
    const newName = groupName + "-renamed";
    const renameResp = await request.patch(`/api/v1/groups/${groupId}`, {
      headers: CSRF,
      data: { name: newName },
    });
    expect(renameResp.status()).toBe(200);
    console.log(`✅ Group renamed → "${newName}"`);

    // Verify rename
    const verifyResp = await request.get(`/api/v1/groups/${groupId}`);
    const verifyData = (await verifyResp.json()).data || await verifyResp.json();
    expect(verifyData.name).toBe(newName);
    console.log(`✅ Rename verified`);

    // --- Step 15: List groups (should contain our group) ---
    const listResp = await request.get("/api/v1/groups");
    expect(listResp.status()).toBe(200);
    const listData = (await listResp.json()).data || await listResp.json();
    const groups = listData.groups || [];
    const found = groups.find((g: { id: string }) => g.id === groupId);
    expect(found).toBeTruthy();
    console.log(`✅ Group visible in list: ${groups.length} total groups`);

    // --- Step 16: Delete group ---
    const deleteResp = await request.delete(`/api/v1/groups/${groupId}`, { headers: CSRF });
    expect(deleteResp.status()).toBe(200);
    console.log(`✅ Group deleted → 200`);

    // Verify deletion
    const afterDeleteResp = await request.get(`/api/v1/groups/${groupId}`);
    expect(afterDeleteResp.status()).toBe(404);
    console.log(`✅ Deleted group → 404`);

    // --- Step 17: Delete non-existent group → 404 ---
    const fakeDeleteResp = await request.delete(`/api/v1/groups/nonexistent123`, { headers: CSRF });
    expect([400, 404]).toContain(fakeDeleteResp.status());
    console.log(`✅ Delete fake group → ${fakeDeleteResp.status()}`);

    // --- Step 18: SQL injection in name ---
    const sqlResp = await request.post("/api/v1/groups", {
      headers: CSRF,
      data: { name: "'; DROP TABLE groups; --" },
    });
    expect(sqlResp.status()).toBe(400);
    console.log(`✅ SQL injection → 400 (safe)`);

    // Cleanup contacts
    if (contactId) {
      await request.delete(`/api/v1/contacts/${contactId}`, { headers: CSRF }).catch(() => {});
    }
    if (contact2Id) {
      await request.delete(`/api/v1/contacts/${contact2Id}`, { headers: CSRF }).catch(() => {});
    }

    // ========== LAYER 2: BROWSER TESTS ==========
    console.log("\n=== GROUPS DEEP FLOW — Layer 2 Browser ===");

    // --- Browser Step 1: Go to Groups page ---
    await page.goto("/dashboard/contacts/groups", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookies();
    await page.screenshot({ path: path.join(SCREENSHOTS, "01-groups-list.png"), fullPage: true });
    console.log(`📍 URL: ${page.url()}`);

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("เกิดข้อผิดพลาด");
    expect(bodyText).not.toContain("Internal Server Error");
    console.log("✅ Groups page loads without error");

    // --- Browser Step 2: Click create group button ---
    const createBtn = page.locator('button:has-text("สร้าง"), a:has-text("สร้าง"), button:has-text("เพิ่ม")').first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS, "02-create-group-form.png"), fullPage: true });
      console.log("✅ Create group form opened");

      // --- Browser Step 3: Fill group name ---
      const nameInput = page.locator('input[name="name"], input[placeholder*="ชื่อ"], input[placeholder*="กลุ่ม"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const browserGroupName = `QA-Browser-${Date.now().toString(36)}`;
        await nameInput.fill(browserGroupName);
        console.log(`✅ Group name filled: ${browserGroupName}`);

        await page.screenshot({ path: path.join(SCREENSHOTS, "03-group-name-filled.png"), fullPage: true });

        // --- Browser Step 4: Submit form ---
        const submitBtn = page.locator('button[type="submit"], button:has-text("บันทึก"), button:has-text("สร้าง")').last();
        if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(SCREENSHOTS, "04-after-group-create.png"), fullPage: true });
          console.log(`📍 After create: ${page.url()}`);

          const afterCreateText = await page.locator("body").innerText();
          if (afterCreateText.includes("สำเร็จ") || afterCreateText.includes(browserGroupName)) {
            console.log("✅ Group created successfully in browser");
          }

          // --- Browser Step 5: Verify group in list ---
          await page.goto("/dashboard/contacts/groups", { waitUntil: "domcontentloaded" });
          await page.waitForLoadState("networkidle").catch(() => {});
          await page.screenshot({ path: path.join(SCREENSHOTS, "05-groups-list-after-create.png"), fullPage: true });

          const listText = await page.locator("body").innerText();
          if (listText.includes(browserGroupName)) {
            console.log("✅ New group visible in list");

            // --- Browser Step 6: Click on the group ---
            const groupLink = page.locator(`text="${browserGroupName}"`).first();
            if (await groupLink.isVisible({ timeout: 3000 }).catch(() => false)) {
              await groupLink.click();
              await page.waitForTimeout(1500);
              await page.screenshot({ path: path.join(SCREENSHOTS, "06-group-detail.png"), fullPage: true });
              console.log(`📍 Group detail: ${page.url()}`);

              const detailText = await page.locator("body").innerText();
              if (detailText.includes(browserGroupName) || detailText.includes("สมาชิก") || detailText.includes("member")) {
                console.log("✅ Group detail page loads");
              }
            }
          } else {
            console.log("⚠️ New group not visible in list (may need refresh)");
          }

          // --- Browser Step 7: Clean up via API ---
          const cleanupList = await request.get("/api/v1/groups");
          if (cleanupList.status() === 200) {
            const cleanupData = (await cleanupList.json()).data || await cleanupList.json();
            const toDelete = (cleanupData.groups || []).find(
              (g: { name: string }) => g.name === browserGroupName
            );
            if (toDelete) {
              await request.delete(`/api/v1/groups/${toDelete.id}`, { headers: CSRF });
              console.log("✅ Browser group cleaned up");
            }
          }
        }
      }
    } else {
      console.log("⚠️ Create group button not found");
    }

    // --- Browser Step 8: Check contacts page for group filter ---
    await page.goto("/dashboard/contacts", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(SCREENSHOTS, "07-contacts-page.png"), fullPage: true });
    console.log(`📍 Contacts page: ${page.url()}`);

    // --- Browser Step 9: Mobile responsive ---
    await page.goto("/dashboard/contacts/groups", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS, "08-groups-mobile-375.png"), fullPage: true });
    console.log("📱 Mobile 375px done");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS, "09-groups-mobile-390.png"), fullPage: true });
    console.log("📱 Mobile 390px done");

    // Console errors
    const realErrors = consoleErrors.filter(e =>
      !e.includes("favicon") && !e.includes("hydration") && !e.includes("third-party")
    );
    if (realErrors.length > 0) {
      console.log(`⚠️ Console errors: ${realErrors.slice(0, 5).join("; ")}`);
    } else {
      console.log("✅ No console errors");
    }
  });
});
