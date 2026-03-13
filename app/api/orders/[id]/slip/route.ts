import { Prisma } from "@prisma/client";
import { type SlipVerifyResult, verifySlipByUrl } from "@/lib/easyslip";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import {
  activateOrderPurchase,
  ensureOrderDocument,
  orderSummarySelect,
} from "@/lib/orders/api";
import { createOrderHistory, serializeOrderSlip, serializeOrderV2 } from "@/lib/orders/service";
import { applyRateLimit } from "@/lib/rate-limit";
import {
  removeStoredFile,
  resolveStoredFileVerificationUrl,
  StorageUploadError,
  storeUploadedFile,
} from "@/lib/storage/service";
import { coerceUploadedFile } from "@/lib/uploaded-file";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getManualReviewNote(verification: SlipVerifyResult, expectedAmount: number) {
  if (!verification.success) {
    return `EasySlip: ${verification.providerCode ?? verification.error ?? "verification pending manual review"}`;
  }

  if (!verification.data) {
    return "EasySlip: verification pending manual review";
  }

  return `EasySlip: amount mismatch (expected ${expectedAmount}, got ${verification.data.amount})`;
}

function getPendingReviewMessage(verification: SlipVerifyResult) {
  if (!verification.success) {
    if (verification.providerCode === "application_expired") {
      return "ระบบตรวจสอบสลิปอัตโนมัติไม่พร้อม กรุณารอเจ้าหน้าที่ตรวจสลิป";
    }

    return "กำลังรอเจ้าหน้าที่ตรวจสลิป";
  }

  return "ยอดสลิปต้องตรวจสอบเพิ่มเติมโดยเจ้าหน้าที่";
}

export async function POST(req: Request, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const rl = await applyRateLimit(session.id, "slip");
    if (rl.blocked) return rl.blocked;

    const { id } = await ctx.params;
    const order = await db.order.findFirst({
      where: { id, userId: session.id },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        packageTierId: true,
        smsCount: true,
        customerType: true,
        status: true,
        expiresAt: true,
        payAmount: true,
        hasWht: true,
        whtCertUrl: true,
      },
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");
    if (order.status === "EXPIRED" || order.expiresAt < new Date()) {
      throw new ApiError(400, "คำสั่งซื้อนี้หมดอายุแล้ว");
    }
    if (!["PENDING_PAYMENT", "VERIFYING"].includes(order.status)) {
      throw new ApiError(400, "คำสั่งซื้อนี้ไม่สามารถแนบสลิปได้");
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      throw new ApiError(400, "กรุณาแนบสลิป");
    }
    const slip = coerceUploadedFile(formData.get("slip"));
    const whtCert = coerceUploadedFile(formData.get("wht_cert"));

    if (!slip || slip.size === 0) {
      throw new ApiError(400, "กรุณาแนบสลิป");
    }
    if (!["image/jpeg", "image/png"].includes(slip.type)) {
      throw new ApiError(400, "รองรับเฉพาะไฟล์ JPEG หรือ PNG");
    }
    if (slip.size > 5 * 1024 * 1024) {
      throw new ApiError(400, "ไฟล์สลิปต้องไม่เกิน 5MB");
    }
    if (order.hasWht && (!whtCert || whtCert.size === 0) && !order.whtCertUrl) {
      throw new ApiError(400, "กรุณาแนบใบหัก ณ ที่จ่าย (50 ทวิ)");
    }
    if (whtCert && whtCert.size > 0) {
      if (!["image/jpeg", "image/png"].includes(whtCert.type)) {
        throw new ApiError(400, "รองรับเฉพาะไฟล์ใบหัก ณ ที่จ่ายแบบ JPEG หรือ PNG");
      }
      if (whtCert.size > 5 * 1024 * 1024) {
        throw new ApiError(400, "ไฟล์ใบหัก ณ ที่จ่ายต้องไม่เกิน 5MB");
      }
    }

    const uploadedSlip = await storeUploadedFile({
      userId: session.id,
      scope: "orders",
      resourceId: order.id,
      kind: "slips",
      file: slip,
    });
    const slipUrl = uploadedSlip.ref;
    const slipKey = uploadedSlip.key;
    const verificationUrl = await resolveStoredFileVerificationUrl(slipUrl);

    let uploadedWhtCert: { ref: string } | null = null;
    let whtCertUrl: string | null = order.whtCertUrl;
    if (whtCert && whtCert.size > 0) {
      uploadedWhtCert = await storeUploadedFile({
        userId: session.id,
        scope: "orders",
        resourceId: order.id,
        kind: "wht",
        file: whtCert,
      });
      whtCertUrl = uploadedWhtCert.ref;
    }

    const verification = await verifySlipByUrl(verificationUrl);
    const amountMatch =
      verification.success && verification.data
        ? Math.abs(verification.data.amount - Number(order.payAmount)) <= 1
        : false;

    const verificationData = verification.data;
    const autoApprove = Boolean(verification.success && verificationData && amountMatch);
    let result;
    try {
      result = await db.$transaction(async (tx) => {
        const createdSlip = await tx.orderSlip.create({
          data: {
            orderId: order.id,
            fileUrl: slipUrl,
            fileKey: slipKey,
            fileSize: slip.size,
            fileType: slip.type || "image/png",
          },
          select: {
            id: true,
            fileUrl: true,
            fileKey: true,
            fileSize: true,
            fileType: true,
            uploadedAt: true,
            verifiedAt: true,
            verifiedBy: true,
            deletedAt: true,
          },
        });

        if (!autoApprove) {
          const pendingReviewMessage = getPendingReviewMessage(verification);
          const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: {
              status: "VERIFYING",
              slipUrl,
              slipFileName: slip.name,
              slipFileSize: slip.size,
              whtCertUrl,
              whtCertVerified: whtCertUrl ? null : false,
              easyslipVerified: verification.success,
              easyslipResponse: verification as unknown as Prisma.InputJsonValue,
              adminNote: pendingReviewMessage,
              rejectReason: null,
              paidAt: null,
              completedAt: null,
            },
            select: orderSummarySelect,
          });

          const reviewNote = getManualReviewNote(verification, Number(order.payAmount));
          await createOrderHistory(tx, order.id, "VERIFYING", {
            fromStatus: order.status,
            changedBy: session.id,
            note: reviewNote,
          });

          return { createdSlip, updatedOrder, pendingReview: true, reviewNote };
        }

        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: "PAID",
            slipUrl,
            slipFileName: slip.name,
            slipFileSize: slip.size,
            whtCertUrl,
            whtCertVerified: whtCertUrl ? null : false,
            easyslipVerified: true,
            easyslipResponse: verificationData,
            adminNote: null,
            paidAt: new Date(),
            completedAt: new Date(),
          },
          select: orderSummarySelect,
        });

        await activateOrderPurchase(tx, {
          id: order.id,
          userId: order.userId,
          organizationId: order.organizationId,
          packageTierId: order.packageTierId,
          smsCount: order.smsCount,
        });
        if (order.customerType === "COMPANY") {
          await ensureOrderDocument(tx, order, "TAX_INVOICE");
        }
        await ensureOrderDocument(tx, order, "RECEIPT");

        await createOrderHistory(tx, order.id, "PAID", {
          fromStatus: order.status,
          changedBy: session.id,
          note: "EasySlip verified — order paid automatically",
        });

        return { createdSlip, updatedOrder, pendingReview: false, reviewNote: null };
      });
    } catch (error) {
      await Promise.allSettled([
        removeStoredFile(slipUrl),
        uploadedWhtCert ? removeStoredFile(uploadedWhtCert.ref) : Promise.resolve(),
      ]);
      throw error;
    }

    return apiResponse({
      ...serializeOrderV2(result.updatedOrder),
      latest_slip: serializeOrderSlip(result.createdSlip),
      verified: !result.pendingReview,
      pending_review: result.pendingReview,
      review_note: result.reviewNote ?? undefined,
    });
  } catch (error) {
    if (error instanceof StorageUploadError) {
      return apiError(new ApiError(503, "ระบบอัปโหลดไฟล์ยังไม่พร้อม กรุณาลองใหม่"));
    }
    return apiError(error);
  }
}
