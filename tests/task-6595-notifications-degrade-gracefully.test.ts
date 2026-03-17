import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  authenticateRequestUser: vi.fn(),
  messageFindMany: vi.fn(),
  userFindUnique: vi.fn(),
  paymentFindMany: vi.fn(),
  getPaymentTableColumns: vi.fn(),
  prunePaymentSelectForAvailableColumns: vi.fn(),
  loggerWarn: vi.fn(),
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

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: mocks.loggerWarn,
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
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

describe("Task #6595: notifications route degrades gracefully", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequestUser.mockResolvedValue({ id: "user_6595" });
    mocks.messageFindMany.mockResolvedValue([
      {
        id: "msg_1",
        recipient: "0812345678",
        status: "sent",
        createdAt: new Date("2026-03-17T10:00:00.000Z"),
        content: "hello",
      },
    ]);
    mocks.userFindUnique.mockResolvedValue({ notificationsReadAt: null });
    mocks.paymentFindMany.mockResolvedValue([]);
    mocks.getPaymentTableColumns.mockResolvedValue(new Set(["id", "amount", "created_at"]));
    mocks.prunePaymentSelectForAvailableColumns.mockImplementation((select: unknown) => select);
  });

  it("returns 200 with message notifications even when payment lookup fails", async () => {
    mocks.paymentFindMany.mockRejectedValueOnce(new Error("payment query failed"));

    const response = await getNotifications(
      new NextRequest("http://localhost/api/notifications"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      unreadCount: 1,
      items: [
        expect.objectContaining({
          id: "msg_msg_1",
          type: "sms_success",
        }),
      ],
    });
    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      "Notifications route failed to load package purchases",
      expect.objectContaining({
        userId: "user_6595",
        error: "payment query failed",
      }),
    );
  });

  it("falls back to a basic payment select when payment column introspection fails", async () => {
    mocks.getPaymentTableColumns.mockRejectedValueOnce(new Error("information_schema unavailable"));

    const response = await getNotifications(
      new NextRequest("http://localhost/api/notifications"),
    );

    expect(response.status).toBe(200);
    expect(mocks.prunePaymentSelectForAvailableColumns).not.toHaveBeenCalled();
    expect(mocks.paymentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          amount: true,
          createdAt: true,
          packageTier: {
            select: {
              name: true,
            },
          },
        },
      }),
    );
    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      "Notifications route falling back to basic payment select",
      expect.objectContaining({
        error: "information_schema unavailable",
      }),
    );
  });
});
