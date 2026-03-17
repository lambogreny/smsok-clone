import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const mocks = vi.hoisted(() => ({
  authenticateRequestUser: vi.fn(),
  messageFindMany: vi.fn(),
  userFindUnique: vi.fn(),
  paymentFindMany: vi.fn(),
  getPaymentTableColumns: vi.fn(),
  prunePaymentSelectForAvailableColumns: vi.fn(),
}));

vi.mock("@/lib/request-auth", () => ({
  authenticateRequestUser: mocks.authenticateRequestUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    message: {
      findMany: mocks.messageFindMany,
    },
    user: {
      findUnique: mocks.userFindUnique,
    },
    payment: {
      findMany: mocks.paymentFindMany,
    },
  },
}));

vi.mock("@/lib/payments/db-compat", () => ({
  getPaymentTableColumns: mocks.getPaymentTableColumns,
  prunePaymentSelectForAvailableColumns: mocks.prunePaymentSelectForAvailableColumns,
}));

vi.mock("@/lib/api-auth", () => ({
  apiResponse: (data: unknown, status = 200) => Response.json(data, { status }),
  apiError: (error: unknown) =>
    Response.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      {
        status:
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          typeof error.status === "number"
            ? error.status
            : 500,
      },
    ),
}));

import { GET as getNotifications } from "@/app/api/notifications/route";

describe("Task #6450/#6458: notifications compat + API audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequestUser.mockResolvedValue({ id: "user_6450" });
    mocks.messageFindMany.mockResolvedValue([]);
    mocks.userFindUnique.mockResolvedValue({ notificationsReadAt: null });
    mocks.paymentFindMany.mockResolvedValue([
      {
        id: "payment_1",
        amount: 12345,
        createdAt: new Date("2026-03-17T00:00:00.000Z"),
        packageTier: { name: "Starter" },
      },
    ]);
    mocks.getPaymentTableColumns.mockResolvedValue(new Set(["id", "amount", "created_at"]));
    mocks.prunePaymentSelectForAvailableColumns.mockImplementation((select: unknown) => select);
  });

  it("keeps /api/notifications healthy when payments.total_amount is missing", async () => {
    const response = await getNotifications(
      new NextRequest("http://localhost/api/notifications"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.unreadCount).toBe(1);
    expect(body.items).toEqual([
      expect.objectContaining({
        id: "payment_payment_1",
        type: "package_purchase",
      }),
    ]);
    expect(body.items[0].message).toContain("Starter");
    expect(body.items[0].message).toContain("123.45");
    expect(mocks.prunePaymentSelectForAvailableColumns).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: true,
        totalAmount: true,
      }),
      expect.any(Set),
    );
  });

  it("keeps notifications route wired to payment column compatibility", () => {
    const notificationsSource = readFileSync(
      resolve(ROOT, "app/api/notifications/route.ts"),
      "utf8",
    );

    expect(notificationsSource).toContain('from "@/lib/payments/db-compat"');
    expect(notificationsSource).toContain("prunePaymentSelectForAvailableColumns");
    expect(notificationsSource).toContain("purchase.totalAmount ?? purchase.amount");
  });

  it("restores the missing /api/v1/activity and /api/v1/sms/history aliases", () => {
    const activityAliasSource = readFileSync(
      resolve(ROOT, "app/api/v1/activity/route.ts"),
      "utf8",
    );
    const smsHistoryAliasSource = readFileSync(
      resolve(ROOT, "app/api/v1/sms/history/route.ts"),
      "utf8",
    );

    expect(activityAliasSource.trim()).toBe('export { GET } from "@/app/api/v1/settings/activity/route";');
    expect(smsHistoryAliasSource.trim()).toBe('export { GET } from "@/app/api/v1/messages/route";');
  });

  it("removes raw stack and dev-only error detail leaks from audited API routes", () => {
    const consentStatusSource = readFileSync(
      resolve(ROOT, "app/api/v1/consent/status/route.ts"),
      "utf8",
    );
    const cronCampaignsSource = readFileSync(
      resolve(ROOT, "app/api/cron/campaigns/route.ts"),
      "utf8",
    );

    expect(consentStatusSource).not.toContain("error.stack");
    expect(cronCampaignsSource).not.toContain("error instanceof Error ? error.message");
    expect(cronCampaignsSource).toContain('error: "Campaign execution failed"');
  });
});
