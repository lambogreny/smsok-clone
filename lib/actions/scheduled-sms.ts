
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";
import { sendSingleSms } from "@/lib/sms-gateway";
import {
  deductQuota,
  refundQuota,
  refundQuotaIfEligible,
  calculateSmsSegments,
  ensureSufficientQuota,
} from "../package/quota";
import { checkSendingHours } from "../sending-hours";
import { hasMarketingConsent } from "./consent";

const MAX_SCHEDULE_DAYS_AHEAD = 30;

type QuotaDeduction = { purchaseId: string; amount: number };

function getScheduledSmsJobId(scheduledSmsId: string) {
  return `scheduled-sms-${scheduledSmsId}`;
}

async function getScheduledSmsQueue() {
  try {
    const { scheduledQueue } = await import("@/lib/queue/queues");
    return scheduledQueue;
  } catch {
    return null;
  }
}

async function enqueueScheduledSmsJob(sms: {
  id: string;
  userId: string;
  recipient: string;
  content: string;
  senderName: string;
  scheduledAt: Date;
}) {
  const queue = await getScheduledSmsQueue();
  if (!queue) return;

  await queue.add(
    "scheduled-sms",
    {
      id: randomUUID(),
      correlationId: randomUUID(),
      userId: sms.userId,
      type: "scheduled",
      recipients: [sms.recipient],
      message: sms.content,
      sender: sms.senderName,
      messageType: "thai",
      scheduledAt: sms.scheduledAt.toISOString(),
      scheduledSmsId: sms.id,
    },
    {
      jobId: getScheduledSmsJobId(sms.id),
      delay: Math.max(0, sms.scheduledAt.getTime() - Date.now()),
    },
  );
}

async function removeScheduledSmsJob(scheduledSmsId: string) {
  const queue = await getScheduledSmsQueue();
  if (!queue) return;

  const job = await queue.getJob(getScheduledSmsJobId(scheduledSmsId));
  if (job) {
    await job.remove();
  }
}

export async function createScheduledSms(
  userId: string,
  data: {
    senderName: string;
    recipient: string;
    message: string;
    scheduledAt: string; // ISO 8601
    organizationId?: string | null;
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

  // Use caller-provided organizationId (from session context) or null
  const resolvedOrgId = data.organizationId ?? null;

  // HOLD: deduct quota now via FIFO, store deduction details for accurate refund
  const scheduled = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
    const quotaResult = await deductQuota(tx, userId, smsCount);

    const record = await tx.scheduledSms.create({
      data: {
        userId,
        organizationId: resolvedOrgId,
        senderName: data.senderName,
        recipient: data.recipient,
        content: data.message,
        scheduledAt,
        creditCost: smsCount,
        deductions: quotaResult.deductions,
      },
    });

    return record;
  });

  await enqueueScheduledSmsJob(scheduled).catch(() => {});

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

  // Cancel + REFUND quota using stored FIFO deductions
  await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
    await tx.scheduledSms.update({
      where: { id },
      data: { status: "cancelled" },
    });

    await refundStoredDeductions(tx, sms.deductions, sms.creditCost, sms.userId);
  });

  await removeScheduledSmsJob(id).catch(() => {});

  return { success: true, creditsRefunded: sms.creditCost };
}

/**
 * Refund using stored FIFO deductions (exact packages that were debited).
 * Falls back to first active package if deductions are missing (legacy records).
 */
async function refundStoredDeductions(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  deductionsJson: unknown,
  creditCost: number,
  userId: string,
) {
  const stored = parseDeductions(deductionsJson);
  if (stored.length > 0) {
    for (const d of stored) {
      await refundQuota(tx, d.purchaseId, d.amount);
    }
    return;
  }

  // Legacy fallback: refund to first active package
  const firstPackage = await tx.packagePurchase.findFirst({
    where: { userId, isActive: true, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "asc" },
    select: { id: true },
  });
  if (firstPackage) {
    await refundQuota(tx, firstPackage.id, creditCost);
  }
}

/**
 * Tier-gated refund using stored FIFO deductions.
 */
async function refundStoredDeductionsIfEligible(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  deductionsJson: unknown,
  creditCost: number,
  userId: string,
) {
  const stored = parseDeductions(deductionsJson);
  if (stored.length > 0) {
    for (const d of stored) {
      await refundQuotaIfEligible(tx, d.purchaseId, d.amount);
    }
    return;
  }

  // Legacy fallback
  const firstPackage = await tx.packagePurchase.findFirst({
    where: { userId, isActive: true, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "asc" },
    select: { id: true },
  });
  if (firstPackage) {
    await refundQuotaIfEligible(tx, firstPackage.id, creditCost);
  }
}

function parseDeductions(json: unknown): QuotaDeduction[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (d): d is QuotaDeduction =>
      typeof d === "object" && d !== null &&
      typeof (d as Record<string, unknown>).purchaseId === "string" &&
      typeof (d as Record<string, unknown>).amount === "number",
  );
}

export async function processScheduledSmsJob(scheduledSmsId: string) {
  const sms = await prisma.scheduledSms.findUnique({
    where: { id: scheduledSmsId },
  });

  if (!sms) {
    throw new Error("ไม่พบข้อความ");
  }

  if (sms.status !== "pending") {
    const status = sms.status === "sent" ? "sent" : sms.status === "failed" ? "failed" : "pending";
    return { smsId: sms.id, status: status as "pending" | "sent" | "failed", creditCost: sms.creditCost };
  }

  if (sms.scheduledAt > new Date()) {
    await enqueueScheduledSmsJob(sms).catch(() => {});
    return { smsId: sms.id, status: "pending" as const, creditCost: sms.creditCost };
  }

  const sendingHours = await checkSendingHours(sms.organizationId ?? undefined);
  if (!sendingHours.allowed) {
    const nextAllowedAt = sendingHours.nextAllowedAt ? new Date(sendingHours.nextAllowedAt) : new Date(Date.now() + 60 * 60 * 1000);
    await prisma.scheduledSms.update({
      where: { id: sms.id },
      data: { scheduledAt: nextAllowedAt, status: "pending" },
    });
    await enqueueScheduledSmsJob({ ...sms, scheduledAt: nextAllowedAt }).catch(() => {});
    return { smsId: sms.id, status: "pending" as const, creditCost: sms.creditCost };
  }

  const consented = await hasMarketingConsent(sms.userId);
  if (!consented) {
    await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      await tx.scheduledSms.update({
        where: { id: sms.id },
        data: { status: "failed", errorCode: "PDPA_NO_MARKETING_CONSENT" },
      });

      await refundStoredDeductions(tx, sms.deductions, sms.creditCost, sms.userId);
    });

    return { smsId: sms.id, status: "failed" as const, creditCost: 0 };
  }

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
      return { smsId: sms.id, status: "sent" as const, creditCost: sms.creditCost };
    }

    await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      await tx.scheduledSms.update({
        where: { id: sms.id },
        data: {
          status: "failed",
          errorCode: result.error?.slice(0, 100) || "unknown",
        },
      });

      await refundStoredDeductionsIfEligible(tx, sms.deductions, sms.creditCost, sms.userId);
    });

    return { smsId: sms.id, status: "failed" as const, creditCost: 0 };
  } catch (error) {
    await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      await tx.scheduledSms.update({
        where: { id: sms.id },
        data: {
          status: "failed",
          errorCode: error instanceof Error ? error.message.slice(0, 100) : "unknown",
        },
      });

      await refundStoredDeductionsIfEligible(tx, sms.deductions, sms.creditCost, sms.userId);
    });

    return { smsId: sms.id, status: "failed" as const, creditCost: 0 };
  }
}

/**
 * Process due scheduled messages — called by cron job
 * Finds all pending messages where scheduledAt <= now, sends them
 */
export async function processScheduledSms() {
  const now = new Date();

  const BATCH_SIZE = 50;
  const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

  // Recovery: reset stuck "processing" rows back to "pending".
  // If a previous cron crashed mid-processing, these rows would be stranded forever.
  const staleThreshold = new Date(now.getTime() - STALE_THRESHOLD_MS);
  await prisma.scheduledSms.updateMany({
    where: {
      status: "processing",
      updatedAt: { lt: staleThreshold },
    },
    data: { status: "pending" },
  });

  // Atomic claim via raw SQL: UPDATE ... WHERE ... LIMIT ... RETURNING
  // This is a single atomic operation — no race between SELECT and UPDATE.
  const claimed = await prisma.$queryRaw<Array<{ id: string }>>`
    UPDATE scheduled_sms
    SET status = 'processing', updated_at = NOW()
    WHERE id IN (
      SELECT id FROM scheduled_sms
      WHERE status = 'pending' AND scheduled_at <= ${now}
      ORDER BY scheduled_at ASC
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id
  `;

  if (claimed.length === 0) {
    return { processed: 0, sent: 0, failed: 0, rescheduled: false };
  }

  const claimedIds = claimed.map((r: { id: string }) => r.id);

  // Fetch full records for claimed rows
  const dueMessages = await prisma.scheduledSms.findMany({
    where: { id: { in: claimedIds }, status: "processing" },
  });

  // Group by orgId to check sending hours per-org
  const orgIds = [...new Set(dueMessages.map((m: (typeof dueMessages)[number]) => m.organizationId).filter(Boolean))] as string[];
  const blockedOrgs = new Set<string | null>();

  // Check default (no org) sending hours
  const defaultHours = await checkSendingHours();
  if (!defaultHours.allowed) blockedOrgs.add(null);

  // Check per-org sending hours
  for (const orgId of orgIds) {
    const orgHours = await checkSendingHours(orgId);
    if (!orgHours.allowed) blockedOrgs.add(orgId);
  }

  // Reschedule blocked messages — per-org nextAllowedAt, not one shared default
  const blockedMessages = dueMessages.filter((m: (typeof dueMessages)[number]) => blockedOrgs.has(m.organizationId));
  if (blockedMessages.length > 0) {
    // Build per-org nextAllowedAt map
    const orgNextAllowed = new Map<string | null, Date | null>();
    orgNextAllowed.set(null, defaultHours.nextAllowedAt ? new Date(defaultHours.nextAllowedAt) : null);
    for (const orgId of orgIds) {
      if (blockedOrgs.has(orgId)) {
        const orgHoursResult = await checkSendingHours(orgId);
        orgNextAllowed.set(orgId, orgHoursResult.nextAllowedAt ? new Date(orgHoursResult.nextAllowedAt) : null);
      }
    }
    // Reschedule each group by their org's next allowed time
    for (const [orgId, nextTime] of orgNextAllowed) {
      if (!nextTime) continue;
      const ids = blockedMessages.filter((m: (typeof blockedMessages)[number]) => m.organizationId === orgId).map((m: (typeof blockedMessages)[number]) => m.id);
      if (ids.length === 0) continue;
      await prisma.scheduledSms.updateMany({
        where: { id: { in: ids } },
        data: { scheduledAt: nextTime, status: "pending" },
      });
    }
  }

  // Only process messages from non-blocked orgs
  const allowedMessages = dueMessages.filter((m: (typeof dueMessages)[number]) => !blockedOrgs.has(m.organizationId));
  if (allowedMessages.length === 0) {
    return { processed: 0, sent: 0, failed: 0, rescheduled: blockedMessages.length > 0, nextAllowedAt: defaultHours.nextAllowedAt };
  }

  const results = { sent: 0, failed: 0, skippedConsent: 0 };

  for (const sms of allowedMessages) {
    try {
      // PDPA: Skip if user lacks marketing consent — UNCONDITIONAL refund held quota
      // (quota was deducted at schedule time; system blocked sending, not a delivery failure)
      const consented = await hasMarketingConsent(sms.userId);
      if (!consented) {
        try {
          await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
            await tx.scheduledSms.update({
              where: { id: sms.id },
              data: { status: "failed", errorCode: "PDPA_NO_MARKETING_CONSENT" },
            });

            await refundStoredDeductions(tx, sms.deductions, sms.creditCost, sms.userId);
          });
        } catch (refundErr) {
          // Critical: transaction failed — retry refund separately from status update
          console.error("[scheduled-sms] PDPA consent refund tx failed, retrying refund:", {
            smsId: sms.id,
            userId: sms.userId,
            creditCost: sms.creditCost,
            error: refundErr instanceof Error ? refundErr.message : String(refundErr),
          });

          // Retry: mark failed first, then attempt refund separately
          try {
            await prisma.scheduledSms.update({
              where: { id: sms.id },
              data: { status: "failed", errorCode: "PDPA_REFUND_FAILED" },
            });
          } catch (statusErr) {
            console.error("[scheduled-sms] Failed to update status after refund failure:", {
              smsId: sms.id,
              error: statusErr instanceof Error ? statusErr.message : String(statusErr),
            });
          }

          // Retry refund outside transaction
          try {
            await refundStoredDeductions(prisma, sms.deductions, sms.creditCost, sms.userId);
            // Refund succeeded on retry — update error code
            await prisma.scheduledSms.update({
              where: { id: sms.id },
              data: { errorCode: "PDPA_NO_MARKETING_CONSENT" },
            });
          } catch (retryErr) {
            console.error("[scheduled-sms] CRITICAL: PDPA refund retry failed, quota lost — needs manual recovery:", {
              smsId: sms.id,
              userId: sms.userId,
              creditCost: sms.creditCost,
              deductions: sms.deductions,
              error: retryErr instanceof Error ? retryErr.message : String(retryErr),
            });
          }
        }
        results.skippedConsent++;
        continue;
      }

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
        // REFUND on failure — tier D+ only, using stored deductions
        await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
          await tx.scheduledSms.update({
            where: { id: sms.id },
            data: {
              status: "failed",
              errorCode: result.error?.slice(0, 100) || "unknown",
            },
          });

          await refundStoredDeductionsIfEligible(tx, sms.deductions, sms.creditCost, sms.userId);
        });
        results.failed++;
      }
    } catch (err) {
      // REFUND on exception — tier D+ only, using stored deductions
      await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
        await tx.scheduledSms.update({
          where: { id: sms.id },
          data: {
            status: "failed",
            errorCode: err instanceof Error ? err.message.slice(0, 100) : "unknown",
          },
        });

        await refundStoredDeductionsIfEligible(tx, sms.deductions, sms.creditCost, sms.userId);
      });
      results.failed++;
    }
  }

  return { processed: dueMessages.length, ...results };
}
