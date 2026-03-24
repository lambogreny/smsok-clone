import { prisma as db } from "../db";
import { revalidatePath } from "next/cache";
import { idSchema } from "../validations";
import { ApiError } from "../api-auth";

// ==========================================
// Get active package tiers from DB (for pricing page)
// ==========================================

export async function getPackageTiers() {
  return db.packageTier.findMany({
    where: { isActive: true, isTrial: false },
    orderBy: { sortOrder: "asc" },
  });
}

export async function uploadSlip(_userId: string, _transactionId: string, _slipRef: string) {
  throw new Error("Legacy slip upload was removed. Use the multipart R2 upload routes instead.");
}

// ==========================================
// Admin: Verify/Reject transaction
// ==========================================

export async function adminVerifyTransaction(
  adminUserId: string,
  transactionId: string,
  action: "verify" | "reject",
  rejectNote?: string,
) {
  void rejectNote;
  idSchema.parse({ id: transactionId });

  const admin = await db.adminUser.findUnique({
    where: { id: adminUserId },
    select: { id: true, isActive: true },
  });
  if (!admin?.isActive) {
    throw new ApiError(403, "ไม่มีสิทธิ์ผู้ดูแลระบบ", "ADMIN_FORBIDDEN");
  }

  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
  });
  if (!transaction) throw new Error("ไม่พบรายการ");
  if (transaction.status !== "pending") throw new Error("รายการนี้ดำเนินการแล้ว");

  if (action === "verify") {
    await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "verified",
          verifiedAt: new Date(),
          verifiedBy: adminUserId,
        },
      });

      if (transaction.packageId) {
        await tx.packagePurchase.updateMany({
          where: { userId: transaction.userId, tierId: transaction.packageId, isActive: false },
          data: { isActive: true },
        });
      }
    });
  } else {
    await db.transaction.update({
      where: { id: transactionId },
      data: { status: "rejected", verifiedBy: adminUserId },
    });
  }

  revalidatePath("/admin/transactions");
}

// ==========================================
// Get user transactions
// ==========================================

export async function getUserTransactions(userId: string) {
  return db.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// ==========================================
// Admin: Get pending transactions
// ==========================================

export async function adminGetPendingTransactions() {
  return db.transaction.findMany({
    where: { status: "pending", slipUrl: { not: null } },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function verifyPackagePurchaseSlip(_userId: string, _payload: string) {
  throw new Error("Legacy base64 slip verification was removed. Use /api/v1/payments/topup/verify-slip with multipart/form-data.");
}

export async function verifyTopupSlip(userId: string, payload: string) {
  return verifyPackagePurchaseSlip(userId, payload);
}
