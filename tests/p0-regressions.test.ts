import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const apiKeyActions = readFileSync(
  resolve(ROOT, "lib/actions/api-keys.ts"),
  "utf-8",
);
const apiKeysRoute = readFileSync(
  resolve(ROOT, "app/api/v1/api-keys/route.ts"),
  "utf-8",
);
const apiKeyRoute = readFileSync(
  resolve(ROOT, "app/api/v1/api-keys/[id]/route.ts"),
  "utf-8",
);
const disable2FaDevRoute = readFileSync(
  resolve(ROOT, "app/api/dev/disable-2fa/route.ts"),
  "utf-8",
);
const campaignActions = readFileSync(
  resolve(ROOT, "lib/actions/campaigns.ts"),
  "utf-8",
);
const activityActions = readFileSync(
  resolve(ROOT, "lib/actions/activity.ts"),
  "utf-8",
);
const contactActions = readFileSync(
  resolve(ROOT, "lib/actions/contacts.ts"),
  "utf-8",
);
const groupActions = readFileSync(
  resolve(ROOT, "lib/actions/groups.ts"),
  "utf-8",
);
const twoFactorSection = readFileSync(
  resolve(ROOT, "app/(dashboard)/dashboard/settings/TwoFactorSection.tsx"),
  "utf-8",
);
const orderInvoiceRoute = readFileSync(
  resolve(ROOT, "app/api/v1/orders/[id]/invoice/route.ts"),
  "utf-8",
);
const orderQuotationRoute = readFileSync(
  resolve(ROOT, "app/api/v1/orders/[id]/quotation/route.ts"),
  "utf-8",
);

describe("P0: API key ownership hardening", () => {
  it("server actions require the current session instead of caller-supplied userId", () => {
    expect(apiKeyActions).toContain("createApiKey(data: unknown)");
    expect(apiKeyActions).toContain("listApiKeysForUser(await requireSessionUserId())");
    expect(apiKeyActions).not.toContain("typeof userIdOrData === \"string\"");
  });

  it("API key management routes authenticate through session-aware auth", () => {
    expect(apiKeysRoute).toContain("authenticateRequest");
    expect(apiKeysRoute).toContain("listApiKeysForUser(user.id)");
    expect(apiKeyRoute).toContain("authenticateRequest");
    expect(apiKeyRoute).toContain("toggleApiKeyForUser(user.id, id)");
  });
});

describe("P0: 2FA settings recovery flows", () => {
  it("dashboard uses the dedicated regenerate backup codes endpoint", () => {
    expect(twoFactorSection).toContain("/api/v1/settings/2fa/regenerate-codes");
    expect(twoFactorSection).toContain("setRegenCodes(json.recoveryCodes ?? [])");
  });

  it("dev disable-2fa endpoint requires a dev secret and accepts challenge tokens", () => {
    expect(disable2FaDevRoute).toContain("x-dev-secret");
    expect(disable2FaDevRoute).toContain("2fa-challenge");
    expect(disable2FaDevRoute).toContain("reset2FARateLimit(user.id)");
    expect(disable2FaDevRoute).toContain("resolveUserIdFromChallengeToken");
    expect(disable2FaDevRoute).not.toContain("userId: z.string()");
  });
});

describe("P0: client-facing server actions ignore caller-supplied userId", () => {
  it("campaign actions rebind userId through resolveActionUserId", () => {
    expect(campaignActions).toContain('import { resolveActionUserId } from "../action-user";');
    expect(campaignActions.match(/resolveActionUserId\(/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });

  it("contact actions rebind userId through resolveActionUserId", () => {
    expect(contactActions).toContain('import { resolveActionUserId } from "../action-user";');
    expect(contactActions.match(/resolveActionUserId\(/g)?.length ?? 0).toBeGreaterThanOrEqual(10);
  });

  it("activity actions rebind userId through resolveActionUserId", () => {
    expect(activityActions).toContain('import { resolveActionUserId } from "../action-user";');
    expect(activityActions).toContain("const userId = await resolveActionUserId(");
  });

  it("group actions rebind userId through resolveActionUserId", () => {
    expect(groupActions).toContain('import { resolveActionUserId } from "../action-user";');
    expect(groupActions.match(/resolveActionUserId\(/g)?.length ?? 0).toBeGreaterThanOrEqual(8);
  });
});

describe("P0: order billing document routes", () => {
  it("invoice route renders PDF from the order snapshot", () => {
    expect(orderInvoiceRoute).toContain("renderOrderInvoicePdf");
    expect(orderInvoiceRoute).toContain("\"Content-Type\": \"application/pdf\"");
  });

  it("quotation route renders PDF from the order snapshot", () => {
    expect(orderQuotationRoute).toContain("renderOrderQuotationPdf");
    expect(orderQuotationRoute).toContain("\"Content-Type\": \"application/pdf\"");
  });
});
