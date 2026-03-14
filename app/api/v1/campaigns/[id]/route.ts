import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { requireApiPermission } from "@/lib/rbac";
import { ensureSufficientQuota } from "@/lib/package/quota";
import { updateCampaignSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const campaignSelect = {
  id: true,
  name: true,
  status: true,
  priority: true,
  recipientSource: true,
  contactGroupId: true,
  templateId: true,
  senderName: true,
  messageBody: true,
  scheduledAt: true,
  totalRecipients: true,
  validRecipients: true,
  sentCount: true,
  deliveredCount: true,
  failedCount: true,
  creditReserved: true,
  creditUsed: true,
  startedAt: true,
  completedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  contactGroup: {
    select: {
      id: true,
      name: true,
    },
  },
  template: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

const EDITABLE_CAMPAIGN_STATUSES = new Set(["draft", "scheduled"]);

function normalizeCampaignPayload(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return body;
  }

  const input = body as Record<string, unknown>;
  return {
    ...input,
    contactGroupId: input.contactGroupId ?? input.contact_group_id,
    templateId: input.templateId ?? input.template_id,
    senderName: input.senderName ?? input.sender_name,
    scheduledAt: input.scheduledAt ?? input.scheduled_at,
  };
}

// GET /api/v1/campaigns/:id — campaign detail
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "campaign");
    if (denied) return denied;

    const { id } = await ctx.params;
    const campaign = await db.campaign.findFirst({
      where: { id, userId: user.id },
      select: campaignSelect,
    });

    if (!campaign) throw new ApiError(404, "ไม่พบแคมเปญ");

    return apiResponse({ campaign });
  } catch (error) {
    return apiError(error);
  }
}

async function updateCampaignRecord(userId: string, id: string, body: unknown) {
  const input = updateCampaignSchema.parse(normalizeCampaignPayload(body));

  const campaign = await db.campaign.findFirst({
    where: { id, userId },
    select: {
      id: true,
      status: true,
      contactGroupId: true,
      templateId: true,
      senderName: true,
      scheduledAt: true,
      totalRecipients: true,
    },
  });
  if (!campaign) throw new ApiError(404, "ไม่พบแคมเปญ");
  if (!EDITABLE_CAMPAIGN_STATUSES.has(campaign.status)) {
    throw new ApiError(400, "แก้ไขได้เฉพาะแคมเปญที่ยังไม่เริ่มส่ง");
  }

  const nextGroupId = input.contactGroupId === undefined ? campaign.contactGroupId : input.contactGroupId;
  const nextTemplateId = input.templateId === undefined ? campaign.templateId : input.templateId;
  const nextSenderName = input.senderName === undefined
    ? (campaign.senderName ?? "EasySlip")
    : (input.senderName ?? "EasySlip");
  const nextScheduledAt = input.scheduledAt === undefined ? campaign.scheduledAt : input.scheduledAt;

  let totalRecipients = campaign.totalRecipients;
  if (nextGroupId) {
    const group = await db.contactGroup.findFirst({
      where: { id: nextGroupId, userId },
      include: { _count: { select: { members: true } } },
    });
    if (!group) throw new ApiError(404, "ไม่พบกลุ่มรายชื่อ");
    totalRecipients = group._count.members;
  } else {
    totalRecipients = 0;
  }

  if (nextTemplateId) {
    const template = await db.messageTemplate.findFirst({
      where: { id: nextTemplateId, userId },
      select: { id: true },
    });
    if (!template) throw new ApiError(404, "ไม่พบเทมเพลตข้อความ");
  }

  if (nextSenderName !== "EasySlip") {
    const sender = await db.senderName.findFirst({
      where: { userId, name: nextSenderName, status: { in: ["APPROVED", "ACTIVE"] } },
      select: { id: true },
    });
    if (!sender) throw new ApiError(400, "ชื่อผู้ส่งยังไม่ได้รับอนุมัติ");
  }

  await ensureSufficientQuota(userId, totalRecipients);

  return db.campaign.update({
    where: { id: campaign.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.contactGroupId !== undefined ? { contactGroupId: input.contactGroupId } : {}),
      ...(input.templateId !== undefined ? { templateId: input.templateId } : {}),
      ...(input.senderName !== undefined ? { senderName: input.senderName ?? "EasySlip" } : {}),
      ...(input.scheduledAt !== undefined
        ? {
            scheduledAt: input.scheduledAt,
            status: input.scheduledAt ? "scheduled" : "draft",
          }
        : {}),
      totalRecipients,
      creditReserved: totalRecipients,
    },
    select: campaignSelect,
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "update", "campaign");
    if (denied) return denied;

    const { id } = await ctx.params;
    const campaign = await updateCampaignRecord(user.id, id, await req.json());
    return apiResponse({ campaign });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  return PUT(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "delete", "campaign");
    if (denied) return denied;

    const { id } = await ctx.params;
    const campaign = await db.campaign.findFirst({
      where: { id, userId: user.id },
      select: { id: true, status: true },
    });
    if (!campaign) throw new ApiError(404, "ไม่พบแคมเปญ");
    if (!EDITABLE_CAMPAIGN_STATUSES.has(campaign.status)) {
      throw new ApiError(400, "ลบได้เฉพาะแคมเปญที่ยังไม่เริ่มส่ง");
    }

    await db.$transaction(async (tx) => {
      await tx.campaignMessage.deleteMany({ where: { campaignId: campaign.id } });
      await tx.message.updateMany({
        where: { campaignId: campaign.id },
        data: { campaignId: null },
      });
      await tx.shortLink.updateMany({
        where: { campaignId: campaign.id },
        data: { campaignId: null },
      });
      await tx.campaign.delete({ where: { id: campaign.id } });
    });

    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
