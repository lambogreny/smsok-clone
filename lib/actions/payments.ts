
import { prisma as db } from "../db";
import { revalidatePath } from "next/cache";
import { idSchema } from "../validations";
import { verifySlipByBase64, verifySlipByUrl } from "../easyslip";
import { isObviouslyInternalUrl } from "../url-safety";

// ==========================================
// Get active package tiers from DB (for pricing page)
// ==========================================

export async function getPackageTiers() {
  return db.packageTier.findMany({
    where: { isActive: true, isTrial: false },
    orderBy: { sortOrder: "asc" },
  });
}

// ==========================================
// Upload slip for verification (package purchase)
// ==========================================

export async function uploadSlip(userId: string, transactionId: string, slipUrl: string) {
  idSchema.parse({ id: transactionId });

  // SSRF protection — block internal URLs
  if (isObviouslyInternalUrl(slipUrl)) {
    throw new Error("URL ไม่ถูกต้อง — ไม่อนุญาตให้ใช้ internal URL");
  }

  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
  });
  if (!transaction) throw new Error("ไม่พบรายการ");
  if (transaction.userId !== userId) throw new Error("ไม่มีสิทธิ์เข้าถึงรายการนี้");
  if (transaction.status !== "pending") throw new Error("รายการนี้ดำเนินการแล้ว");

  await db.transaction.update({
    where: { id: transactionId },
    data: { slipUrl },
  });

  // Auto-verify with EasySlip API
  const slipResult = await verifySlipByUrl(slipUrl);

  if (slipResult.success && slipResult.data) {
    const slipData = slipResult.data;
    const slipAmount = Math.round(slipData.amount * 100); // Convert baht to satang
    const expectedAmount = Number(transaction.amount);

    // Verify amount matches (allow ±1 baht = 100 satang tolerance)
    if (Math.abs(slipAmount - expectedAmount) <= 100) {
      // Check reference not already used
      const existingRef = await db.transaction.findFirst({
        where: {
          reference: slipData.transRef,
          status: "verified",
          id: { not: transactionId },
        },
      });

      if (existingRef) {
        revalidatePath("/dashboard/topup");
        return { status: "rejected", transactionId, error: "สลิปนี้ถูกใช้ไปแล้ว" };
      }

      // Auto-approve: activate package purchase
      await db.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: "verified",
            reference: slipData.transRef,
            verifiedAt: new Date(),
            verifiedBy: "easyslip-auto",
          },
        });

        // Activate the associated package purchase if exists
        if (transaction.packageId) {
          await tx.packagePurchase.updateMany({
            where: { userId: transaction.userId, tierId: transaction.packageId, isActive: false },
            data: { isActive: true },
          });
        }
      });

      revalidatePath("/dashboard/topup");
      revalidatePath("/dashboard");
      return { status: "verified", transactionId };
    } else {
      // Amount mismatch — needs manual review
      await db.transaction.update({
        where: { id: transactionId },
        data: { reference: slipData.transRef },
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
    await db.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "verified",
          verifiedAt: new Date(),
          verifiedBy: adminUserId,
        },
      });

      // Activate the associated package purchase if exists
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

export async function verifyTopupSlip(userId: string, payload: string) {
  if (!payload || typeof payload !== "string") {
    throw new Error("กรุณาแนบสลิปแบบ base64");
  }

  const slipResult = await verifySlipByBase64(payload);
  if (!slipResult.success || !slipResult.data) {
    throw new Error(slipResult.error || "ตรวจสอบสลิปไม่สำเร็จ");
  }
  const slipData = slipResult.data;

  const duplicate = await db.transaction.findFirst({
    where: {
      reference: slipData.transRef,
      status: "verified",
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new Error("สลิปนี้ถูกใช้ไปแล้ว");
  }

  const amountSatang = Math.round(slipData.amount * 100);

  // Match to a package tier by price
  const matchedTier = await db.packageTier.findFirst({
    where: { price: amountSatang, isActive: true, isTrial: false },
    orderBy: { totalSms: "desc" },
  });

  const result = await db.$transaction(async (tx) => {
    const topupTransaction = await tx.transaction.create({
      data: {
        userId,
        packageId: matchedTier?.id ?? null,
        amount: amountSatang,
        credits: 0, // legacy field
        method: "slip_verify",
        status: "verified",
        reference: slipData.transRef,
        verifiedAt: new Date(),
        verifiedBy: "easyslip-api",
        expiresAt: new Date(),
      },
    });

    // Create package purchase if matched
    if (matchedTier) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + matchedTier.expiryMonths);
      await tx.packagePurchase.create({
        data: {
          userId,
          tierId: matchedTier.id,
          smsTotal: matchedTier.totalSms,
          smsUsed: 0,
          expiresAt,
          isActive: true,
        },
      });
    }

    return {
      transactionId: topupTransaction.id,
      reference: slipData.transRef,
      amount: slipData.amount,
      matchedPackage: matchedTier?.name ?? null,
      smsAdded: matchedTier?.totalSms ?? 0,
    };
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/topup");
  return result;
}
