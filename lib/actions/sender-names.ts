"use server";

import { prisma as db } from "../db";
import { revalidatePath } from "next/cache";
import { ApiError } from "../api-auth";
import { getRemainingQuota } from "../package/quota";
import { requestSenderNameSchema, approveSenderNameSchema } from "../validations";
import { validateSenderName } from "../sender-name-validation";
import { resolveActionUserId } from "../action-user";
import { verifyAdminToken } from "../admin-auth";
import { cookies } from "next/headers";

const SENDER_NAME_QUOTA_STATUSES = [
  "PENDING",
  "REVIEWING",
  "SUBMITTED_TO_OPERATOR",
  "APPROVED",
  "ACTIVE",
] as const;

const SENDER_NAME_USABLE_STATUSES = ["APPROVED", "ACTIVE"] as const;

// ==========================================
// Request new sender name
// ==========================================

export async function requestSenderName(data: unknown): Promise<Awaited<ReturnType<typeof db.senderName.create>>>;
export async function requestSenderName(userId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.senderName.create>>>;
export async function requestSenderName(userIdOrData: string | unknown, maybeData?: unknown) {
  const userId = await resolveActionUserId(
    maybeData === undefined ? undefined : userIdOrData as string,
  );
  const input = requestSenderNameSchema.parse(maybeData === undefined ? userIdOrData : maybeData);

  // Validate against กสทช. rules
  const nameCheck = validateSenderName(input.name);
  if (!nameCheck.valid) {
    const reasons = nameCheck.checks.filter((c) => !c.passed).map((c) => c.message).join(", ");
    throw new Error(`ชื่อผู้ส่งไม่ผ่าน กสทช.: ${reasons}`);
  }

  // Check duplicate
  const existing = await db.senderName.findUnique({
    where: { userId_name: { userId, name: input.name } },
  });
  if (existing) {
    if (existing.status === "REJECTED") {
      throw new ApiError(409, "ชื่อผู้ส่งนี้ถูกปฏิเสธแล้ว กรุณาใช้ชื่ออื่น");
    }
    throw new ApiError(409, "ชื่อผู้ส่งนี้มีอยู่แล้ว");
  }

  const [quota, used] = await Promise.all([
    getRemainingQuota(userId),
    db.senderName.count({
      where: {
        userId,
        status: { in: [...SENDER_NAME_QUOTA_STATUSES] },
      },
    }),
  ]);

  if (quota.senderNameLimit !== null && used >= quota.senderNameLimit) {
    throw new ApiError(400, "เกินจำนวน Sender Name ที่อนุญาต");
  }

  let senderName;
  try {
    senderName = await db.$transaction(async (tx) => {
      const created = await tx.senderName.create({
        data: {
          userId,
          name: input.name,
          status: "PENDING",
          submittedAt: new Date(),
        },
      });

      await tx.senderNameHistory.create({
        data: {
          senderNameId: created.id,
          action: "submitted",
          fromStatus: "DRAFT",
          toStatus: "PENDING",
          performedBy: userId,
        },
      });

      return created;
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2002") {
      throw new ApiError(409, "ชื่อผู้ส่งนี้มีอยู่แล้ว");
    }
    throw error;
  }

  revalidatePath("/dashboard/senders");
  return senderName;
}

// ==========================================
// Get user's sender names
// ==========================================

export async function getSenderNames(): Promise<Awaited<ReturnType<typeof db.senderName.findMany>>>;
export async function getSenderNames(userId: string): Promise<Awaited<ReturnType<typeof db.senderName.findMany>>>;
export async function getSenderNames(userId?: string) {
  userId = await resolveActionUserId(userId);
  return db.senderName.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// ==========================================
// Get approved sender names (for SMS form dropdown)
// ==========================================

export async function getApprovedSenderNames(): Promise<Array<{ name: string }>>;
export async function getApprovedSenderNames(userId: string): Promise<Array<{ name: string }>>;
export async function getApprovedSenderNames(userId?: string) {
  userId = await resolveActionUserId(userId);
  return db.senderName.findMany({
    where: { userId, status: { in: [...SENDER_NAME_USABLE_STATUSES] } },
    select: { name: true },
    orderBy: { name: "asc" },
  });
}

// ==========================================
// Admin: Approve/Reject sender name
// ==========================================

export async function adminApproveSenderName(adminUserId: string, data: unknown) {
  // Validate admin session — prevent non-admin from calling this action
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("admin_session")?.value;
  if (!adminToken) throw new ApiError(401, "Admin authentication required");
  const adminPayload = verifyAdminToken(adminToken);
  if (!adminPayload || adminPayload.adminId !== adminUserId) {
    throw new ApiError(403, "ไม่มีสิทธิ์ดำเนินการนี้");
  }

  const input = approveSenderNameSchema.parse(data);

  // All reads + checks + writes inside $transaction to prevent TOCTOU
  await db.$transaction(async (tx) => {
    const senderName = await tx.senderName.findUnique({
      where: { id: input.id },
    });
    if (!senderName) throw new Error("ไม่พบชื่อผู้ส่ง");
    if (senderName.status !== "PENDING") throw new Error("ชื่อผู้ส่งนี้ดำเนินการแล้ว");

    if (input.action === "approve") {
      await tx.senderName.update({
        where: { id: input.id },
        data: { status: "APPROVED", approvedAt: new Date(), approvedBy: adminUserId },
      });
    } else {
      await tx.senderName.update({
        where: { id: input.id },
        data: { status: "REJECTED", rejectNote: input.rejectNote },
      });
    }
  });

  revalidatePath("/admin/senders");
}

// ==========================================
// Admin: Get pending sender names
// ==========================================

export async function adminGetPendingSenderNames() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("admin_session")?.value;
  if (!adminToken) throw new ApiError(401, "Admin authentication required");
  const adminPayload = verifyAdminToken(adminToken);
  if (!adminPayload) throw new ApiError(403, "ไม่มีสิทธิ์ดำเนินการนี้");

  return db.senderName.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
