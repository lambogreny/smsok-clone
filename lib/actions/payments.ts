"use server";

import { prisma as db } from "../db";
import { revalidatePath } from "next/cache";
import { idSchema } from "../validations";
import { verifySlipByUrl } from "../easyslip";

// ==========================================
// Get active packages from DB
// ==========================================

export async function getPackages() {
  return db.package.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
}

// Hardcoded fallback moved to lib/packages-data.ts (cannot export non-async from "use server")

// ==========================================
// Purchase package — create pending transaction
// ==========================================

export async function purchasePackage(
  userId: string,
  packageId: string,
  method: "bank_transfer" | "promptpay"
) {
  idSchema.parse({ id: packageId });

  const pkg = await db.package.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.isActive) throw new Error("ไม่พบแพ็กเกจ");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + pkg.durationDays);

  const transaction = await db.transaction.create({
    data: {
      userId,
      packageId: pkg.id,
      amount: pkg.price, // satang
      credits: pkg.totalCredits,
      method,
      status: "pending",
      expiresAt,
    },
  });

  revalidatePath("/dashboard/topup");
  return {
    transactionId: transaction.id,
    amount: pkg.price,
    credits: pkg.totalCredits,
    method,
    expiresAt,
  };
}

// ==========================================
// Upload slip for verification
// ==========================================

export async function uploadSlip(transactionId: string, slipUrl: string) {
  idSchema.parse({ id: transactionId });

  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
  });
  if (!transaction) throw new Error("ไม่พบรายการ");
  if (transaction.status !== "pending") throw new Error("รายการนี้ดำเนินการแล้ว");

  await db.transaction.update({
    where: { id: transactionId },
    data: { slipUrl },
  });

  // Auto-verify with EasySlip API
  const slipResult = await verifySlipByUrl(slipUrl);

  if (slipResult.success && slipResult.data) {
    const slipAmount = slipResult.data.amount * 100; // Convert baht to satang
    const expectedAmount = transaction.amount;

    // Verify amount matches (allow 1 satang tolerance)
    if (Math.abs(slipAmount - expectedAmount) <= 1) {
      // Check reference not already used
      const existingRef = await db.transaction.findFirst({
        where: {
          reference: slipResult.data.transRef,
          status: "verified",
          id: { not: transactionId },
        },
      });

      if (existingRef) {
        revalidatePath("/dashboard/topup");
        return { status: "rejected", transactionId, error: "สลิปนี้ถูกใช้ไปแล้ว" };
      }

      // Auto-approve: add credits
      await db.$transaction([
        db.transaction.update({
          where: { id: transactionId },
          data: {
            status: "verified",
            reference: slipResult.data.transRef,
            verifiedAt: new Date(),
            verifiedBy: "easyslip-auto",
          },
        }),
        db.user.update({
          where: { id: transaction.userId },
          data: { credits: { increment: transaction.credits } },
        }),
      ]);

      revalidatePath("/dashboard/topup");
      revalidatePath("/dashboard");
      return { status: "verified", transactionId, credits: transaction.credits };
    } else {
      // Amount mismatch — needs manual review
      await db.transaction.update({
        where: { id: transactionId },
        data: { reference: slipResult.data.transRef },
      });
    }
  }

  revalidatePath("/dashboard/topup");
  return { status: "pending_review", transactionId };
}

// ==========================================
// Admin: Verify/Reject transaction
// ==========================================

export async function adminVerifyTransaction(
  adminUserId: string,
  transactionId: string,
  action: "verify" | "reject",
  rejectNote?: string
) {
  idSchema.parse({ id: transactionId });

  // Verify admin role
  const admin = await db.user.findFirst({
    where: { id: adminUserId, role: "admin" },
  });
  if (!admin) throw new Error("Unauthorized — admin only");

  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
  });
  if (!transaction) throw new Error("ไม่พบรายการ");
  if (transaction.status !== "pending") throw new Error("รายการนี้ดำเนินการแล้ว");

  if (action === "verify") {
    await db.$transaction([
      db.transaction.update({
        where: { id: transactionId },
        data: {
          status: "verified",
          verifiedAt: new Date(),
          verifiedBy: adminUserId,
        },
      }),
      db.user.update({
        where: { id: transaction.userId },
        data: { credits: { increment: transaction.credits } },
      }),
    ]);
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
