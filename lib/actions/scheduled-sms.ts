
import { prisma } from "@/lib/db";
import { sendSingleSms } from "@/lib/sms-gateway";
import {
  deductQuota,
  refundQuota,
  refundQuotaIfEligible,
  getRemainingQuota,
  calculateSmsSegments,
  ensureSufficientQuota,
} from "../package/quota";
import { checkSendingHours } from "../sending-hours";

const MAX_SCHEDULE_DAYS_AHEAD = 30;

export async function createScheduledSms(
  userId: string,
  data: {
    senderName: string;
    recipient: string;
    message: string;
    scheduledAt: string; // ISO 8601
  }
) {
  const sender = await prisma.senderName.findFirst({
    where: { userId, name: data.senderName, status: { in: ["APPROVED", "ACTIVE"] } },
    select: { id: true },
  });
  if (!sender) {
    throw new Error("ชื่อผู้ส่งยังไม่ได้รับอนุมัติ");
  }

  // Validate phone
  if (!/^0[0-9]\d{8}$/.test(data.recipient)) {
    throw new Error("หมายเลขโทรศัพท์ไม่ถูกต้อง");
  }

  if (!data.message || data.message.length === 0) {
    throw new Error("กรุณาระบุข้อความ");
  }

  const scheduledAt = new Date(data.scheduledAt);
  const now = new Date();

  if (isNaN(scheduledAt.getTime())) {
    throw new Error("วันเวลาไม่ถูกต้อง");
  }

  if (scheduledAt <= now) {
    throw new Error("เวลาต้องเป็นอนาคต");
  }

  const maxDate = new Date(now.getTime() + MAX_SCHEDULE_DAYS_AHEAD * 24 * 60 * 60 * 1000);
  if (scheduledAt > maxDate) {
    throw new Error(`ตั้งเวลาล่วงหน้าได้ไม่เกิน ${MAX_SCHEDULE_DAYS_AHEAD} วัน`);
  }

  // Calculate SMS segment count (GSM-7: 160/153, UCS-2: 70/67)
  const smsCount = calculateSmsSegments(data.message);

  // Check remaining quota
  await ensureSufficientQuota(userId, smsCount);

  // HOLD: deduct quota now via FIFO
  const scheduled = await prisma.$transaction(async (tx) => {
    const record = await tx.scheduledSms.create({
      data: {
        userId,
        senderName: data.senderName,
        recipient: data.recipient,
        content: data.message,
        scheduledAt,
        creditCost: smsCount,
      },
    });

    await deductQuota(tx, userId, smsCount);

    return record;
  });

  return {
    id: scheduled.id,
    recipient: scheduled.recipient,
    scheduledAt: scheduled.scheduledAt.toISOString(),
    status: scheduled.status,
    creditCost: smsCount,
  };
}

export async function getScheduledSms(userId: string) {
  return prisma.scheduledSms.findMany({
    where: { userId },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      senderName: true,
      recipient: true,
      content: true,
      scheduledAt: true,
      status: true,
      creditCost: true,
      errorCode: true,
      createdAt: true,
    },
  });
}

export async function cancelScheduledSms(userId: string, id: string) {
  const sms = await prisma.scheduledSms.findUnique({ where: { id } });

  if (!sms || sms.userId !== userId) {
    throw new Error("ไม่พบข้อความ");
  }

  if (sms.status !== "pending") {
    throw new Error("ยกเลิกได้เฉพาะข้อความที่ยังไม่ได้ส่ง");
  }

  // Cancel + REFUND quota to first active package
  const quota = await getRemainingQuota(userId);
  const firstPackage = quota.packages[0];

  if (!firstPackage) {
    throw new Error("ไม่พบ package สำหรับคืน quota");
  }

  await prisma.$transaction(async (tx) => {
    await tx.scheduledSms.update({
      where: { id },
      data: { status: "cancelled" },
    });

    await refundQuota(tx, firstPackage.id, sms.creditCost);
  });

  return { success: true, creditsRefunded: sms.creditCost };
}

/**
 * Process due scheduled messages — called by cron job
 * Finds all pending messages where scheduledAt <= now, sends them
 */
export async function processScheduledSms() {
  const now = new Date();

  // Fetch due messages first, then check sending hours per-org
  const dueMessages = await prisma.scheduledSms.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: now },
    },
    take: 50, // batch size
  });

  if (dueMessages.length === 0) {
    return { processed: 0, sent: 0, failed: 0, rescheduled: false };
  }

  // Group by orgId to check sending hours per-org
  const orgIds = [...new Set(dueMessages.map((m) => m.organizationId).filter(Boolean))] as string[];
  const blockedOrgs = new Set<string | null>();

  // Check default (no org) sending hours
  const defaultHours = await checkSendingHours();
  if (!defaultHours.allowed) blockedOrgs.add(null);

  // Check per-org sending hours
  for (const orgId of orgIds) {
    const orgHours = await checkSendingHours(orgId);
    if (!orgHours.allowed) blockedOrgs.add(orgId);
  }

  // Reschedule blocked messages
  const blockedMessages = dueMessages.filter((m) => blockedOrgs.has(m.organizationId));
  if (blockedMessages.length > 0) {
    const nextAllowed = defaultHours.nextAllowedAt ? new Date(defaultHours.nextAllowedAt) : null;
    if (nextAllowed) {
      await prisma.scheduledSms.updateMany({
        where: { id: { in: blockedMessages.map((m) => m.id) } },
        data: { scheduledAt: nextAllowed },
      });
    }
  }

  // Only process messages from non-blocked orgs
  const allowedMessages = dueMessages.filter((m) => !blockedOrgs.has(m.organizationId));
  if (allowedMessages.length === 0) {
    return { processed: 0, sent: 0, failed: 0, rescheduled: blockedMessages.length > 0, nextAllowedAt: defaultHours.nextAllowedAt };
  }

  const results = { sent: 0, failed: 0 };

  for (const sms of allowedMessages) {
    try {
      const result = await sendSingleSms(sms.recipient, sms.content, sms.senderName);

      if (result.success) {
        await prisma.scheduledSms.update({
          where: { id: sms.id },
          data: {
            status: "sent",
            messageId: result.jobId || null,
          },
        });
        results.sent++;
      } else {
        // REFUND on failure — tier D+ only
        const quota = await getRemainingQuota(sms.userId);
        const firstPackage = quota.packages[0];

        await prisma.$transaction(async (tx) => {
          await tx.scheduledSms.update({
            where: { id: sms.id },
            data: {
              status: "failed",
              errorCode: result.error?.slice(0, 100) || "unknown",
            },
          });

          if (firstPackage) {
            await refundQuotaIfEligible(tx, firstPackage.id, sms.creditCost);
          }
        });
        results.failed++;
      }
    } catch (err) {
      // REFUND on exception — tier D+ only
      const quota = await getRemainingQuota(sms.userId);
      const firstPackage = quota.packages[0];

      await prisma.$transaction(async (tx) => {
        await tx.scheduledSms.update({
          where: { id: sms.id },
          data: {
            status: "failed",
            errorCode: err instanceof Error ? err.message.slice(0, 100) : "unknown",
          },
        });

        if (firstPackage) {
          await refundQuotaIfEligible(tx, firstPackage.id, sms.creditCost);
        }
      });
      results.failed++;
    }
  }

  return { processed: dueMessages.length, ...results };
}
