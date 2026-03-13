import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCampaigns: vi.fn(),
  contactGroupsFindMany: vi.fn(),
  messageTemplatesFindMany: vi.fn(),
  senderNamesFindMany: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@/lib/actions/campaigns", () => ({
  getCampaigns: mocks.getCampaigns,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    contactGroup: {
      findMany: mocks.contactGroupsFindMany,
    },
    messageTemplate: {
      findMany: mocks.messageTemplatesFindMany,
    },
    senderName: {
      findMany: mocks.senderNamesFindMany,
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: mocks.loggerError,
  },
}));

import {
  isRecoverableCampaignsPageError,
  loadCampaignsPageData,
  normalizeCampaignStatus,
} from "@/lib/campaigns/page-data";

describe("Task #1828: campaigns page data loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes campaign statuses to the lowercase client-safe values", () => {
    expect(normalizeCampaignStatus("DRAFT")).toBe("draft");
    expect(normalizeCampaignStatus("QUEUING")).toBe("sending");
    expect(normalizeCampaignStatus("PAUSED")).toBe("paused");
    expect(normalizeCampaignStatus("RUNNING")).toBe("running");
    expect(normalizeCampaignStatus("unexpected")).toBe("failed");
    expect(normalizeCampaignStatus(undefined)).toBe("draft");
  });

  it("returns serialized page data and deduplicated sender names on success", async () => {
    mocks.getCampaigns.mockResolvedValue({
      campaigns: [
        {
          id: "camp_1",
          name: "Promo",
          status: "COMPLETED",
          contactGroup: { name: "VIP" },
          template: { name: "Sale" },
          senderName: null,
          scheduledAt: new Date("2026-03-12T10:00:00.000Z"),
          totalRecipients: 42,
          sentCount: 40,
          deliveredCount: 38,
          failedCount: 2,
          creditReserved: 42,
          creditUsed: 40,
          createdAt: new Date("2026-03-12T09:00:00.000Z"),
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    mocks.contactGroupsFindMany.mockResolvedValue([{ id: "grp_1", name: "VIP", _count: { members: 42 } }]);
    mocks.messageTemplatesFindMany.mockResolvedValue([{ id: "tpl_1", name: "Sale", content: "Hello" }]);
    mocks.senderNamesFindMany.mockResolvedValue([{ name: "EasySlip" }, { name: "BrandX" }]);

    const data = await loadCampaignsPageData("user_1");

    expect(data).toEqual({
      campaigns: [
        {
          id: "camp_1",
          name: "Promo",
          status: "completed",
          groupName: "VIP",
          templateName: "Sale",
          senderName: "EasySlip",
          scheduledAt: "2026-03-12T10:00:00.000Z",
          totalRecipients: 42,
          sentCount: 40,
          deliveredCount: 38,
          failedCount: 2,
          creditReserved: 42,
          creditUsed: 40,
          createdAt: "2026-03-12T09:00:00.000Z",
        },
      ],
      groups: [{ id: "grp_1", name: "VIP", count: 42 }],
      templates: [{ id: "tpl_1", name: "Sale", body: "Hello" }],
      senderNames: ["EasySlip", "BrandX"],
    });
  });

  it("falls back to empty campaign data when Prisma page queries fail", async () => {
    const campaignsError = new Error("relation \"campaigns\" does not exist");
    campaignsError.name = "PrismaClientKnownRequestError";
    const metadataError = new Error("can't reach database");
    metadataError.name = "PrismaClientInitializationError";

    mocks.getCampaigns.mockRejectedValue(campaignsError);
    mocks.contactGroupsFindMany.mockRejectedValue(metadataError);
    mocks.messageTemplatesFindMany.mockResolvedValue([]);
    mocks.senderNamesFindMany.mockResolvedValue([]);

    const data = await loadCampaignsPageData("user_2");

    expect(data).toEqual({
      campaigns: [],
      groups: [],
      templates: [],
      senderNames: ["EasySlip"],
    });
    expect(mocks.loggerError).toHaveBeenCalledTimes(2);
  });

  it("rethrows non-Prisma errors instead of silently masking them", async () => {
    const fatal = new Error("bad serialization bug");
    mocks.getCampaigns.mockRejectedValue(fatal);
    mocks.contactGroupsFindMany.mockResolvedValue([]);
    mocks.messageTemplatesFindMany.mockResolvedValue([]);
    mocks.senderNamesFindMany.mockResolvedValue([]);

    await expect(loadCampaignsPageData("user_3")).rejects.toThrow("bad serialization bug");
  });
});

describe("Task #1828: recoverable error guard", () => {
  it("matches Prisma client error names only", () => {
    const prismaError = new Error("db down");
    prismaError.name = "PrismaClientInitializationError";
    expect(isRecoverableCampaignsPageError(prismaError)).toBe(true);

    const genericError = new Error("boom");
    expect(isRecoverableCampaignsPageError(genericError)).toBe(false);
  });
});
