import { test, expect } from "./fixtures";

const BASE = "http://localhost:3000";

test.describe("API CRUD — Facebook Level", () => {

  // === TAGS ===
  test.describe("Tags CRUD", () => {
    test("TC-T01: Create tag", async ({ request }) => {
      const res = await request.post(`${BASE}/api/v1/tags`, {
        data: { name: "E2E-Tag-" + Date.now() },
      });
      expect([200, 201]).toContain(res.status());
      const body = await res.json();
      expect(body.id).toBeTruthy();
    });

    test("TC-T02: List tags", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/tags`);
      expect(res.status()).toBe(200);
    });

    test("TC-T03: Update tag (PATCH)", async ({ request }) => {
      const create = await request.post(`${BASE}/api/v1/tags`, {
        data: { name: "Update-Tag-" + Date.now() },
      });
      const { id } = await create.json();

      const res = await request.patch(`${BASE}/api/v1/tags/${id}`, {
        data: { name: "Updated-" + Date.now() },
      });
      expect(res.status()).toBe(200);
    });

    test("TC-T04: Delete tag", async ({ request }) => {
      const create = await request.post(`${BASE}/api/v1/tags`, {
        data: { name: "Delete-Tag-" + Date.now() },
      });
      const { id } = await create.json();

      const res = await request.delete(`${BASE}/api/v1/tags/${id}`);
      expect(res.status()).toBe(200);
    });

    test("TC-T05: Tags requires auth", async ({ playwright }) => {
      const ctx = await playwright.request.newContext();
      const res = await ctx.get(`${BASE}/api/v1/tags`);
      expect(res.status()).toBe(401);
      await ctx.dispose();
    });
  });

  // === CAMPAIGNS ===
  test.describe("Campaigns CRUD", () => {
    test("TC-CA01: Create campaign", async ({ request }) => {
      const res = await request.post(`${BASE}/api/v1/campaigns`, {
        data: {
          name: "E2E Campaign " + Date.now(),
          message: "Hello {{name}} from E2E test",
          sender_name: "SMSOK",
        },
      });
      expect([200, 201]).toContain(res.status());
      const body = await res.json();
      expect(body.id).toBeTruthy();
    });

    test("TC-CA02: List campaigns", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/campaigns`);
      expect(res.status()).toBe(200);
    });

    test("TC-CA03: Update campaign", async ({ request }) => {
      const create = await request.post(`${BASE}/api/v1/campaigns`, {
        data: { name: "To Update " + Date.now(), message: "Test", sender_name: "SMSOK" },
      });
      const { id } = await create.json();

      const res = await request.put(`${BASE}/api/v1/campaigns/${id}`, {
        data: { name: "Updated Campaign" },
      });
      expect(res.status()).toBe(200);
    });

    test("TC-CA04: Delete campaign", async ({ request }) => {
      const create = await request.post(`${BASE}/api/v1/campaigns`, {
        data: { name: "To Delete " + Date.now(), message: "Test", sender_name: "SMSOK" },
      });
      const { id } = await create.json();

      const res = await request.delete(`${BASE}/api/v1/campaigns/${id}`);
      expect(res.status()).toBe(200);
    });
  });

  // === WEBHOOKS ===
  test.describe("Webhooks CRUD", () => {
    test("TC-W01: Create webhook", async ({ request }) => {
      const res = await request.post(`${BASE}/api/v1/webhooks`, {
        data: { url: "https://example.com/e2e-hook-" + Date.now(), events: ["sms.sent"] },
      });
      expect([200, 201]).toContain(res.status());
      const body = await res.json();
      expect(body.id).toBeTruthy();
      expect(body.secret).toBeTruthy(); // signing secret returned on creation
    });

    test("TC-W02: List webhooks", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/webhooks`);
      expect(res.status()).toBe(200);
    });

    test("TC-W03: Delete webhook", async ({ request }) => {
      const create = await request.post(`${BASE}/api/v1/webhooks`, {
        data: { url: "https://example.com/delete-hook", events: ["sms.sent"] },
      });
      const { id } = await create.json();

      const res = await request.delete(`${BASE}/api/v1/webhooks/${id}`);
      expect([200, 204]).toContain(res.status());
    });

    test("TC-W04: XSS URL rejected", async ({ request }) => {
      const res = await request.post(`${BASE}/api/v1/webhooks`, {
        data: { url: "javascript:alert(1)", events: ["sms.sent"] },
      });
      expect(res.status()).toBe(400);
    });
  });

  // === API KEYS ===
  test.describe("API Keys CRUD", () => {
    test("TC-AK01: Create API key", async ({ request }) => {
      const res = await request.post(`${BASE}/api/v1/api-keys`, {
        data: { name: "E2E Key " + Date.now() },
      });
      expect([200, 201]).toContain(res.status());
      const body = await res.json();
      expect(body.id).toBeTruthy();
      expect(body.key).toMatch(/^sk_live_/); // key shown once
    });

    test("TC-AK02: List API keys (key truncated)", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/api-keys`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      // Keys should be truncated in list view
      if (body.keys?.length > 0 || body.length > 0) {
        const keys = body.keys || body;
        const first = keys[0];
        // Full key should NOT be in list response
        expect(first.key?.length || 0).toBeLessThan(50);
      }
    });

    test("TC-AK03: Update API key name", async ({ request }) => {
      const create = await request.post(`${BASE}/api/v1/api-keys`, {
        data: { name: "To Rename" },
      });
      const { id } = await create.json();

      const res = await request.put(`${BASE}/api/v1/api-keys/${id}`, {
        data: { name: "Renamed Key" },
      });
      expect(res.status()).toBe(200);
    });

    test("TC-AK04: Delete API key", async ({ request }) => {
      const create = await request.post(`${BASE}/api/v1/api-keys`, {
        data: { name: "To Delete" },
      });
      const { id } = await create.json();

      const res = await request.delete(`${BASE}/api/v1/api-keys/${id}`);
      expect(res.status()).toBe(200);
    });
  });

  // === SETTINGS ===
  test.describe("Settings", () => {
    test("TC-ST01: Get tax profile", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/settings/tax-profile`);
      expect(res.status()).toBe(200);
    });

    test("TC-ST02: Get activity log", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/settings/activity`);
      expect(res.status()).toBe(200);
    });

    test("TC-ST03: Get 2FA status", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/settings/2fa`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("enabled");
    });
  });

  // === CREDITS & BILLING ===
  test.describe("Credits & Billing", () => {
    test("TC-CB01: Get credit balance", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/credits/balance`);
      expect(res.status()).toBe(200);
    });

    test("TC-CB02: Get credit history", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/credits`);
      expect(res.status()).toBe(200);
    });

    test("TC-CB03: List invoices", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/invoices`);
      expect(res.status()).toBe(200);
    });

    test("TC-CB04: List quotations", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/quotations`);
      expect(res.status()).toBe(200);
    });

    test("TC-CB05: Payment history", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/payments/history`);
      expect(res.status()).toBe(200);
    });

    test("TC-CB06: Bank accounts", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/payment/bank-accounts`);
      expect(res.status()).toBe(200);
    });
  });

  // === SMS ===
  test.describe("SMS", () => {
    test("TC-SM01: Send SMS — insufficient credits", async ({ request }) => {
      const res = await request.post(`${BASE}/api/v1/sms/send`, {
        data: { to: "0899999999", message: "E2E test", sender: "SMSOK" },
      });
      // 402 insufficient credits or 400 validation
      expect([400, 402]).toContain(res.status());
    });

    test("TC-SM02: Send SMS — empty message rejected", async ({ request }) => {
      const res = await request.post(`${BASE}/api/v1/sms/send`, {
        data: { to: "0899999999", message: "", sender: "SMSOK" },
      });
      expect(res.status()).toBe(400);
    });

    test("TC-SM03: Send SMS — invalid phone rejected", async ({ request }) => {
      const res = await request.post(`${BASE}/api/v1/sms/send`, {
        data: { to: "abc", message: "test", sender: "SMSOK" },
      });
      expect(res.status()).toBe(400);
    });

    test("TC-SM04: Template validate", async ({ request }) => {
      const res = await request.post(`${BASE}/api/v1/templates/validate`, {
        data: { content: "สวัสดี {{name}}" },
      });
      expect(res.status()).toBeLessThan(500);
    });

    test("TC-SM05: Sender names list", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/senders/name`);
      expect(res.status()).toBe(200);
    });
  });

  // === ONBOARDING ===
  test.describe("Onboarding", () => {
    test("TC-OB01: Onboarding status", async ({ request }) => {
      const res = await request.get(`${BASE}/api/v1/onboarding/status`);
      expect(res.status()).toBe(200);
    });
  });
});
