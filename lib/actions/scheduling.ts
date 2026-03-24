
import { prisma as db } from "../db";
import { z } from "zod";
import { randomUUID } from "node:crypto";

// ── Zod Schemas ─────────────────────────────────────────

export const scheduleCampaignInputSchema = z
  .object({
    name: z.string().min(1).max(200),
    recipients: z.array(z.string()).min(1).optional(),
    groupId: z.string().optional(),
    message: z.string().min(1),
    senderName: z.string().min(1),
    scheduledAt: z.string(), // ISO datetime
    timezone: z.string().default("Asia/Bangkok"),
    recurring: z
      .object({
        type: z.enum(["daily", "weekly", "monthly", "custom"]),
        cron: z.string().trim().min(1).optional(),
        endAfter: z.number().int().positive().optional(),
      })
      .superRefine((value, ctx) => {
        if (value.type === "custom" && !value.cron) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["cron"],
            message: "custom recurrence ต้องระบุ cron pattern",
          });
        }
      })
      .optional(),
  })
  .refine((data) => data.recipients || data.groupId, {
    message: "ต้องระบุ recipients หรือ groupId อย่างน้อยหนึ่งอย่าง",
  });

export const rescheduleCampaignInputSchema = z.object({
  scheduledAt: z.string().trim().min(1, "กรุณาระบุ scheduledAt"),
});

// ── Helpers ─────────────────────────────────────────────

function parseFutureDate(isoString: string): Date {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error("วันเวลาไม่ถูกต้อง");
  }
  if (date <= new Date()) {
    throw new Error("เวลาต้องเป็นอนาคต");
  }
  return date;
}

function recurringToCron(type: "daily" | "weekly" | "monthly" | "custom", date: Date, cron?: string): string {
  const minute = date.getUTCMinutes();
  const hour = date.getUTCHours();
  if (type === "custom" && cron) {
    return cron;
  }
  if (type === "daily") {
    return `${minute} ${hour} * * *`;
  }
  if (type === "weekly") {
    const dayOfWeek = date.getUTCDay();
    return `${minute} ${hour} * * ${dayOfWeek}`;
  }
  // monthly
  const dayOfMonth = date.getUTCDate();
  return `${minute} ${hour} ${dayOfMonth} * *`;
}

async function getCampaignQueue() {
  try {
    const { campaignQueue } = await import("@/lib/queue/queues");
    return campaignQueue;
  } catch {
    return null;
  }
}

// ── Schedule Campaign ───────────────────────────────────

export async function scheduleCampaign(userId: string, data: unknown) {
  const input = scheduleCampaignInputSchema.parse(data);
  const scheduledAt = parseFutureDate(input.scheduledAt);

  // Resolve recipients from group if groupId provided
  let recipients: string[] = input.recipients || [];

  if (input.groupId) {
    const group = await db.contactGroup.findFirst({
      where: { id: input.groupId, userId },
      include: {
        members: {
          include: { contact: { select: { phone: true } } },
        },
      },
    });
    if (!group) throw new Error("ไม่พบกลุ่มรายชื่อ");
    recipients = group.members.map((m: (typeof group.members)[number]) => m.contact.phone);
    if (recipients.length === 0) throw new Error("กลุ่มรายชื่อไม่มีสมาชิก");
  }

  const recipientCount = recipients.length;

  // Check package quota
  const { ensureSufficientQuota, calculateSmsSegments } = await import("../package/quota");

  const smsCount = calculateSmsSegments(input.message);
  const totalSms = smsCount * recipientCount;
  await ensureSufficientQuota(userId, totalSms);

  // Create campaign record
  const campaign = await db.campaign.create({
    data: {
      userId,
      name: input.name,
      contactGroupId: input.groupId || null,
      senderName: input.senderName,
      status: "scheduled",
      scheduledAt,
      totalRecipients: recipientCount,
      creditReserved: totalSms,
    },
  });

  // Add BullMQ delayed job
  const queue = await getCampaignQueue();
  if (queue) {
    const delay = scheduledAt.getTime() - Date.now();
    const jobId = `campaign-${campaign.id}`;
    const jobData = {
      id: randomUUID(),
      correlationId: randomUUID(),
      userId,
      type: "campaign" as const,
      recipients,
      message: input.message,
      sender: input.senderName,
      messageType: "thai" as const,
      campaignId: campaign.id,
      scheduledAt: scheduledAt.toISOString(),
    };

    if (input.recurring) {
      // Recurring: use BullMQ repeat with cron pattern
      const cron = recurringToCron(input.recurring.type, scheduledAt, input.recurring.cron);
      await queue.add("scheduled-campaign", jobData, {
        jobId,
        delay,
        repeat: {
          pattern: cron,
          ...(input.recurring.endAfter ? { limit: input.recurring.endAfter } : {}),
        },
      });
    } else {
      // One-time: use delayed job
      await queue.add("scheduled-campaign", jobData, {
        jobId,
        delay,
      });
    }
  }

  return {
    campaignId: campaign.id,
    scheduledAt: scheduledAt.toISOString(),
    recipientCount,
  };
}

// ── Cancel Scheduled Campaign ───────────────────────────

export async function cancelScheduledCampaign(
  userId: string,
  campaignId: string
) {
  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, userId },
  });

  if (!campaign) throw new Error("ไม่พบแคมเปญ");
  if (campaign.status !== "scheduled") {
    throw new Error("ยกเลิกได้เฉพาะแคมเปญที่ยังไม่ได้ส่ง");
  }

  await db.campaign.update({
    where: { id: campaignId },
    data: { status: "cancelled" },
  });

  // Best-effort: remove BullMQ job
  try {
    const queue = await getCampaignQueue();
    if (queue) {
      const jobId = `campaign-${campaignId}`;
      const job = await queue.getJob(jobId);
      if (job) await job.remove();
      // Also remove repeatable if exists
      await queue.removeRepeatableByKey(jobId).catch(() => {});
    }
  } catch {
    // best effort — job may already be processed
  }

  return { cancelled: true };
}

// ── Get Scheduled Campaigns ─────────────────────────────

export async function getScheduledCampaigns(
  userId: string,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const [campaigns, total] = await db.$transaction([
    db.campaign.findMany({
      where: { userId, status: "scheduled" },
      include: {
        contactGroup: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "asc" },
      skip,
      take: limit,
    }),
    db.campaign.count({ where: { userId, status: "scheduled" } }),
  ]);

  return {
    campaigns,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Reschedule Campaign ─────────────────────────────────

export async function reschedule(
  userId: string,
  campaignId: string,
  newScheduledAt: string
) {
  const scheduledAt = parseFutureDate(newScheduledAt);

  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, userId },
  });

  if (!campaign) throw new Error("ไม่พบแคมเปญ");
  if (campaign.status !== "scheduled") {
    throw new Error("แก้ไขเวลาได้เฉพาะแคมเปญที่ยังไม่ได้ส่ง");
  }

  const updated = await db.campaign.update({
    where: { id: campaignId },
    data: { scheduledAt },
    include: {
      contactGroup: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
    },
  });

  // Update BullMQ job: remove old, add new with updated delay
  try {
    const queue = await getCampaignQueue();
    if (queue) {
      const jobId = `campaign-${campaignId}`;
      const oldJob = await queue.getJob(jobId);
      const jobData = oldJob?.data;

      // Remove old job
      if (oldJob) await oldJob.remove();

      // Add new delayed job if we have data
      if (jobData) {
        const delay = scheduledAt.getTime() - Date.now();
        await queue.add("scheduled-campaign", {
          ...jobData,
          scheduledAt: scheduledAt.toISOString(),
        }, {
          jobId,
          delay,
        });
      }
    }
  } catch {
    // best effort — DB is source of truth
  }

  return updated;
}
