import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { NextRequest } from "next/server";

const state = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  otpCount: vi.fn(),
  otpFindMany: vi.fn(),
}));

vi.mock("@/lib/api-auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-auth")>("@/lib/api-auth");
  return {
    ...actual,
    authenticateRequest: state.authenticateRequest,
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    otpRequest: {
      count: state.otpCount,
      findMany: state.otpFindMany,
    },
  },
}));

import { GET as getOtpStats } from "@/app/api/v1/otp/stats/route";

const ROOT = resolve(__dirname, "..");
const packagesRoute = readFileSync(resolve(ROOT, "app/api/v1/packages/route.ts"), "utf-8");
const notificationsRoute = readFileSync(
  resolve(ROOT, "app/api/v1/settings/notifications/route.ts"),
  "utf-8",
);
const adminQueuesRoute = readFileSync(resolve(ROOT, "app/api/admin/queues/route.ts"), "utf-8");

describe("Task #2070: package + notification routes use real backend data", () => {
  it("loads package tiers from PackageTier records instead of hardcoded pricing", () => {
    expect(packagesRoute).toContain("db.packageTier.findMany");
    expect(packagesRoute).toContain("where: { isActive: true, isTrial: false }");
    expect(packagesRoute).not.toContain("PACKAGE_TIERS");
  });

  it("reads and persists notification preferences through server actions", () => {
    expect(notificationsRoute).toContain("getNotificationPrefs(user.id)");
    expect(notificationsRoute).toContain("updateNotificationPrefs(user.id, input)");
  });

  it("keeps the BullBoard adapter bridge without mock-data naming", () => {
    expect(adminQueuesRoute).toContain("const adapterReq");
    expect(adminQueuesRoute).toContain("const adapterRes");
    expect(adminQueuesRoute).not.toContain("mockReq");
    expect(adminQueuesRoute).not.toContain("mockRes");
  });
});

describe("Task #2070: OTP stats derive avgVerifyTime from real data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.authenticateRequest.mockResolvedValue({ id: "user_1", role: "user" });
    state.otpCount
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    state.otpFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
  });

  it("returns null instead of a fake 30-second average when no verified OTP data exists", async () => {
    const response = await getOtpStats(
      new NextRequest("http://localhost:3000/api/v1/otp/stats"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats.avgVerifyTime).toBeNull();
    expect(body.stats.timeDelta).toBe("ยังไม่มีข้อมูล");
  });
});
