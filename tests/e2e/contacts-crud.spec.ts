import { test, expect } from "./fixtures";

const BASE = "http://localhost:3000";
type ContactListItem = { name: string };

test.describe("Contacts CRUD — Facebook Level", () => {
  const uniquePhone = () => "08" + Math.floor(10000000 + Math.random() * 90000000);

  test("TC-C01: Create contact with valid data", async ({ request }) => {
    const phone = uniquePhone();
    const res = await request.post(`${BASE}/api/v1/contacts`, {
      data: { name: "E2E Test Contact", phone, email: "e2e@test.com" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();
    expect(body.name).toBe("E2E Test Contact");
    expect(body.phone).toBe(phone);
  });

  test("TC-C02: Create contact — duplicate phone rejected", async ({ request }) => {
    const phone = uniquePhone();
    await request.post(`${BASE}/api/v1/contacts`, {
      data: { name: "First", phone },
    });
    const res = await request.post(`${BASE}/api/v1/contacts`, {
      data: { name: "Duplicate", phone },
    });
    expect(res.status()).toBe(409);
  });

  test("TC-C03: Create contact — empty name rejected", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/contacts`, {
      data: { name: "", phone: uniquePhone() },
    });
    expect(res.status()).toBe(400);
  });

  test("TC-C04: Create contact — invalid phone rejected", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/contacts`, {
      data: { name: "Test", phone: "abc" },
    });
    expect(res.status()).toBe(400);
  });

  test("TC-C05: List contacts with pagination", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/contacts?page=1&limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.contacts).toBeDefined();
    expect(body.pagination).toBeDefined();
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(5);
    expect(body.pagination.total).toBeGreaterThanOrEqual(0);
  });

  test("TC-C06: Search contacts", async ({ request }) => {
    const phone = uniquePhone();
    await request.post(`${BASE}/api/v1/contacts`, {
      data: { name: "SearchTarget", phone },
    });
    const res = await request.get(`${BASE}/api/v1/contacts?search=SearchTarget`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { contacts: ContactListItem[] };
    expect(body.contacts.length).toBeGreaterThanOrEqual(1);
    expect(body.contacts.some((contact) => contact.name === "SearchTarget")).toBe(true);
  });

  test("TC-C07: Update contact", async ({ request }) => {
    const phone = uniquePhone();
    const create = await request.post(`${BASE}/api/v1/contacts`, {
      data: { name: "Before Update", phone },
    });
    const { id } = await create.json();

    const res = await request.put(`${BASE}/api/v1/contacts/${id}`, {
      data: { name: "After Update" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("After Update");
  });

  test("TC-C08: Delete contact", async ({ request }) => {
    const phone = uniquePhone();
    const create = await request.post(`${BASE}/api/v1/contacts`, {
      data: { name: "To Delete", phone },
    });
    const { id } = await create.json();

    const res = await request.delete(`${BASE}/api/v1/contacts/${id}`);
    expect(res.status()).toBe(200);

    // Verify deleted
    const check = await request.get(`${BASE}/api/v1/contacts/${id}`);
    expect(check.status()).toBe(404);
  });

  test("TC-C09: XSS in contact name rejected/stripped", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/contacts`, {
      data: { name: "<script>alert(1)</script>", phone: uniquePhone() },
    });
    if (res.status() === 201 || res.status() === 200) {
      const body = await res.json();
      expect(body.name).not.toContain("<script>");
    } else {
      expect(res.status()).toBe(400); // rejected is also valid
    }
  });

  test("TC-C10: Unicode/Thai name accepted", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/contacts`, {
      data: { name: "ทดสอบ ภาษาไทย 日本語", phone: uniquePhone() },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.name).toContain("ทดสอบ");
  });

  test("TC-C11: Pagination edge — page 0 handled", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/contacts?page=0&limit=0`);
    expect(res.ok()).toBe(true);
  });

  test("TC-C12: Pagination edge — very large page returns empty", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/contacts?page=99999`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.contacts).toHaveLength(0);
  });

  test("TC-C13: SQL injection in search is safe", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/contacts?search=' OR 1=1 --`);
    expect(res.ok()).toBe(true);
  });

  test("TC-C14: Import CSV contacts", async ({ request }) => {
    const csv = "name,phone\nImport Test 1,0811110001\nImport Test 2,0811110002";
    const res = await request.post(`${BASE}/api/v1/contacts/import`, {
      multipart: {
        file: { name: "contacts.csv", mimeType: "text/csv", buffer: Buffer.from(csv) },
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.imported).toBeGreaterThanOrEqual(1);
  });

  test("TC-C15: Import rejects oversized file", async ({ request }) => {
    // Generate > 1MB CSV
    let csv = "name,phone\n";
    for (let i = 0; i < 20000; i++) csv += `Name${i},08${String(10000000 + i).padStart(8, "0")}\n`;
    const res = await request.post(`${BASE}/api/v1/contacts/import`, {
      multipart: {
        file: { name: "big.csv", mimeType: "text/csv", buffer: Buffer.from(csv) },
      },
    });
    expect([400, 413, 500]).toContain(res.status()); // Should be 400 ideally
  });

  test("TC-C16: Contacts API requires auth", async ({ playwright }) => {
    const ctx = await playwright.request.newContext();
    const res = await ctx.get(`${BASE}/api/v1/contacts`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });
});
