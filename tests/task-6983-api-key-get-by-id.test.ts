import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getApiKeyForUser: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  authenticateRequest: mocks.authenticateRequest,
  apiResponse: (data: unknown, status = 200) => Response.json(data, { status }),
  apiError: (error: unknown) => {
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;

    return Response.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status },
    );
  },
  ApiError: class TestApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock("@/lib/api-keys/service", () => ({
  getApiKeyForUser: mocks.getApiKeyForUser,
  deleteApiKeyForUser: vi.fn(),
  toggleApiKeyForUser: vi.fn(),
  updateApiKeyNameForUser: vi.fn(),
}));

import { GET as getApiKeyDetail } from "@/app/api/v1/api-keys/[id]/route";

describe("Task #6983: API key GET by id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ id: "user_1", role: "user" });
    mocks.getApiKeyForUser.mockResolvedValue({
      id: "key_1",
      name: "Primary",
      key: "sk_live_1234...abcd",
      permissions: ["sms:send"],
      rateLimit: 60,
      ipWhitelist: ["127.0.0.1"],
      isActive: true,
      lastUsed: null,
      revokedAt: null,
      createdAt: "2026-03-18T00:00:00.000Z",
    });
  });

  it("returns key metadata for the current user without requiring list+filter on the client", async () => {
    const response = await getApiKeyDetail(
      new NextRequest("http://localhost/api/v1/api-keys/key_1"),
      { params: Promise.resolve({ id: "key_1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.getApiKeyForUser).toHaveBeenCalledWith("user_1", "key_1");

    const body = await response.json();
    expect(body).toMatchObject({
      id: "key_1",
      name: "Primary",
      key: "sk_live_1234...abcd",
    });
    expect(body.key).not.toBe("sk_live_secret");
  });

  it("returns 404 when the key does not belong to the current user", async () => {
    const { ApiError } = await import("@/lib/api-auth");
    mocks.getApiKeyForUser.mockRejectedValue(new ApiError(404, "ไม่พบ API Key"));

    const response = await getApiKeyDetail(
      new NextRequest("http://localhost/api/v1/api-keys/missing"),
      { params: Promise.resolve({ id: "missing" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: "ไม่พบ API Key",
    });
  });
});
