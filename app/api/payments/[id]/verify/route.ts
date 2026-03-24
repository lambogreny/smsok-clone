import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { verifySlipByUrl } from "@/lib/easyslip";
import { ensurePaymentDocumentNumber } from "@/lib/payments/documents";
import { resolveStoredFileVerificationUrl } from "@/lib/storage/service";

type Ctx = { params: Promise<{ id: string }> };

type ReceiverAccountError =
  | "receiver_account_missing"
  | "receiver_verification_unavailable"
  | "receiver_mismatch";

import { Prisma } from "@prisma/client";
import { COMPANY_ACCOUNT_DIGITS } from "@/lib/constants/bank-account";

const RECEIVER_ACCOUNTS = [
  COMPANY_ACCOUNT_DIGITS,
  ...[process.env.KBANK_ACCOUNT, process.env.SCB_ACCOUNT]
    .filter(Boolean)
    .map((account) => account!.replace(/\D/g, "")),
];

function checkReceiverAccount(account: string | null | undefined): {
  matches: boolean;
  error: ReceiverAccountError | null;
  note: string | null;
} {
  if (!account) {
    return {
      matches: false,
      error: "receiver_account_missing",
      note: "Receiver account missing from slip payload",
    };
  }

  if (RECEIVER_ACCOUNTS.length === 0) {
    return {
      matches: false,
      error: "receiver_verification_unavailable",
      note: "Receiver account verification unavailable",
    };
  }

  const normalized = account.replace(/\D/g, "");
  if (!RECEIVER_ACCOUNTS.includes(normalized)) {
    return {
      matches: false,
      error: "receiver_mismatch",
      note: "Receiver account mismatch",
    };
  }

  return {
    matches: true,
    error: null,
    note: null,
  };
}

function buildVerifyResponse(data: {
  id: string;
  status: string;
  verified: boolean;
  error: string | null;
  amount?: number | null;
  bank?: string | null;
  date?: Date | null;
  invoiceNumber?: string | null;
  invoiceUrl?: string | null;
}) {
  return {
    id: data.id,
    paymentId: data.id,
    status: data.status,
    verified: data.verified,
    error: data.error,
    amount: data.amount ?? null,
    bank: data.bank ?? null,
    date: data.date ?? null,
    invoiceNumber: data.invoiceNumber ?? null,
    invoiceUrl: data.invoiceUrl ?? null,
  };
}

async function rollbackProcessingPayment(paymentId: string, note: string) {
  try {
    const rollback = await db.payment.updateMany({
      where: { id: paymentId, status: "PROCESSING" },
      data: { status: "PENDING" },
    });

    if (rollback.count > 0) {
      await db.paymentHistory.create({
        data: {
          paymentId,
          fromStatus: "PROCESSING",
          toStatus: "PENDING",
          changedBy: "system",
          note,
        },
      });
    }
  } catch (rollbackError) {
    console.error("[payments/verify rollback]", rollbackError);
  }
}

async function claimPendingPaymentForVerification(paymentId: string, userId: string) {
  return db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
    const claimedPayment = await tx.payment.updateMany({
      where: { id: paymentId, userId, status: "PENDING" },
      data: { status: "PROCESSING" },
    });

    if (claimedPayment.count !== 1) {
      return false;
    }

    await tx.paymentHistory.create({
      data: {
        paymentId,
        fromStatus: "PENDING",
        toStatus: "PROCESSING",
        changedBy: "system",
        note: "EasySlip verifying",
      },
    });

    return true;
  });
}

// POST /api/payments/:id/verify — trigger EasySlip verification
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const { id } = await ctx.params;

    const payment = await db.payment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        status: true,
        slipUrl: true,
        totalAmount: true,
        netPayAmount: true,
        hasWht: true,
        whtCertUrl: true,
        expiresAt: true,
        packageTierId: true,
        invoiceNumber: true,
      },
    });

    if (!payment) throw new ApiError(404, "ไม่พบรายการชำระเงิน");
    if (payment.userId !== session.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง");
    if (
      payment.status === "PENDING" &&
      payment.expiresAt &&
      payment.expiresAt.getTime() <= Date.now()
    ) {
      await db.$transaction([
        db.payment.update({
          where: { id },
          data: { status: "EXPIRED" },
        }),
        db.paymentHistory.create({
          data: {
            paymentId: id,
            fromStatus: "PENDING",
            toStatus: "EXPIRED",
            changedBy: "system",
            note: "Payment expired before verification",
          },
        }),
      ]);
      throw new ApiError(400, "รายการชำระเงินหมดอายุแล้ว");
    }

    if (!payment.slipUrl) throw new ApiError(400, "กรุณาอัปโหลดสลิปก่อน");
    if (payment.hasWht && !payment.whtCertUrl) {
      throw new ApiError(400, "กรุณาแนบไฟล์หนังสือรับรองหักภาษี ณ ที่จ่าย (50 ทวิ)");
    }
    if (payment.status !== "PENDING") throw new ApiError(400, "สถานะไม่อนุญาตให้ตรวจสอบ");

    const claimedForVerification = await claimPendingPaymentForVerification(id, session.id);
    if (!claimedForVerification) {
      const latestPayment = await db.payment.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          status: true,
          easyslipAmount: true,
          easyslipBank: true,
          easyslipDate: true,
          invoiceNumber: true,
          invoiceUrl: true,
        },
      });

      if (!latestPayment) throw new ApiError(404, "ไม่พบรายการชำระเงิน");
      if (latestPayment.userId !== session.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง");

      return apiResponse(
        buildVerifyResponse({
          id: latestPayment.id,
          status: latestPayment.status,
          verified: latestPayment.status === "COMPLETED",
          error: latestPayment.status === "COMPLETED" ? null : "already_processing",
          amount: latestPayment.easyslipAmount,
          bank: latestPayment.easyslipBank,
          date: latestPayment.easyslipDate,
          invoiceNumber: latestPayment.invoiceNumber,
          invoiceUrl: latestPayment.invoiceUrl,
        }),
        409,
      );
    }

    try {
      const verificationSource = await resolveStoredFileVerificationUrl(payment.slipUrl);
      const result = await verifySlipByUrl(verificationSource);

      const easyslipData = {
        easyslipVerified: result.success,
        easyslipResponse: result as unknown as Prisma.InputJsonValue,
        easyslipAmount: result.data ? Math.round(result.data.amount * 100) : null,
        easyslipBank: result.data?.receiver?.bank ?? null,
        easyslipDate: result.data?.date ? new Date(result.data.date) : null,
      };

      if (result.success && result.data) {
        const slipData = result.data;
        const detectedSatang = Math.round(slipData.amount * 100);
        const expectedSatang = payment.netPayAmount ?? payment.totalAmount ?? 0;
        const amountMatch = Math.abs(detectedSatang - expectedSatang) <= 100;
        const receiverCheck = checkReceiverAccount(slipData.receiver.account);
        const duplicateSlip = await db.payment.findFirst({
          where: {
            id: { not: id },
            idempotencyKey: slipData.transRef,
          },
          select: { id: true },
        });

        if (duplicateSlip) {
          const updated = await db.payment.update({
            where: { id },
            data: {
              ...easyslipData,
              status: "PENDING_REVIEW",
            },
            select: {
              id: true,
              status: true,
              easyslipAmount: true,
              easyslipBank: true,
              easyslipDate: true,
            },
          });

          await db.paymentHistory.create({
            data: {
              paymentId: id,
              fromStatus: "PROCESSING",
              toStatus: "PENDING_REVIEW",
              changedBy: "system",
              note: `Duplicate slip reference: ${slipData.transRef} already used by ${duplicateSlip.id}`,
            },
          });

          return apiResponse(
            buildVerifyResponse({
              id: updated.id,
              status: updated.status,
              verified: false,
              error: "duplicate_reference",
              amount: updated.easyslipAmount,
              bank: updated.easyslipBank,
              date: updated.easyslipDate,
            }),
          );
        }

        if (amountMatch && receiverCheck.matches) {
          const updated = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
            const invoiceNumber =
              payment.invoiceNumber ?? (await ensurePaymentDocumentNumber(id, "invoice", tx));
            const invoiceUrl = `/api/payments/${id}/invoice?download=1`;

            const paymentUpdated = await tx.payment.update({
              where: { id },
              data: {
                ...easyslipData,
                status: "COMPLETED",
                paidAt: new Date(),
                idempotencyKey: slipData.transRef,
                invoiceNumber,
                invoiceUrl,
              },
              select: {
                id: true,
                status: true,
                paidAt: true,
                easyslipAmount: true,
                easyslipBank: true,
                easyslipDate: true,
                invoiceNumber: true,
                invoiceUrl: true,
              },
            });

            await tx.paymentHistory.create({
              data: {
                paymentId: id,
                fromStatus: "PROCESSING",
                toStatus: "COMPLETED",
                changedBy: "system",
                note: "EasySlip verified — amount and receiver matched",
              },
            });

            if (payment.packageTierId) {
              const tier = await tx.packageTier.findUnique({
                where: { id: payment.packageTierId },
                select: { totalSms: true, expiryMonths: true },
              });

              if (tier) {
                const expiresAt = new Date();
                expiresAt.setMonth(expiresAt.getMonth() + tier.expiryMonths);
                const existingPurchase = await tx.packagePurchase.findFirst({
                  where: { transactionId: payment.id },
                  select: { id: true },
                });

                if (!existingPurchase) {
                  await tx.packagePurchase.create({
                    data: {
                      userId: payment.userId,
                      organizationId: payment.organizationId,
                      tierId: payment.packageTierId,
                      smsTotal: tier.totalSms,
                      expiresAt,
                      isActive: true,
                      transactionId: payment.id,
                    },
                  });
                }
              }
            }

            return paymentUpdated;
          });

          return apiResponse(
            buildVerifyResponse({
              ...updated,
              verified: true,
              error: null,
              amount: updated.easyslipAmount,
              bank: updated.easyslipBank,
              date: updated.easyslipDate,
              invoiceNumber: updated.invoiceNumber,
              invoiceUrl: updated.invoiceUrl,
            }),
          );
        }

        const reviewError = amountMatch ? receiverCheck.error : "amount_mismatch";
        const reviewNote = amountMatch
          ? receiverCheck.note ?? "Receiver account verification failed"
          : `Amount mismatch: expected ${expectedSatang}, got ${detectedSatang}`;

        const updated = await db.payment.update({
          where: { id },
          data: {
            ...easyslipData,
            status: "PENDING_REVIEW",
            ...(duplicateSlip ? {} : { idempotencyKey: slipData.transRef }),
          },
          select: {
            id: true,
            status: true,
            easyslipAmount: true,
            easyslipBank: true,
            easyslipDate: true,
          },
        });

        await db.paymentHistory.create({
          data: {
            paymentId: id,
            fromStatus: "PROCESSING",
            toStatus: "PENDING_REVIEW",
            changedBy: "system",
            note: reviewNote,
          },
        });

        return apiResponse(
          buildVerifyResponse({
            id: updated.id,
            status: updated.status,
            verified: false,
            error: reviewError,
            amount: updated.easyslipAmount,
            bank: updated.easyslipBank,
            date: updated.easyslipDate,
          }),
        );
      }

      const newStatus: "FAILED" | "PENDING_REVIEW" =
        result.error === "fake" ? "FAILED" : "PENDING_REVIEW";
      const updated = await db.payment.update({
        where: { id },
        data: { ...easyslipData, status: newStatus },
        select: { id: true, status: true },
      });

      await db.paymentHistory.create({
        data: {
          paymentId: id,
          fromStatus: "PROCESSING",
          toStatus: newStatus,
          changedBy: "system",
          note: `EasySlip: ${result.error ?? "verification failed"}`,
        },
      });

      return apiResponse(
        buildVerifyResponse({
          id: updated.id,
          status: updated.status,
          verified: false,
          error: result.error ?? "unreadable",
        }),
      );
    } catch (error) {
      const note =
        error instanceof Error
          ? `EasySlip verification failed unexpectedly: ${error.message}`
          : "EasySlip verification failed unexpectedly";
      await rollbackProcessingPayment(id, note);
      throw error;
    }
  } catch (error) {
    return apiError(error);
  }
}
