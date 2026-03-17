import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveActionUserId: vi.fn(),
  notificationPrefsFindUnique: vi.fn(),
  notificationPrefsUpsert: vi.fn(),
  updateNotificationPrefsParse: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    notificationPrefs: {
      findUnique: mocks.notificationPrefsFindUnique,
      upsert: mocks.notificationPrefsUpsert,
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
  updateNotificationPrefsSchema: { parse: mocks.updateNotificationPrefsParse },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { getNotificationPrefs, updateNotificationPrefs } from "@/lib/actions/settings";

describe("Task #6382/#6776: notification prefs compatibility + persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveActionUserId.mockResolvedValue("user_6382");
    mocks.updateNotificationPrefsParse.mockImplementation((input: unknown) => input);
  });

  it("backfills legacy-only notification toggles without selecting missing columns", async () => {
    mocks.notificationPrefsFindUnique.mockResolvedValue({
      emailCreditLow: false,
      emailCampaignDone: true,
      emailWeeklyReport: true,
      emailPackageExpiry: false,
      emailInvoice: false,
      emailSecurity: true,
      smsCreditLow: true,
      smsCampaignDone: false,
    });

    await expect(getNotificationPrefs("user_6382")).resolves.toEqual({
      emailCreditLow: false,
      emailCampaignDone: true,
      emailWeeklyReport: true,
      emailInvoice: false,
      emailPackageExpiry: false,
      emailSecurity: true,
      smsCreditLow: true,
      smsCampaignDone: false,
    });

    expect(mocks.notificationPrefsFindUnique).toHaveBeenCalledWith({
      where: { userId: "user_6382" },
      select: {
        emailCreditLow: true,
        emailCampaignDone: true,
        emailWeeklyReport: true,
        emailPackageExpiry: true,
        emailInvoice: true,
        emailSecurity: true,
        smsCreditLow: true,
        smsCampaignDone: true,
      },
    });
  });

  it("returns defaults when the user has no notification row yet", async () => {
    mocks.notificationPrefsFindUnique.mockResolvedValue(null);

    await expect(getNotificationPrefs("user_6382")).resolves.toEqual({
      emailCreditLow: true,
      emailCampaignDone: true,
      emailWeeklyReport: false,
      emailInvoice: true,
      emailPackageExpiry: true,
      emailSecurity: true,
      smsCreditLow: false,
      smsCampaignDone: false,
    });
  });

  it("persists invoice, security, and package-expiry toggles when clients update them", async () => {
    mocks.updateNotificationPrefsParse.mockReturnValue({
      emailCreditLow: false,
      emailCampaignDone: true,
      emailWeeklyReport: false,
      emailPackageExpiry: false,
      emailInvoice: true,
      emailSecurity: true,
      smsCreditLow: false,
      smsCampaignDone: true,
    });
    mocks.notificationPrefsUpsert.mockResolvedValue({
      emailCreditLow: false,
      emailCampaignDone: true,
      emailWeeklyReport: false,
      emailPackageExpiry: false,
      emailInvoice: true,
      emailSecurity: true,
      smsCreditLow: false,
      smsCampaignDone: true,
    });

    await expect(updateNotificationPrefs("user_6382", { any: "payload" })).resolves.toEqual({
      emailCreditLow: false,
      emailCampaignDone: true,
      emailWeeklyReport: false,
      emailInvoice: true,
      emailSecurity: true,
      emailPackageExpiry: false,
      smsCreditLow: false,
      smsCampaignDone: true,
    });

    expect(mocks.notificationPrefsUpsert).toHaveBeenCalledWith({
      where: { userId: "user_6382" },
      create: {
        userId: "user_6382",
        emailCreditLow: false,
        emailCampaignDone: true,
        emailWeeklyReport: false,
        emailPackageExpiry: false,
        emailInvoice: true,
        emailSecurity: true,
        smsCreditLow: false,
        smsCampaignDone: true,
      },
      update: {
        emailCreditLow: false,
        emailCampaignDone: true,
        emailWeeklyReport: false,
        emailPackageExpiry: false,
        emailInvoice: true,
        emailSecurity: true,
        smsCreditLow: false,
        smsCampaignDone: true,
      },
      select: {
        emailCreditLow: true,
        emailCampaignDone: true,
        emailWeeklyReport: true,
        emailPackageExpiry: true,
        emailInvoice: true,
        emailSecurity: true,
        smsCreditLow: true,
        smsCampaignDone: true,
      },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard/settings");
  });

  it("returns a stable default emailPackageExpiry when clients omit that field", async () => {
    mocks.updateNotificationPrefsParse.mockReturnValue({
      emailCreditLow: true,
    });
    mocks.notificationPrefsUpsert.mockResolvedValue({
      emailCreditLow: true,
      emailCampaignDone: false,
      emailWeeklyReport: false,
      emailPackageExpiry: true,
      emailInvoice: true,
      emailSecurity: true,
      smsCreditLow: false,
      smsCampaignDone: false,
    });

    const result = await updateNotificationPrefs("user_6382", {});

    expect(result.emailInvoice).toBe(true);
    expect(result.emailSecurity).toBe(true);
    expect(result.emailPackageExpiry).toBe(true);
  });
});
