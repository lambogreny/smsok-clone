"use server";

import { prisma as db } from "../db";
import { revalidatePath } from "next/cache";
import { requestSenderNameSchema, approveSenderNameSchema } from "../validations";

// ==========================================
// Request new sender name
// ==========================================

export async function requestSenderName(userId: string, data: unknown) {
  const input = requestSenderNameSchema.parse(data);

  // Check duplicate
  const existing = await db.senderName.findUnique({
    where: { userId_name: { userId, name: input.name } },
  });
  if (existing) {
    if (existing.status === "rejected") {
      throw new Error("ชื่อผู้ส่งนี้ถูกปฏิเสธแล้ว กรุณาใช้ชื่ออื่น");
    }
    throw new Error("ชื่อผู้ส่งนี้มีอยู่แล้ว");
  }

  const senderName = await db.senderName.create({
    data: { userId, name: input.name },
  });

  revalidatePath("/dashboard/senders");
  return senderName;
}

// ==========================================
// Get user's sender names
// ==========================================

export async function getSenderNames(userId: string) {
  return db.senderName.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// ==========================================
// Get approved sender names (for SMS form dropdown)
// ==========================================

export async function getApprovedSenderNames(userId: string) {
  return db.senderName.findMany({
    where: { userId, status: "approved" },
    select: { name: true },
    orderBy: { name: "asc" },
  });
}

// ==========================================
// Admin: Approve/Reject sender name
// ==========================================

export async function adminApproveSenderName(adminUserId: string, data: unknown) {
  const input = approveSenderNameSchema.parse(data);

  // Verify admin
  const admin = await db.user.findFirst({
    where: { id: adminUserId },
    select: { id: true },
  });
  if (!admin) throw new Error("Unauthorized");

  const senderName = await db.senderName.findUnique({
    where: { id: input.id },
  });
  if (!senderName) throw new Error("ไม่พบชื่อผู้ส่ง");
  if (senderName.status !== "pending") throw new Error("ชื่อผู้ส่งนี้ดำเนินการแล้ว");

  if (input.action === "approve") {
    await db.senderName.update({
      where: { id: input.id },
      data: { status: "approved", approvedAt: new Date(), approvedBy: adminUserId },
    });
  } else {
    await db.senderName.update({
      where: { id: input.id },
      data: { status: "rejected", rejectNote: input.rejectNote },
    });
  }

  revalidatePath("/admin/senders");
}

// ==========================================
// Admin: Get pending sender names
// ==========================================

export async function adminGetPendingSenderNames() {
  return db.senderName.findMany({
    where: { status: "pending" },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
