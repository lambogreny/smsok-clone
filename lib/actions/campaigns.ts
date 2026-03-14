"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma as db } from "../db";
import { createCampaignSchema, paginationSchema, normalizePhone } from "../validations";
import { sendSmsBatch } from "../sms-gateway";
import {
  deductQuota,
  refundQuotaIfEligible,
  calculateSmsSegments,
  ensureSufficientQuota,
} from "../package/quota";
import { assertSendingHours } from "../sending-hours";
import { resolveActionUserId } from "../action-user";

const campaignFilterSchema = paginationSchema.extend({
  status: z.string().trim().min(1).max(30).optional(),
});

type ExecuteCampaignResult = {
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  creditUsed: number;
  creditRefunded: number;
};

type CampaignProgressResult = {
  status: string;
  sentCount: number;
  failedCount: number;
  deliveredCount: number;
  totalRecipients: number;
  creditUsed: number;
};

export async function getCampaigns(userId: string, filters?: unknown) {
  userId = await resolveActionUserId(userId);
  const pagination = filters
    ? campaignFilterSchema.parse(filters)
    : { page: 1, limit: 20, status: undefined };
  const skip = (pagination.page - 1) * pagination.limit;
  const where = {
    userId,
    ...(pagination.status
      ? { status: { equals: pagination.status, mode: "insensitive" as const } }
      : {}),
  };

  const [campaigns, total] = await db.$transaction([
    db.campaign.findMany({
      where,
      include: {
        contactGroup: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pagination.limit,
    }),
    db.campaign.count({ where }),
  ]);

  return {
    campaigns,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function createCampaign(data: unknown): Promise<Awaited<ReturnType<typeof db.campaign.create>>>;
export async function createCampaign(userId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.campaign.create>>>;
export async function createCampaign(userIdOrData: string | unknown, maybeData?: unknown) {
  const userId = await resolveActionUserId(
    maybeData === undefined ? undefined : userIdOrData as string,
  );
  const payload = (maybeData === undefined ? userIdOrData : maybeData) && typeof (maybeData === undefined ? userIdOrData : maybeData) === "object"
    ? (maybeData === undefined ? userIdOrData : maybeData) as Record<string, unknown>
    : {};
  const input = createCampaignSchema.parse({
    ...payload,
    contactGroupId: payload.contactGroupId || undefined,
    templateId: payload.templateId || undefined,
    scheduledAt: payload.scheduledAt || undefined,
  });

  let totalRecipients = 0;

  if (input.contactGroupId) {
    const group = await db.contactGroup.findFirst({
      where: { id: input.contactGroupId, userId },
      include: { _count: { select: { members: true } } },
    });
    if (!group) throw new Error("ไม่พบกลุ่มรายชื่อ");
    totalRecipients = group._count.members;
  }

  if (input.templateId) {
    const template = await db.messageTemplate.findFirst({
      where: { id: input.templateId, userId },
      select: { id: true },
    });
    if (!template) throw new Error("ไม่พบเทมเพลตข้อความ");
  }

  if (input.senderName && input.senderName !== "EasySlip") {
    const sender = await db.senderName.findFirst({
      where: { userId, name: input.senderName, status: { in: ["APPROVED", "ACTIVE"] } },
      select: { id: true },
    });
    if (!sender) throw new Error("ชื่อผู้ส่งยังไม่ได้รับอนุมัติ");
  }

  await ensureSufficientQuota(userId, totalRecipients);

  const campaign = await db.campaign.create({
    data: {
      userId,
      name: input.name,
      contactGroupId: input.contactGroupId,
      templateId: input.templateId,
      senderName: input.senderName || "EasySlip",
      status: input.scheduledAt ? "scheduled" : "draft",
      scheduledAt: input.scheduledAt,
      totalRecipients,
      creditReserved: totalRecipients,
    },
    include: {
      contactGroup: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
    },
  });

  revalidatePath("/dashboard/campaigns");
  return campaign;
}

export async function executeCampaign(campaignId: string, orgId?: string): Promise<ExecuteCampaignResult>;
export async function executeCampaign(userId: string, campaignId: string, orgId?: string): Promise<ExecuteCampaignResult>;
export async function executeCampaign(...args: [string, string?, string?]) {
  // Detect 3-arg form via rest params length (works with Turbopack)
  const hasExplicitUserId = args.length >= 3;
  const [userIdOrCampaignId, campaignIdOrOrgId, maybeOrgId] = args;
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrCampaignId : undefined);
  const campaignId = hasExplicitUserId ? campaignIdOrOrgId as string : userIdOrCampaignId;
  const orgId = hasExplicitUserId ? maybeOrgId : campaignIdOrOrgId;
  // PDPA: Block marketing campaigns outside org-configured hours
  await assertSendingHours(orgId);

  // 1. Fetch campaign with contacts and template
  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, userId },
    include: {
      contactGroup: {
        include: {
          members: { include: { contact: { select: { id: true, phone: true } } } },
        },
      },
      template: { select: { content: true } },
    },
  });

  if (!campaign) throw new Error("ไม่พบแคมเปญ");
  if (campaign.status !== "draft" && campaign.status !== "scheduled") {
    throw new Error("แคมเปญนี้ไม่อยู่ในสถานะที่สามารถส่งได้");
  }
  if (!campaign.contactGroup) throw new Error("แคมเปญนี้ไม่มีกลุ่มรายชื่อ");
  if (!campaign.template) throw new Error("แคมเปญนี้ไม่มีเทมเพลตข้อความ");

  const phones = campaign.contactGroup.members.map((m) => m.contact.phone);
  if (phones.length === 0) throw new Error("กลุ่มรายชื่อไม่มีสมาชิก");

  const rawMessage = campaign.template.content;
  const senderName = campaign.senderName || "EasySlip";

  // Auto-shorten links + append UTM params
  const { shortenLinksInMessage } = await import("../link-shortener");
  const { text: message } = await shortenLinksInMessage(rawMessage, {
    userId,
    campaignId,
    campaignName: campaign.name,
  });

  const smsCount = calculateSmsSegments(message);
  const totalCredits = smsCount * phones.length;

  // 2. Check SMS quota
  await ensureSufficientQuota(userId, totalCredits);

  // 3. Mark as running + deduct quota + create messages
  let deductions: Array<{ purchaseId: string; amount: number }> = [];
  await db.$transaction(async (tx) => {
    await tx.campaign.update({
      where: { id: campaignId },
      data: { status: "running", startedAt: new Date() },
    });

    const result = await deductQuota(tx, userId, totalCredits);
    deductions = result.deductions;

    await tx.message.createMany({
      data: phones.map((phone) => ({
        userId,
        campaignId,
        recipient: normalizePhone(phone),
        content: message,
        senderName,
        creditCost: smsCount,
        status: "pending",
      })),
    });
  });

  // Fire campaign.started webhook (non-blocking)
  import("../webhook-dispatch").then(({ dispatchWebhookEvent }) => {
    dispatchWebhookEvent(userId, "campaign.started", {
      campaignId, campaignName: campaign.name, totalRecipients: phones.length,
    });
  }).catch(() => {});

  // 4. Send SMS in batches of 1000
  const normalizedPhones = phones.map(normalizePhone);
  let sentCount = 0;
  let failedCount = 0;
  const sentRecipients: string[] = [];
  const failedRecipients: string[] = [];

  for (let i = 0; i < normalizedPhones.length; i += 1000) {
    const batch = normalizedPhones.slice(i, i + 1000);
    try {
      const result = await sendSmsBatch({
        recipients: batch,
        message,
        sender: senderName,
      });
      if (result.success) {
        sentCount += batch.length;
        sentRecipients.push(...batch);
      } else {
        failedCount += batch.length;
        failedRecipients.push(...batch);
      }
    } catch {
      failedCount += batch.length;
      failedRecipients.push(...batch);
    }
  }

  // 5. Update message statuses
  if (sentRecipients.length > 0) {
    await db.message.updateMany({
      where: { campaignId, recipient: { in: sentRecipients }, status: "pending" },
      data: { status: "sent", sentAt: new Date() },
    });
  }
  if (failedRecipients.length > 0) {
    await db.message.updateMany({
      where: { campaignId, recipient: { in: failedRecipients }, status: "pending" },
      data: { status: "failed" },
    });
  }

  // 6. Refund failed SMS quota back to packages
  const refundCredits = smsCount * failedCount;
  const consumedCredits = smsCount * sentCount;

  if (failedCount > 0 && refundCredits > 0) {
    // Refund in reverse FIFO order (last deducted first) — tier D+ only
    let remainingRefund = refundCredits;
    await db.$transaction(async (tx) => {
      for (let i = deductions.length - 1; i >= 0 && remainingRefund > 0; i--) {
        const d = deductions[i];
        const refundAmount = Math.min(d.amount, remainingRefund);
        await refundQuotaIfEligible(tx, d.purchaseId, refundAmount);
        remainingRefund -= refundAmount;
      }
    });
  }

  // 7. Update campaign status + counts
  const finalStatus = failedCount === phones.length ? "failed" : "completed";
  await db.campaign.update({
    where: { id: campaignId },
    data: {
      status: finalStatus,
      sentCount,
      failedCount,
      creditUsed: consumedCredits,
      completedAt: new Date(),
    },
  });

  // 8. Fire webhook events
  const { dispatchWebhookEvent } = await import("../webhook-dispatch");
  const webhookData = {
    campaignId,
    campaignName: campaign.name,
    totalRecipients: phones.length,
    sentCount,
    failedCount,
    creditUsed: consumedCredits,
  };
  dispatchWebhookEvent(userId, finalStatus === "failed" ? "campaign.failed" : "campaign.completed", webhookData).catch(() => {});

  revalidatePath("/dashboard/campaigns");
  return {
    status: finalStatus,
    totalRecipients: phones.length,
    sentCount,
    failedCount,
    creditUsed: consumedCredits,
    creditRefunded: refundCredits,
  };
}

export async function getCampaignProgress(campaignId: string): Promise<CampaignProgressResult>;
export async function getCampaignProgress(userId: string, campaignId: string): Promise<CampaignProgressResult>;
export async function getCampaignProgress(userIdOrCampaignId: string, maybeCampaignId?: string) {
  const userId = await resolveActionUserId(
    maybeCampaignId === undefined ? undefined : userIdOrCampaignId,
  );
  const campaignId = maybeCampaignId ?? userIdOrCampaignId;
  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, userId },
    select: {
      status: true,
      totalRecipients: true,
      sentCount: true,
      deliveredCount: true,
      failedCount: true,
      creditUsed: true,
    },
  });

  if (!campaign) throw new Error("ไม่พบแคมเปญ");
  return campaign;
}
