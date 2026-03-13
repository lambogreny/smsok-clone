import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  resolveActionUserId: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

vi.mock("@/lib/action-user", () => ({
  resolveActionUserId: mocks.resolveActionUserId,
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  revokeAllUserSessions: vi.fn(),
}));

vi.mock("@/lib/validations", () => ({
  changePasswordSchema: { parse: vi.fn() },
  updateProfileSchema: { parse: vi.fn() },
  updateWorkspaceSchema: { parse: vi.fn() },
  updateNotificationPrefsSchema: { parse: vi.fn() },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { getProfile } from "@/lib/actions/settings";

describe("Task #2790: QA retest regressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveActionUserId.mockResolvedValue("user_missing");
  });

  it("throws 404 when the requested profile does not exist", async () => {
    mocks.userFindUnique.mockResolvedValue(null);

    await expect(getProfile("user_missing")).rejects.toMatchObject({
      status: 404,
      message: "ไม่พบบัญชีผู้ใช้",
    });
  });

  it("returns the resolved profile when the user exists", async () => {
    const createdAt = new Date("2026-03-13T12:00:00.000Z");
    mocks.userFindUnique.mockResolvedValue({
      id: "user_1",
      name: "QA Tester",
      email: "qa@example.com",
      phone: null,
      role: "user",
      createdAt,
    });

    await expect(getProfile("user_1")).resolves.toEqual({
      id: "user_1",
      name: "QA Tester",
      email: "qa@example.com",
      phone: null,
      role: "user",
      createdAt,
    });
  });
});
