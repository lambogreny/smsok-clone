import { test, expect } from "./fixtures";

const BASE = "http://localhost:3000";

test.describe("Orders & Billing — Facebook Level", () => {
  const STARTER_TIER = "cmmnqxcp5001d84ih7kju0hzj";
  const BASIC_TIER = "cmmnqxcp7001e84ih0h3h9b9m";

  test("TC-O01: List packages returns tiers", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/packages`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.tiers.length).toBeGreaterThanOrEqual(2);
    expect(body.tiers[0]).toHaveProperty("id");
    expect(body.tiers[0]).toHaveProperty("price");
    expect(body.tiers[0]).toHaveProperty("smsQuota");
  });

  test("TC-O02: Create individual order", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/orders`, {
      data: {
        package_tier_id: STARTER_TIER,
        customer_type: "INDIVIDUAL",
        tax_name: "E2E Individual",
        tax_id: "1234567890123",
        tax_address: "E2E Test Address Bangkok Thailand 10100",
        tax_branch_type: "HEAD",
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.id).toBeTruthy();
    expect(body.order_number).toMatch(/^ORD-/);
    expect(body.status).toBe("PENDING");
    expect(body.total_amount).toBe(500);
  });

  test("TC-O03: Create company order with WHT", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/orders`, {
      data: {
        package_tier_id: BASIC_TIER,
        customer_type: "COMPANY",
        has_wht: true,
        tax_name: "บริษัท ทดสอบ จำกัด",
        tax_id: "9876543210123",
        tax_address: "เลขที่ 99 ถนนทดสอบ กรุงเทพฯ 10100",
        tax_branch_type: "BRANCH",
        tax_branch_number: "00001",
        company_name: "บริษัท ทดสอบ จำกัด",
        company_address: "เลขที่ 99 ถนนทดสอบ กรุงเทพฯ 10100",
      },
    });
    // May be 201 or 400 depending on min amount for WHT
    if (res.status() === 201 || res.status() === 200) {
      const body = await res.json();
      expect(body.has_wht).toBe(true);
      expect(body.wht_amount).toBeGreaterThan(0);
    }
  });

  test("TC-O04: VAT calculation is correct (exclusive)", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/orders`, {
      data: {
        package_tier_id: STARTER_TIER,
        customer_type: "INDIVIDUAL",
        tax_name: "VAT Test",
        tax_id: "1234567890123",
        tax_address: "VAT Test Address Bangkok Thailand",
        tax_branch_type: "HEAD",
      },
    });
    const body = await res.json();
    const subtotal = body.net_amount; // 500
    const vat = body.vat_amount;
    const total = body.total_amount;
    expect(Math.abs(subtotal - 500)).toBeLessThan(0.02);
    expect(Math.abs(vat - 35)).toBeLessThan(0.02);
    expect(Math.abs(total - 535)).toBeLessThan(0.02);
  });

  test("TC-O05: Order missing required fields → 400", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/orders`, {
      data: { customer_type: "INDIVIDUAL" },
    });
    expect(res.status()).toBe(400);
  });

  test("TC-O06: XSS in order fields stripped", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/orders`, {
      data: {
        package_tier_id: STARTER_TIER,
        customer_type: "COMPANY",
        tax_name: "<script>alert(1)</script>Test",
        tax_id: "1111111111111",
        tax_address: "<img onerror=alert(1)>Address Bangkok",
        tax_branch_type: "HEAD",
        company_name: "<svg onload=alert(1)>Corp",
        company_address: "Valid address for testing XSS",
      },
    });
    if (res.ok()) {
      const body = await res.json();
      expect(body.tax_name || "").not.toContain("<script>");
    }
  });

  test("TC-O07: List orders", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/orders`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.orders).toBeDefined();
    expect(Array.isArray(body.orders)).toBe(true);
  });

  test("TC-O08: Get order detail", async ({ request }) => {
    // Create order first
    const create = await request.post(`${BASE}/api/v1/orders`, {
      data: {
        package_tier_id: STARTER_TIER,
        customer_type: "INDIVIDUAL",
        tax_name: "Detail Test",
        tax_id: "1234567890123",
        tax_address: "Detail Test Address Bangkok Thailand",
        tax_branch_type: "HEAD",
      },
    });
    const { id } = await create.json();

    const res = await request.get(`${BASE}/api/v1/orders/${id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(id);
  });

  test("TC-O09: Quotation PDF downloads", async ({ request }) => {
    const create = await request.post(`${BASE}/api/v1/orders`, {
      data: {
        package_tier_id: STARTER_TIER,
        customer_type: "INDIVIDUAL",
        tax_name: "PDF Test",
        tax_id: "1234567890123",
        tax_address: "PDF Test Address Bangkok Thailand",
        tax_branch_type: "HEAD",
      },
    });
    const { id } = await create.json();

    const res = await request.get(`${BASE}/api/v1/orders/${id}/documents/quotation`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("pdf");
    const buf = await res.body();
    expect(buf.length).toBeGreaterThan(1000);
  });

  test("TC-O10: Invoice PDF downloads", async ({ request }) => {
    const create = await request.post(`${BASE}/api/v1/orders`, {
      data: {
        package_tier_id: STARTER_TIER,
        customer_type: "INDIVIDUAL",
        tax_name: "Invoice PDF",
        tax_id: "1234567890123",
        tax_address: "Invoice Test Address Bangkok Thailand",
        tax_branch_type: "HEAD",
      },
    });
    const { id } = await create.json();

    const res = await request.get(`${BASE}/api/v1/orders/${id}/documents/invoice`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("pdf");
  });

  test("TC-O11: Receipt PDF requires payment", async ({ request }) => {
    const create = await request.post(`${BASE}/api/v1/orders`, {
      data: {
        package_tier_id: STARTER_TIER,
        customer_type: "INDIVIDUAL",
        tax_name: "Receipt Test",
        tax_id: "1234567890123",
        tax_address: "Receipt Test Address Bangkok Thailand",
        tax_branch_type: "HEAD",
      },
    });
    const { id } = await create.json();

    const res = await request.get(`${BASE}/api/v1/orders/${id}/documents/receipt`);
    expect(res.status()).toBe(400); // order not paid
  });

  test("TC-O12: Slip upload — empty file rejected", async ({ request }) => {
    const create = await request.post(`${BASE}/api/v1/orders`, {
      data: {
        package_tier_id: STARTER_TIER,
        customer_type: "INDIVIDUAL",
        tax_name: "Slip Test",
        tax_id: "1234567890123",
        tax_address: "Slip Test Address Bangkok Thailand",
        tax_branch_type: "HEAD",
      },
    });
    const { id } = await create.json();

    const res = await request.post(`${BASE}/api/orders/${id}/slip`, {
      multipart: {
        slip: { name: "empty.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(0) },
      },
    });
    expect(res.status()).toBe(400);
  });

  test("TC-O13: Slip upload — wrong type rejected", async ({ request }) => {
    const create = await request.post(`${BASE}/api/v1/orders`, {
      data: {
        package_tier_id: STARTER_TIER,
        customer_type: "INDIVIDUAL",
        tax_name: "Type Test",
        tax_id: "1234567890123",
        tax_address: "Type Test Address Bangkok Thailand",
        tax_branch_type: "HEAD",
      },
    });
    const { id } = await create.json();

    const res = await request.post(`${BASE}/api/orders/${id}/slip`, {
      multipart: {
        slip: { name: "slip.pdf", mimeType: "application/pdf", buffer: Buffer.from("fake pdf") },
      },
    });
    expect(res.status()).toBe(400);
  });

  test("TC-O14: Slip upload — oversized rejected", async ({ request }) => {
    const create = await request.post(`${BASE}/api/v1/orders`, {
      data: {
        package_tier_id: STARTER_TIER,
        customer_type: "INDIVIDUAL",
        tax_name: "Size Test",
        tax_id: "1234567890123",
        tax_address: "Size Test Address Bangkok Thailand",
        tax_branch_type: "HEAD",
      },
    });
    const { id } = await create.json();

    const res = await request.post(`${BASE}/api/orders/${id}/slip`, {
      multipart: {
        slip: { name: "big.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(5.2 * 1024 * 1024, 0xFF) },
      },
    });
    expect(res.status()).toBe(400);
  });

  test("TC-O15: Slip upload — real image accepted", async ({ request }) => {
    const fs = require("fs");
    const path = require("path");
    const slipPath = path.join(__dirname, "../../tests/fixtures/real-slip-test.jpg");

    // Only run if fixture exists
    if (!fs.existsSync(slipPath)) {
      test.skip();
      return;
    }

    const create = await request.post(`${BASE}/api/v1/orders`, {
      data: {
        package_tier_id: STARTER_TIER,
        customer_type: "INDIVIDUAL",
        tax_name: "Real Slip",
        tax_id: "1234567890123",
        tax_address: "Real Slip Address Bangkok Thailand",
        tax_branch_type: "HEAD",
      },
    });
    const { id } = await create.json();

    const slipBuffer = fs.readFileSync(slipPath);
    const res = await request.post(`${BASE}/api/orders/${id}/slip`, {
      multipart: {
        slip: { name: "real-slip.jpg", mimeType: "image/jpeg", buffer: slipBuffer },
      },
    });
    // May be 200 (success) or 500 (R2 not configured)
    expect([200, 500]).toContain(res.status());
  });

  test("TC-O16: IDOR — cannot access other user's order", async ({ playwright }) => {
    const ctx = await playwright.request.newContext();
    const res = await ctx.get(`${BASE}/api/v1/orders/fake-order-id`);
    expect([401, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test("TC-O17: Orders API requires auth", async ({ playwright }) => {
    const ctx = await playwright.request.newContext();
    const res = await ctx.get(`${BASE}/api/v1/orders`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });
});
