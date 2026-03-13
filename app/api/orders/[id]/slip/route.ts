import { Prisma } from "@prisma/client";
import { type SlipVerifyResult, type FileLike, verifySlip } from "@/lib/slipok";
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
  StorageUploadError,
  storeUploadedFile,
} from "@/lib/storage/service";
import { coerceUploadedFile } from "@/lib/uploaded-file";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getPendingReviewMessage(verification: SlipVerifyResult) {
  if (verification.providerCode === "application_expired") {
    return "ระบบตรวจสอบสลิปอัตโนมัติไม่พร้อม กรุณารอเจ้าหน้าที่ตรวจสลิป";
  }

  return "กำลังรอเจ้าหน้าที่ตรวจสลิป";
}

function shouldQueueForManualReview(verification: SlipVerifyResult) {
  if (verification.success || verification.isDuplicate) return false;

  const providerCode = verification.providerCode?.trim();
  return providerCode !== "1013" && providerCode !== "1014";
}

function getManualReviewNote(verification: SlipVerifyResult) {
  return `SlipOK: ${verification.error ?? verification.providerCode ?? "manual review required"}`;
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

    // Upload slip to R2 storage
    const uploadedSlip = await storeUploadedFile({
      userId: session.id,
      scope: "orders",
      resourceId: order.id,
      kind: "slips",
      file: slip,
    });
    const slipUrl = uploadedSlip.ref;
    const slipKey = uploadedSlip.key;

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

    const cleanupUploads = async () => {
      await Promise.allSettled([
        removeStoredFile(slipUrl),
        uploadedWhtCert ? removeStoredFile(uploadedWhtCert.ref) : Promise.resolve(),
      ]);
    };

    // Verify slip via SlipOK — sends the original file directly
    // SlipOK handles duplicate check (1012), amount check (1013), receiver check (1014)
    const expectedAmount = Number(order.payAmount);
    const slipBlob = new Blob([await slip.arrayBuffer()], {
      type: slip.type || "application/octet-stream",
    });
    const verification = await verifySlip(slipBlob);

    // SlipOK returned a known error — reject immediately
    if (verification.isDuplicate) {
      await cleanupUploads();
      throw new ApiError(400, "สลิปนี้ถูกใช้แล้ว");
    }
    if (shouldQueueForManualReview(verification)) {
      const pendingReviewMessage = getPendingReviewMessage(verification);
      const reviewNote = getManualReviewNote(verification);
      const result = await db.$transaction(async (tx) => {
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
            transRef: true,
            fileSize: true,
            fileType: true,
            uploadedAt: true,
            verifiedAt: true,
            verifiedBy: true,
            deletedAt: true,
          },
        });

        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: "VERIFYING",
            slipUrl,
            slipFileName: slip.name,
            slipFileSize: slip.size,
            whtCertUrl,
            whtCertVerified: whtCertUrl ? null : false,
            easyslipVerified: false,
            easyslipResponse: verification as unknown as Prisma.InputJsonValue,
            adminNote: pendingReviewMessage,
            rejectReason: null,
            paidAt: null,
            completedAt: null,
          },
          select: orderSummarySelect,
        });

        await createOrderHistory(tx, order.id, "VERIFYING", {
          fromStatus: order.status,
          changedBy: session.id,
          note: reviewNote,
        });

        return { createdSlip, updatedOrder, reviewNote, statusNote: pendingReviewMessage };
      });

      return apiResponse({
        ...serializeOrderV2(result.updatedOrder),
        latest_slip: serializeOrderSlip(result.createdSlip),
        latest_slip_uploaded_at: result.createdSlip.uploadedAt.toISOString(),
        latest_status_note: result.statusNote,
        review_note: result.reviewNote,
        verified: false,
        pending_review: true,
      });
    }
    if (!verification.success) {
      await cleanupUploads();
      throw new ApiError(400, verification.error ?? "ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่");
    }

    // SlipOK verified successfully — check our own DB for duplicate transRef
    const verificationData = verification.data!;
    const amountDifference = Math.abs(verificationData.amount - expectedAmount);
    if (amountDifference > 1) {
      await cleanupUploads();
      throw new ApiError(400, "จำนวนเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ");
    }
    const duplicateSlip = await db.orderSlip.findFirst({
      where: { transRef: verificationData.transRef },
      select: { id: true },
    });
    if (duplicateSlip) {
      await cleanupUploads();
      throw new ApiError(400, "สลิปนี้ถูกใช้แล้ว");
    }

    // All checks passed — mark order as PAID immediately
    const approvalNote = amountDifference > 0
      ? "SlipOK verified — order paid automatically within ±1 THB tolerance"
      : "SlipOK verified — order paid automatically";
    let result;
    try {
      result = await db.$transaction(async (tx) => {
        const createdSlip = await tx.orderSlip.create({
          data: {
            orderId: order.id,
            fileUrl: slipUrl,
            fileKey: slipKey,
            transRef: verificationData.transRef,
            fileSize: slip.size,
            fileType: slip.type || "image/png",
          },
          select: {
            id: true,
            fileUrl: true,
            fileKey: true,
            transRef: true,
            fileSize: true,
            fileType: true,
            uploadedAt: true,
            verifiedAt: true,
            verifiedBy: true,
            deletedAt: true,
          },
        });

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
            easyslipResponse: verificationData as unknown as Prisma.InputJsonValue,
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
          note: approvalNote,
        });

        return { createdSlip, updatedOrder, statusNote: approvalNote };
      });
    } catch (error) {
      await cleanupUploads();
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.join(",")
          : String(error.meta?.target ?? "");
        if (target.includes("trans_ref") || target.includes("transRef")) {
          throw new ApiError(400, "สลิปนี้ถูกใช้แล้ว");
        }
      }
      throw error;
    }

    return apiResponse({
      ...serializeOrderV2(result.updatedOrder),
      latest_slip: serializeOrderSlip(result.createdSlip),
      latest_slip_uploaded_at: result.createdSlip.uploadedAt.toISOString(),
      latest_status_note: result.statusNote,
      verified: true,
      pending_review: false,
    });
  } catch (error) {
    if (error instanceof StorageUploadError) {
      return apiError(new ApiError(503, "ระบบอัปโหลดไฟล์ยังไม่พร้อม กรุณาลองใหม่"));
    }
    return apiError(error);
  }
}
