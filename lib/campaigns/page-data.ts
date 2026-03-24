import { getCampaigns } from "@/lib/actions/campaigns";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// No hardcoded default — sender names come from user's approved list only
const CAMPAIGN_PAGE_STATUSES = new Set([
  "draft",
  "scheduled",
  "sending",
  "running",
  "completed",
  "failed",
  "cancelled",
  "paused",
] as const);
const RECOVERABLE_PRISMA_ERROR_NAMES = new Set([
  "PrismaClientKnownRequestError",
  "PrismaClientUnknownRequestError",
  "PrismaClientInitializationError",
]);

type CampaignPageStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused";

type RawCampaign = Awaited<ReturnType<typeof getCampaigns>>["campaigns"][number];

export type CampaignPageCampaign = {
  id: string;
  name: string;
  status: CampaignPageStatus;
  groupName: string;
  templateName: string;
  senderName: string;
  scheduledAt: string | null;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  creditReserved: number;
  creditUsed: number;
  createdAt: string;
};

export type CampaignPageGroup = {
  id: string;
  name: string;
  count: number;
};

export type CampaignPageTemplate = {
  id: string;
  name: string;
  body: string;
};

export type CampaignPageData = {
  campaigns: CampaignPageCampaign[];
  groups: CampaignPageGroup[];
  templates: CampaignPageTemplate[];
  senderNames: string[];
};

const STATUS_ALIASES: Record<string, CampaignPageStatus> = {
  queuing: "sending",
  queued: "sending",
  pending: "scheduled",
  active: "running",
  stopped: "cancelled",
};

export function normalizeCampaignStatus(status: string | null | undefined): CampaignPageStatus {
  const normalized = status?.toLowerCase();
  if (!normalized) return "draft";

  if (CAMPAIGN_PAGE_STATUSES.has(normalized as CampaignPageStatus)) {
    return normalized as CampaignPageStatus;
  }

  // Map known backend aliases
  if (normalized in STATUS_ALIASES) {
    return STATUS_ALIASES[normalized];
  }

  // Unknown status — log and surface as failed so UI shows error state
  logger.warn?.("Unknown campaign status", { status });
  return "failed";
}

export function isRecoverableCampaignsPageError(error: unknown): error is Error {
  return error instanceof Error && RECOVERABLE_PRISMA_ERROR_NAMES.has(error.name);
}

function logRecoverableError(scope: string, userId: string, error: Error) {
  logger.error("Campaigns page data fallback", {
    scope,
    userId,
    errorName: error.name,
    errorMessage: error.message,
  });
}

function serializeCampaign(campaign: RawCampaign): CampaignPageCampaign {
  return {
    id: campaign.id,
    name: campaign.name,
    status: normalizeCampaignStatus(campaign.status),
    groupName: campaign.contactGroup?.name ?? "—",
    templateName: campaign.template?.name ?? "—",
    senderName: campaign.senderName ?? "—",
    scheduledAt: campaign.scheduledAt?.toISOString() ?? null,
    totalRecipients: campaign.totalRecipients,
    sentCount: campaign.sentCount,
    deliveredCount: campaign.deliveredCount,
    failedCount: campaign.failedCount,
    creditReserved: campaign.creditReserved,
    creditUsed: campaign.creditUsed,
    createdAt: campaign.createdAt.toISOString(),
  };
}

export async function loadCampaignsPageData(userId: string): Promise<CampaignPageData> {
  const [campaignsResult, metadataResult] = await Promise.allSettled([
    getCampaigns(userId),
    Promise.all([
      prisma.contactGroup.findMany({
        where: { userId },
        select: { id: true, name: true, _count: { select: { members: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.messageTemplate.findMany({
        where: { userId, deletedAt: null },
        select: { id: true, name: true, content: true },
        orderBy: { name: "asc" },
      }),
      prisma.senderName.findMany({
        where: { userId, status: "APPROVED" },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
    ]),
  ]);

  const campaigns =
    campaignsResult.status === "fulfilled"
      ? campaignsResult.value.campaigns.map(serializeCampaign)
      : [];

  if (campaignsResult.status === "rejected") {
    if (!isRecoverableCampaignsPageError(campaignsResult.reason)) {
      throw campaignsResult.reason;
    }

    logRecoverableError("campaigns", userId, campaignsResult.reason);
  }

  let groups: CampaignPageGroup[] = [];
  let templates: CampaignPageTemplate[] = [];
  let senderNames: string[] = [];

  if (metadataResult.status === "fulfilled") {
    const [rawGroups, rawTemplates, approvedSenders] = metadataResult.value;

    groups = rawGroups.map((group: (typeof rawGroups)[number]) => ({
      id: group.id,
      name: group.name,
      count: group._count.members,
    }));

    templates = rawTemplates.map((template: (typeof rawTemplates)[number]) => ({
      id: template.id,
      name: template.name,
      body: template.content,
    }));

    senderNames = approvedSenders.map((sender: (typeof approvedSenders)[number]) => sender.name);
  } else {
    if (!isRecoverableCampaignsPageError(metadataResult.reason)) {
      throw metadataResult.reason;
    }

    logRecoverableError("metadata", userId, metadataResult.reason);
  }

  return {
    campaigns,
    groups,
    templates,
    senderNames,
  };
}
