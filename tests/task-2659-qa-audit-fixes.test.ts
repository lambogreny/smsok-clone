import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const paymentVerifyRoute = readFileSync(
  resolve(ROOT, "app/api/payments/[id]/verify/route.ts"),
  "utf-8",
);
const campaignAnalyticsRoute = readFileSync(
  resolve(ROOT, "app/api/v1/campaigns/[id]/analytics/route.ts"),
  "utf-8",
);
const campaignScheduleRoute = readFileSync(
  resolve(ROOT, "app/api/v1/campaigns/schedule/route.ts"),
  "utf-8",
);
const campaignScheduleDetailRoute = readFileSync(
  resolve(ROOT, "app/api/v1/campaigns/schedule/[id]/route.ts"),
  "utf-8",
);
const logsExportRoute = readFileSync(
  resolve(ROOT, "app/api/v1/logs/export/route.ts"),
  "utf-8",
);
const contactsActions = readFileSync(
  resolve(ROOT, "lib/actions/contacts.ts"),
  "utf-8",
);
const groupsActions = readFileSync(
  resolve(ROOT, "lib/actions/groups.ts"),
  "utf-8",
);
const groupsMembersRoute = readFileSync(
  resolve(ROOT, "app/api/v1/groups/[id]/members/route.ts"),
  "utf-8",
);
const groupsBulkRemoveRoute = readFileSync(
  resolve(ROOT, "app/api/v1/groups/[id]/members/bulk-remove/route.ts"),
  "utf-8",
);
const groupsAvailableContactsRoute = readFileSync(
  resolve(ROOT, "app/api/v1/groups/[id]/available-contacts/route.ts"),
  "utf-8",
);
const groupsImportRoute = readFileSync(
  resolve(ROOT, "app/api/v1/groups/[id]/import/route.ts"),
  "utf-8",
);
const schedulingActions = readFileSync(
  resolve(ROOT, "lib/actions/scheduling.ts"),
  "utf-8",
);
const ordersApi = readFileSync(
  resolve(ROOT, "lib/orders/api.ts"),
  "utf-8",
);

describe("Task #2659: QA audit bug fixes", () => {
  it("verifies payment slips through signed stored-file URLs", () => {
    expect(paymentVerifyRoute).toContain("resolveStoredFileVerificationUrl(payment.slipUrl)");
    expect(paymentVerifyRoute).toContain("await verifySlipByUrl(verificationSource)");
    expect(paymentVerifyRoute).not.toContain("verifySlipByBase64");
  });

  it("uses authenticateRequest for campaign analytics and schedule endpoints", () => {
    expect(campaignAnalyticsRoute).toContain("authenticateRequest(req)");
    expect(campaignAnalyticsRoute).not.toContain("authenticatePublicApiKey");
    expect(campaignScheduleRoute).toContain("authenticateRequest(req)");
    expect(campaignScheduleDetailRoute).toContain("authenticateRequest(req)");
    expect(campaignScheduleRoute).not.toContain("getSession()");
    expect(campaignScheduleDetailRoute).not.toContain("getSession()");
  });

  it("validates campaign schedule payloads and logs export route requires auth", () => {
    expect(schedulingActions).toContain("export const scheduleCampaignInputSchema");
    expect(schedulingActions).toContain("export const rescheduleCampaignInputSchema");
    expect(campaignScheduleRoute).toContain("scheduleCampaignInputSchema.safeParse(body)");
    expect(campaignScheduleDetailRoute).toContain("rescheduleCampaignInputSchema.safeParse(body)");
    expect(logsExportRoute).toContain("authenticateRequest");
  });

  it("returns ApiError for group/contact not-found paths instead of plain Error", () => {
    expect(contactsActions).not.toContain('throw new Error("ไม่พบรายชื่อ")');
    expect(contactsActions).not.toContain('throw new Error("ไม่พบกลุ่ม")');
    expect(groupsActions).not.toContain('throw new Error("ไม่พบรายชื่อ")');
    expect(groupsActions).not.toContain('throw new Error("ไม่พบกลุ่ม")');
    expect(groupsMembersRoute).toContain('throw new ApiError(404, "ไม่พบกลุ่ม")');
    expect(groupsBulkRemoveRoute).toContain('throw new ApiError(404, "ไม่พบกลุ่ม")');
    expect(groupsAvailableContactsRoute).toContain('throw new ApiError(404, "ไม่พบกลุ่ม")');
    expect(groupsImportRoute).toContain('throw new ApiError(404, "ไม่พบกลุ่ม")');
  });

  it("uses tier expiryMonths when activating order purchases", () => {
    expect(ordersApi).toContain("packageTier.findUnique");
    expect(ordersApi).toContain("expiryMonths");
    expect(ordersApi).not.toContain("365 * 24 * 60 * 60 * 1000");
  });
});
