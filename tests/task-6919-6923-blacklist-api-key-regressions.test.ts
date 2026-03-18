import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ZodError } from "zod";

const ROOT = process.cwd();

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  requireApiPermission: vi.fn(),
  readJsonOr400: vi.fn(),
  normalizePhone: vi.fn(),
  phoneBlacklistFindMany: vi.fn(),
  phoneBlacklistFindUnique: vi.fn(),
  phoneBlacklistCreate: vi.fn(),
  phoneBlacklistUpdate: vi.fn(),
  phoneBlacklistDeleteMany: vi.fn(),
  createApiKeyParse: vi.fn(),
  createApiKeyForUser: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => {
  class TestApiError extends Error {
    status: number;
    code?: string;

    constructor(status: number, message: string, code?: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }

  return {
    ApiError: TestApiError,
    authenticateRequest: mocks.authenticateRequest,
    apiResponse: (data: unknown, status = 200) => Response.json(data, { status }),
    apiError: (error: unknown) => {
      if (error instanceof ZodError) {
        return Response.json(
          { error: error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง", code: "BAD_REQUEST" },
          { status: 400 },
        );
      }

      const status =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof error.status === "number"
          ? error.status
          : 500;
      const message = error instanceof Error ? error.message : "Internal Server Error";
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : undefined;

      return Response.json({ error: message, code }, { status });
    },
  };
});

vi.mock("@/lib/rbac", () => ({
  requireApiPermission: mocks.requireApiPermission,
}));

vi.mock("@/lib/read-json-or-400", () => ({
  readJsonOr400: mocks.readJsonOr400,
}));

vi.mock("@/lib/validations", async () => {
  const actual = await vi.importActual<typeof import("@/lib/validations")>("@/lib/validations");
  return {
    ...actual,
    normalizePhone: mocks.normalizePhone,
    createApiKeySchema: {
      parse: mocks.createApiKeyParse,
    },
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    phoneBlacklist: {
      findMany: mocks.phoneBlacklistFindMany,
      findUnique: mocks.phoneBlacklistFindUnique,
      create: mocks.phoneBlacklistCreate,
      update: mocks.phoneBlacklistUpdate,
      deleteMany: mocks.phoneBlacklistDeleteMany,
    },
  },
}));

vi.mock("@/lib/api-keys/service", () => ({
  createApiKeyForUser: mocks.createApiKeyForUser,
  listApiKeysForUser: vi.fn(),
}));

import {
  DELETE as deleteBlacklist,
  GET as getBlacklist,
  POST as postBlacklist,
} from "@/app/api/v1/contacts/blacklist/route";
import { POST as postApiKey } from "@/app/api/v1/api-keys/route";

describe("Task #6923: blacklist ownership scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ id: "user_1", role: "user" });
    mocks.requireApiPermission.mockResolvedValue(null);
    mocks.normalizePhone.mockImplementation((phone: string) =>
      phone.startsWith("+66") ? phone : "+66812345678"
    );
    mocks.readJsonOr400.mockResolvedValue({ phone: "0812345678", reason: "manual" });
  });

  it("limits GET /api/v1/contacts/blacklist to the current owner", async () => {
    mocks.phoneBlacklistFindMany.mockResolvedValue([
      {
        id: "blk_1",
        phone: "0812345678",
        reason: "manual",
        createdAt: new Date("2026-03-17T00:00:00.000Z"),
      },
    ]);

    const response = await getBlacklist(new NextRequest("http://localhost/api/v1/contacts/blacklist"));

    expect(response.status).toBe(200);
    expect(mocks.phoneBlacklistFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { addedBy: "user_1" },
      }),
    );
    const body = await response.json();
    expect(body.entries).toEqual([
      {
        id: "blk_1",
        phone: "0812345678",
        reason: "manual",
        addedAt: "2026-03-17T00:00:00.000Z",
      },
    ]);
  });

  it("allows different users to blacklist the same phone independently", async () => {
    mocks.authenticateRequest.mockResolvedValue({ id: "user_2", role: "user" });
    mocks.phoneBlacklistFindUnique.mockResolvedValue(null);
    mocks.phoneBlacklistCreate.mockResolvedValue({
      id: "blk_2",
      phone: "0812345678",
      reason: "manual",
      createdAt: new Date("2026-03-17T00:00:00.000Z"),
    });

    const response = await postBlacklist(new NextRequest("http://localhost/api/v1/contacts/blacklist", { method: "POST" }));

    expect(response.status).toBe(201);
    expect(mocks.phoneBlacklistFindUnique).toHaveBeenCalledWith({
      where: {
        phone_addedBy: {
          phone: "+66812345678",
          addedBy: "user_2",
        },
      },
      select: {
        id: true,
      },
    });
    expect(mocks.phoneBlacklistCreate).toHaveBeenCalledWith({
      data: {
        phone: "+66812345678",
        reason: "manual",
        addedBy: "user_2",
      },
      select: {
        id: true,
        phone: true,
        reason: true,
        createdAt: true,
      },
    });
  });

  it("only deletes the current user's blacklist entry", async () => {
    mocks.phoneBlacklistDeleteMany.mockResolvedValue({ count: 0 });

    const response = await deleteBlacklist(new NextRequest("http://localhost/api/v1/contacts/blacklist", { method: "DELETE" }));

    expect(mocks.phoneBlacklistDeleteMany).toHaveBeenCalledWith({
      where: {
        phone: "+66812345678",
        addedBy: "user_1",
      },
    });
    expect(response.status).toBe(404);
  });

  it("rejects blacklist reasons containing HTML characters with 400", async () => {
    mocks.readJsonOr400.mockResolvedValue({
      phone: "0812345678",
      reason: "<script>alert(1)</script>",
    });

    const response = await postBlacklist(new NextRequest("http://localhost/api/v1/contacts/blacklist", { method: "POST" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "ข้อความมีอักขระ HTML ที่ไม่อนุญาต",
    });
    expect(mocks.phoneBlacklistFindUnique).not.toHaveBeenCalled();
  });

  it("accepts +66 phone input and uses normalized E.164 format", async () => {
    mocks.readJsonOr400.mockResolvedValue({
      phone: "+66812345678",
      reason: "manual",
    });
    mocks.normalizePhone.mockReturnValue("+66812345678");
    mocks.phoneBlacklistFindUnique.mockResolvedValue(null);
    mocks.phoneBlacklistCreate.mockResolvedValue({
      id: "blk_66",
      phone: "+66812345678",
      reason: "manual",
      createdAt: new Date("2026-03-17T00:00:00.000Z"),
    });

    const response = await postBlacklist(new NextRequest("http://localhost/api/v1/contacts/blacklist", { method: "POST" }));

    expect(response.status).toBe(201);
    expect(mocks.phoneBlacklistCreate).toHaveBeenCalledWith({
      data: {
        phone: "+66812345678",
        reason: "manual",
        addedBy: "user_1",
      },
      select: {
        id: true,
        phone: true,
        reason: true,
        createdAt: true,
      },
    });
  });

  it("changes PhoneBlacklist to compound uniqueness by phone + owner", () => {
    const schema = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf8");
    expect(schema).toContain("@@unique([phone, addedBy])");
    expect(schema).not.toContain("phone     String   @unique");
  });
});

describe("Task #6919: API key create response contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ id: "user_1", role: "user" });
    mocks.createApiKeyParse.mockImplementation((body: unknown) => body);
    mocks.createApiKeyForUser.mockResolvedValue({
      id: "key_1",
      name: "Primary",
      key: "sk_live_secret",
      rateLimit: 60,
      ipWhitelist: [],
      createdAt: "2026-03-17T00:00:00.000Z",
    });
  });

  it("returns the created API key id in both top-level and response.data", async () => {
    const response = await postApiKey(
      new NextRequest("http://localhost/api/v1/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: "Primary" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBe("key_1");
    expect(body.data).toMatchObject({
      id: "key_1",
      name: "Primary",
    });
  });
});
