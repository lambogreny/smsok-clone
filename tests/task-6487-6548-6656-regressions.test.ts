import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextRequest } from "next/server";

const ROOT = process.cwd();

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  senderNameFindUnique: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => {
  class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
      public code?: string,
    ) {
      super(message);
    }
  }

  return {
    ApiError,
    authenticateRequest: mocks.authenticateRequest,
    apiResponse: (data: unknown, status = 200) => Response.json(data, { status }),
    apiError: (error: unknown) => {
      if (typeof error === "object" && error !== null && "status" in error) {
        return Response.json(
          {
            error: error instanceof Error ? error.message : "error",
            code:
              "code" in error && typeof error.code === "string"
                ? error.code
                : "BAD_REQUEST",
          },
          { status: typeof error.status === "number" ? error.status : 500 },
        );
      }

      return Response.json(
        { error: error instanceof Error ? error.message : "Internal Server Error" },
        { status: 500 },
      );
    },
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    senderName: {
      findUnique: mocks.senderNameFindUnique,
    },
  },
}));

import { middleware } from "@/middleware";
import { GET as getSenderNameDetail } from "@/app/api/v1/senders/name/[id]/route";

describe("Task #6487/#6548/#6656 regressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ id: "user_6656" });
  });

  it("lets /api/v1/admin/* requests with admin_session cookie reach route auth instead of user-session middleware", async () => {
    const response = await middleware(
      new NextRequest("http://localhost/api/v1/admin/payments/verify", {
        method: "POST",
        headers: {
          cookie: "admin_session=test-admin-session",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("verifies payment actions against AdminUser records and keeps admin API middleware exemptions in source", () => {
    const paymentsSource = readFileSync(resolve(ROOT, "lib/actions/payments.ts"), "utf8");
    const middlewareSource = readFileSync(resolve(ROOT, "middleware.ts"), "utf8");

    expect(paymentsSource).toContain("db.adminUser.findUnique");
    expect(paymentsSource).toContain("ADMIN_FORBIDDEN");
    expect(paymentsSource).not.toContain('role: "admin"');

    expect(middlewareSource).toContain('if (pathname.startsWith("/api/v1/admin/")) return false;');
    expect(middlewareSource).toContain('const adminSessionToken = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;');
    expect(middlewareSource).toContain("const hasSessionCookies = Boolean(accessToken || refreshToken || adminSessionToken);");
  });

  it("returns 404 for missing sender detail records and wires sender-names alias GET to the detail route", async () => {
    mocks.senderNameFindUnique.mockResolvedValue(null);

    const response = await getSenderNameDetail(
      new NextRequest("http://localhost/api/v1/senders/name/999999"),
      { params: Promise.resolve({ id: "999999" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: "ไม่พบ sender name",
    });

    const senderNamesAliasSource = readFileSync(
      resolve(ROOT, "app/api/v1/sender-names/[id]/route.ts"),
      "utf8",
    );
    const sendersDetailSource = readFileSync(
      resolve(ROOT, "app/api/v1/senders/[id]/route.ts"),
      "utf8",
    );

    expect(senderNamesAliasSource).toContain('export { GET } from "@/app/api/v1/senders/name/[id]/route";');
    expect(sendersDetailSource).toContain('export { GET } from "@/app/api/v1/senders/name/[id]/route";');
  });
});
