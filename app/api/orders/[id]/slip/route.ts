import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { orderSummarySelect } from "@/lib/orders/api";
import {
  SLIP_QUEUED_REVIEW_NOTE,
  SLIP_QUEUED_STATUS_NOTE,
} from "@/lib/orders/slip-verification";
import { createOrderHistory, serializeOrderSlip, serializeOrderV2 } from "@/lib/orders/service";
import { slipVerifyQueue } from "@/lib/queue/queues";
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

export async function POST(req: Request, ctx: RouteContext) {
  let slipUrl: string | null = null;
  let uploadedWhtCert: { ref: string } | null = null;
  let uploadsCleaned = false;

  const cleanupUploads = async () => {
    uploadsCleaned = true;
    await Promise.allSettled([
      slipUrl ? removeStoredFile(slipUrl) : Promise.resolve(),
      uploadedWhtCert ? removeStoredFile(uploadedWhtCert.ref) : Promise.resolve(),
    ]);
  };

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
        slipUrl: true,
        slipFileName: true,
        slipFileSize: true,
        whtCertUrl: true,
        whtCertVerified: true,
        easyslipVerified: true,
        easyslipResponse: true,
        adminNote: true,
        rejectReason: true,
        paidAt: true,
        completedAt: true,
      },
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");
    if (order.status === "EXPIRED" || order.expiresAt < new Date()) {
      throw new ApiError(400, "คำสั่งซื้อนี้หมดอายุแล้ว");
    }
    if (order.status === "VERIFYING") {
      throw new ApiError(409, "กำลังตรวจสอบสลิปอยู่ กรุณารอ");
    }
    if (order.status !== "PENDING_PAYMENT") {
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
    slipUrl = uploadedSlip.ref;

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

    const orderSlipId = randomUUID();
    let queueQueued = false;

    const result = await db.$transaction(async (tx) => {
      const createdSlip = await tx.orderSlip.create({
        data: {
          id: orderSlipId,
          orderId: order.id,
          fileUrl: uploadedSlip.ref,
          fileKey: uploadedSlip.key,
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
          slipUrl: uploadedSlip.ref,
          slipFileName: slip.name,
          slipFileSize: slip.size,
          whtCertUrl,
          whtCertVerified: whtCertUrl ? null : false,
          easyslipVerified: false,
          easyslipResponse: Prisma.JsonNull,
          adminNote: SLIP_QUEUED_STATUS_NOTE,
          rejectReason: null,
          paidAt: null,
          completedAt: null,
        },
        select: orderSummarySelect,
      });

      return { createdSlip, updatedOrder };
    });

    try {
      await slipVerifyQueue.add(
        "verify-order-slip",
        {
          orderId: order.id,
          orderSlipId,
          userId: session.id,
          queuedAt: new Date().toISOString(),
        },
        {
          jobId: `order-slip:${orderSlipId}`,
        },
      );
      queueQueued = true;
    } catch (error) {
      await db.$transaction(async (tx) => {
        await tx.orderSlip.update({
          where: { id: orderSlipId },
          data: { deletedAt: new Date() },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: order.status,
            slipUrl: order.slipUrl,
            slipFileName: order.slipFileName,
            slipFileSize: order.slipFileSize,
            whtCertUrl: order.whtCertUrl,
            whtCertVerified: order.whtCertVerified,
            easyslipVerified: order.easyslipVerified,
            easyslipResponse: order.easyslipResponse ? (order.easyslipResponse as Prisma.InputJsonValue) : Prisma.JsonNull,
            adminNote: order.adminNote,
            rejectReason: order.rejectReason,
            paidAt: order.paidAt,
            completedAt: order.completedAt,
          },
        });
      }).catch((rollbackError) => {
        console.error("[Slip Route] Failed to rollback after queue enqueue error:", rollbackError);
      });

      await cleanupUploads();
      throw new ApiError(503, "ระบบตรวจสอบสลิปยังไม่พร้อม กรุณาลองใหม่");
    }

    try {
      await db.$transaction(async (tx) => {
        await createOrderHistory(tx, order.id, "VERIFYING", {
          fromStatus: order.status,
          changedBy: session.id,
          note: SLIP_QUEUED_REVIEW_NOTE,
        });
      });
    } catch (historyError) {
      console.error("[Slip Route] Failed to record slip queue history:", historyError);
    }

    return apiResponse({
      ...serializeOrderV2(result.updatedOrder),
      latest_slip: serializeOrderSlip(result.createdSlip),
      latest_slip_uploaded_at: result.createdSlip.uploadedAt.toISOString(),
      latest_status_note: SLIP_QUEUED_STATUS_NOTE,
      verified: false,
      pending_review: false,
      queued: queueQueued,
    });
  } catch (error) {
    if (slipUrl && !uploadsCleaned) {
      await cleanupUploads();
    }
    if (error instanceof StorageUploadError) {
      return apiError(new ApiError(503, "ระบบอัปโหลดไฟล์ยังไม่พร้อม กรุณาลองใหม่"));
    }
    return apiError(error);
  }
}
