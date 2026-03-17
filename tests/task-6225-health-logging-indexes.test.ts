import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const mocks = vi.hoisted(() => ({
  loggerError: vi.fn(),
  finishApiLog: vi.fn(),
  prismaQueryRaw: vi.fn(),
  redisHealthCheck: vi.fn(),
  queueWaiting: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: mocks.loggerError,
  },
}));

vi.mock("@/lib/api-log", () => ({
  ERROR_CODES: {
    VALIDATION: "1001",
    BAD_REQUEST: "1002",
    NOT_FOUND: "2004",
    AUTH_MISSING: "3001",
    AUTH_INVALID: "3002",
    AUTH_DISABLED: "3003",
    AUTH_FAILED: "3004",
    FORBIDDEN: "3005",
    RATE_LIMIT: "4001",
    CREDITS: "4002",
    BUSINESS: "4003",
    INTERNAL: "5001",
    GATEWAY: "5002",
  },
  finishApiLog: mocks.finishApiLog,
  setApiLogApiKey: vi.fn(),
  setApiLogUser: vi.fn(),
  startApiLog: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: mocks.prismaQueryRaw,
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    COMMIT_SHA: "test-sha",
  },
}));

vi.mock("@/lib/redis", () => ({
  redisHealthCheck: mocks.redisHealthCheck,
}));

vi.mock("@/lib/queue/queues", () => ({
  allQueues: [
    {
      name: "campaign",
      getWaitingCount: mocks.queueWaiting,
    },
  ],
}));

import { apiError } from "@/lib/api-auth";
import { GET as getHealthRoute } from "@/app/api/health/route";

function extractModelBlock(source: string, modelName: string): string {
  const pattern = new RegExp(`model ${modelName} \\{[\\s\\S]*?\\n\\}`, "m");
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`model block not found: ${modelName}`);
  }
  return match[0];
}

describe("Task #6225: API health + logging + indexes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prismaQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mocks.redisHealthCheck.mockResolvedValue({ status: "ok", latency: 5 });
    mocks.queueWaiting.mockResolvedValue(0);
  });

  it("logs structured details for unhandled internal API errors while keeping 500 response generic", async () => {
    const error = new Error("database connection reset");

    const response = apiError(error);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่",
      code: "5001",
    });
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "Unhandled API error",
      expect.objectContaining({
        errorName: "Error",
        message: "database connection reset",
        stack: expect.any(String),
      }),
    );
  });

  it("keeps /api/health ready only when the database check succeeds", async () => {
    const healthyResponse = await getHealthRoute();
    const healthyBody = await healthyResponse.json();

    expect(healthyResponse.status).toBe(200);
    expect(mocks.prismaQueryRaw).toHaveBeenCalledTimes(1);
    expect(healthyBody.status).toBe("healthy");
    expect(healthyBody.checks.database).toEqual(
      expect.objectContaining({ status: "ok" }),
    );

    mocks.prismaQueryRaw.mockRejectedValueOnce(new Error("db down"));

    const degradedResponse = await getHealthRoute();
    const degradedBody = await degradedResponse.json();

    expect(degradedResponse.status).toBe(503);
    expect(degradedBody.status).toBe("degraded");
    expect(degradedBody.checks.database).toEqual({
      status: "error",
      error: "database unreachable",
    });
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "Health check: database unreachable",
      { error: "db down" },
    );
  });

  it("keeps composite indexes aligned with hot paginated list routes", () => {
    const schema = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf8");

    expect(extractModelBlock(schema, "Contact")).toContain("@@index([userId, createdAt])");
    expect(extractModelBlock(schema, "ContactGroup")).toContain("@@index([userId, createdAt])");
    expect(extractModelBlock(schema, "SenderName")).toContain("@@index([userId, status])");
    expect(extractModelBlock(schema, "MessageTemplate")).toContain("@@index([userId, deletedAt, updatedAt])");
    expect(extractModelBlock(schema, "ShortLink")).toContain("@@index([userId, createdAt])");
    expect(extractModelBlock(schema, "ShortLink")).toContain("@@index([userId, campaignId, createdAt])");
  });
});
