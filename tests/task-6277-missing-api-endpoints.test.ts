import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const healthRoute = readFileSync(resolve(ROOT, "app/api/health/route.ts"), "utf8");
const packagesRoute = readFileSync(resolve(ROOT, "app/api/v1/packages/route.ts"), "utf8");
const purchaseConfirmRoute = readFileSync(resolve(ROOT, "app/api/v1/payments/purchase/route.ts"), "utf8");
const verifySlipRoute = readFileSync(resolve(ROOT, "app/api/v1/payments/topup/verify-slip/route.ts"), "utf8");
const dashboardSummaryRoute = readFileSync(resolve(ROOT, "app/api/v1/dashboard/summary/route.ts"), "utf8");
const userApiKeysRoute = readFileSync(resolve(ROOT, "app/api/user/api-keys/route.ts"), "utf8");
const userApiKeyDetailRoute = readFileSync(resolve(ROOT, "app/api/user/api-keys/[id]/route.ts"), "utf8");
const userSendersRoute = readFileSync(resolve(ROOT, "app/api/user/senders/route.ts"), "utf8");
const userSenderDetailRoute = readFileSync(resolve(ROOT, "app/api/user/senders/[id]/route.ts"), "utf8");
const userSettingsRoute = readFileSync(resolve(ROOT, "app/api/user/settings/route.ts"), "utf8");
const userDashboardSummaryRoute = readFileSync(resolve(ROOT, "app/api/user/dashboard/summary/route.ts"), "utf8");

describe("Task #6277: missing API endpoints audit", () => {
  it("keeps health and topup/package endpoints wired for dashboard and billing flows", () => {
    expect(healthRoute).toContain("await prisma.$queryRaw`SELECT 1`");
    expect(packagesRoute).toContain("export async function GET()");
    expect(purchaseConfirmRoute).toContain("db.payment.findFirst");
    expect(verifySlipRoute).toContain("multipart/form-data");
  });

  it("adds session aliases for api keys, senders, and settings", () => {
    expect(userApiKeysRoute).toContain('export { GET, POST } from "@/app/api/v1/api-keys/route"');
    expect(userApiKeyDetailRoute).toContain('export { PATCH, PUT, DELETE } from "@/app/api/v1/api-keys/[id]/route"');
    expect(userSendersRoute).toContain('export { GET, POST } from "@/app/api/v1/senders/route"');
    expect(userSenderDetailRoute).toContain('export { GET } from "@/app/api/v1/senders/name/[id]/route"');
    expect(userSenderDetailRoute).toContain('export { DELETE } from "@/app/api/v1/senders/[id]/route"');
    expect(userSettingsRoute).toContain('export { GET, PUT } from "@/app/api/v1/settings/profile/route"');
  });

  it("adds a dashboard summary API with sent, credits, and contacts totals", () => {
    expect(dashboardSummaryRoute).toContain("getDashboardStats(session.id)");
    expect(dashboardSummaryRoute).toContain("getRemainingQuota(session.id)");
    expect(dashboardSummaryRoute).toContain("db.contact.count");
    expect(dashboardSummaryRoute).toContain("sentToday");
    expect(dashboardSummaryRoute).toContain("creditsRemaining");
    expect(dashboardSummaryRoute).toContain("contactsTotal");
    expect(userDashboardSummaryRoute).toContain('export { GET } from "@/app/api/v1/dashboard/summary/route"');
  });
});
