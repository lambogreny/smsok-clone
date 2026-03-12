import { test, expect, expectPageLoads } from "./fixtures";

const DASHBOARD_ROUTES = [
  { path: "/dashboard", name: "Dashboard Home" },
  { path: "/dashboard/send", name: "Send SMS" },
  { path: "/dashboard/otp", name: "OTP" },
  { path: "/dashboard/messages", name: "Messages" },
  { path: "/dashboard/contacts", name: "Contacts" },
  { path: "/dashboard/contacts/groups", name: "Contact Groups" },
  { path: "/dashboard/templates", name: "Templates" },
  { path: "/dashboard/campaigns", name: "Campaigns" },
  { path: "/dashboard/senders", name: "Senders" },
  { path: "/dashboard/analytics", name: "Analytics" },
  { path: "/dashboard/settings", name: "Settings" },
  { path: "/dashboard/settings/security", name: "Security" },
  { path: "/dashboard/api-keys", name: "API Keys" },
  { path: "/dashboard/settings/webhooks", name: "Webhooks" },
  { path: "/dashboard/settings/team", name: "Team" },
  { path: "/dashboard/settings/roles", name: "Roles" },
  { path: "/dashboard/credits", name: "Credits" },
  { path: "/dashboard/packages", name: "Packages" },
  { path: "/dashboard/settings/pdpa", name: "PDPA Settings" },
  { path: "/dashboard/billing", name: "Billing" },
  { path: "/dashboard/tags", name: "Tags" },
  // NOTE: /dashboard/knowledge-base returns 404 — route not implemented yet
];

const PUBLIC_ROUTES = [
  { path: "/", name: "Landing" },
  { path: "/login", name: "Login" },
  { path: "/register", name: "Register" },
  { path: "/forgot-password", name: "Forgot Password" },
];

test.describe("Navigation — Dashboard Routes", () => {
  for (const route of DASHBOARD_ROUTES) {
    test(`TC-110: ${route.name} (${route.path}) loads without error`, async ({ authedPage: page }) => {
      await expectPageLoads(page, route.path);
    });
  }
});

test.describe("Navigation — Public Routes", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`TC-110: ${route.name} (${route.path}) loads`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "networkidle" });
      expect(response?.status()).toBe(200);
      const body = await page.textContent("body");
      expect(body).not.toContain("Something went wrong");
      expect(body!.length).toBeGreaterThan(100);
    });
  }
});

test.describe("Navigation — Sidebar & 404", () => {
  // TC-111: Sidebar links
  test("TC-111: sidebar has navigation links", async ({ authedPage: page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const nav = page.locator("nav, aside, [class*='sidebar']").first();
    await expect(nav).toBeVisible();
    const links = nav.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThan(5);

    // Verify links have href attributes
    for (let i = 0; i < Math.min(count, 5); i++) {
      const href = await links.nth(i).getAttribute("href");
      expect(href).toBeTruthy();
    }
  });

  // TC-112: 404 handling
  test("TC-112: nonexistent route returns 404", async ({ authedPage: page }) => {
    const response = await page.goto("/dashboard/nonexistent-page-xyz");
    expect(response?.status()).toBe(404);
  });

  // TC-113: Console errors check
  test("TC-113: dashboard loads without JS page errors", async ({ authedPage: page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    // Page errors (uncaught exceptions) should be zero
    expect(pageErrors).toHaveLength(0);
  });
});
