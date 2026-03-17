import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const mocks = vi.hoisted(() => ({
  loggerError: vi.fn(),
  prismaQueryRaw: vi.fn(),
  redisHealthCheck: vi.fn(),
  queueWaiting: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: mocks.loggerError,
  },
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

import { GET as getHealthRoute } from "@/app/api/health/route";

describe("Task #6579: canonical health contract stays DB-ready even when Redis flaps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prismaQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mocks.redisHealthCheck.mockResolvedValue({ status: "ok", latency: 5 });
    mocks.queueWaiting.mockResolvedValue(0);
  });

  it("returns 200 when database is healthy even if redis and queues are degraded", async () => {
    mocks.redisHealthCheck.mockResolvedValueOnce({ status: "error", error: "redis unreachable" });
    mocks.queueWaiting.mockRejectedValueOnce(new Error("queue unavailable"));

    const response = await getHealthRoute();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ready).toBe(true);
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toMatchObject({ status: "ok" });
    expect(body.checks.redis).toMatchObject({ status: "error" });
    expect(body.checks.queues).toMatchObject({
      status: "error",
      queues: { campaign: -1 },
    });
  });

  it("keeps /api/health source aligned to app+db readiness and explicit node runtime", () => {
    const routeSource = readFileSync(resolve(ROOT, "app/api/health/route.ts"), "utf8");
    const deploySource = readFileSync(resolve(ROOT, "scripts/deploy.sh"), "utf8");
    const smokeSource = readFileSync(resolve(ROOT, "tests/smoke-test.sh"), "utf8");

    expect(routeSource).toContain('export const runtime = "nodejs";');
    expect(routeSource).toContain('const ready = checks.app.status === "ok" && checks.database?.status === "ok";');
    expect(routeSource).toContain('status: ready ? 200 : 503');
    expect(routeSource).not.toContain("Object.values(checks).every((c) => c.status === \"ok\")");
    expect(deploySource).toContain("/api/health/ready");
    expect(smokeSource).toContain('check "API readiness" "$BASE/api/health/ready"');
  });
});
