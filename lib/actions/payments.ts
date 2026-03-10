"use server";

import { prisma as db } from "../db";
import type { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { idSchema } from "../validations";
import { verifySlipByBase64, verifySlipByUrl } from "../easyslip";
import { isObviouslyInternalUrl } from "../url-safety";

type DbTx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

type CreditLedgerEntry = {
  userId: string;
  amount: number;
  balance: number;
  type: "TOPUP" | "SMS_SEND" | "REFUND";
  description: string;
  refId?: string | null;
};

export async function createCreditLedgerEntry(tx: DbTx, entry: CreditLedgerEntry) {
  return tx.creditTransaction.create({
    data: {
      userId: entry.userId,
      amount: entry.amount,
      balance: entry.balance,
      type: entry.type,
      description: entry.description,
      refId: entry.refId ?? null,
    },
  });
}

// ==========================================
// Get active packages from DB
// PUBLIC endpoint — no auth required (for pricing page)
// ==========================================

export async function getPackages() {
  return db.package.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
}

export async function getCreditHistory(userId: string) {
  return db.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

// ==========================================
// Purchase package — create pending transaction
// ==========================================

export async function purchasePackage(
  userId: string,
  packageId: string,
  method: "bank_transfer" | "promptpay"
) {
  if (!packageId || typeof packageId !== "string") throw new Error("กรุณาเลือกแพ็กเกจ");

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

  // SSRF protection — block internal URLs
  if (isObviouslyInternalUrl(slipUrl)) {
    throw new Error("URL ไม่ถูกต้อง — ไม่อนุญาตให้ใช้ internal URL");
  }

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
    const slipData = slipResult.data;
    const slipAmount = Math.round(slipData.amount * 100); // Convert baht to satang (round to avoid float drift)
    const expectedAmount = Number(transaction.amount); // Ensure numeric comparison

    // Verify amount matches (allow 1 satang tolerance)
    if (Math.abs(slipAmount - expectedAmount) <= 1) {
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

      // Auto-approve: add credits
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

        const updatedUser = await tx.user.update({
          where: { id: transaction.userId },
          data: { credits: { increment: transaction.credits } },
          select: { credits: true },
        });

        await createCreditLedgerEntry(tx, {
          userId: transaction.userId,
          amount: transaction.credits,
          balance: updatedUser.credits,
          type: "TOPUP",
          description: `Topup verified from slip ${slipData.transRef}`,
          refId: transactionId,
        });
      });

      revalidatePath("/dashboard/topup");
      revalidatePath("/dashboard");
      return { status: "verified", transactionId, credits: transaction.credits };
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
    await db.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "verified",
          verifiedAt: new Date(),
          verifiedBy: adminUserId,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: transaction.userId },
        data: { credits: { increment: transaction.credits } },
        select: { credits: true },
      });

      await createCreditLedgerEntry(tx, {
        userId: transaction.userId,
        amount: transaction.credits,
        balance: updatedUser.credits,
        type: "TOPUP",
        description: `Topup approved by admin ${adminUserId}`,
        refId: transactionId,
      });
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
  const matchedPackage = await db.package.findFirst({
    where: { price: amountSatang, isActive: true },
    orderBy: { totalCredits: "desc" },
  });
  const creditsToAdd = matchedPackage
    ? matchedPackage.totalCredits
    : Math.max(1, Math.round(slipData.amount));

  const result = await db.$transaction(async (tx) => {
    const topupTransaction = await tx.transaction.create({
      data: {
        userId,
        packageId: matchedPackage?.id ?? null,
        amount: amountSatang,
        credits: creditsToAdd,
        method: "slip_verify",
        status: "verified",
        reference: slipData.transRef,
        verifiedAt: new Date(),
        verifiedBy: "easyslip-api",
        expiresAt: new Date(),
      },
    });

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: creditsToAdd } },
      select: { credits: true },
    });

    await createCreditLedgerEntry(tx, {
      userId,
      amount: creditsToAdd,
      balance: updatedUser.credits,
      type: "TOPUP",
      description: matchedPackage
        ? `Topup from verified slip for package ${matchedPackage.name}`
        : `Topup from verified slip amount ฿${slipData.amount.toFixed(2)}`,
      refId: topupTransaction.id,
    });

    return {
      transactionId: topupTransaction.id,
      reference: slipData.transRef,
      amount: slipData.amount,
      creditsAdded: creditsToAdd,
      creditsBalance: updatedUser.credits,
      matchedPackage: matchedPackage?.name ?? null,
    };
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/topup");
  return result;
}
