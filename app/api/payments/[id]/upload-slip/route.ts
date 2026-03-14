import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { resolveStoredFileUrl } from "@/lib/storage/files";
import { removeStoredFile, StorageUploadError, storeUploadedFile } from "@/lib/storage/service";
import { coerceUploadedFile } from "@/lib/uploaded-file";

type Ctx = { params: Promise<{ id: string }> };

const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

async function handleUpload(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const { id } = await ctx.params;

    const payment = await db.payment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        expiresAt: true,
        hasWht: true,
        whtCertUrl: true,
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
            note: "Payment expired before slip upload",
          },
        }),
      ]);
      throw new ApiError(400, "รายการชำระเงินหมดอายุแล้ว");
    }
    if (payment.status !== "PENDING") throw new ApiError(400, "สถานะไม่อนุญาตให้อัปโหลดสลิป");

    const formData = await req.formData();
    const file = coerceUploadedFile(formData.get("slip"));
    const whtFile =
      coerceUploadedFile(formData.get("whtCert")) ||
      coerceUploadedFile(formData.get("whtCertificate")) ||
      coerceUploadedFile(formData.get("withholdingCert"));
    if (!file) throw new ApiError(400, "กรุณาแนบไฟล์สลิป");

    if (!allowedTypes.includes(file.type)) throw new ApiError(400, "รองรับเฉพาะ JPG, PNG, PDF");
    if (file.size > 5 * 1024 * 1024) throw new ApiError(400, "ไฟล์ต้องไม่เกิน 5MB");

    if (whtFile) {
      if (!allowedTypes.includes(whtFile.type)) {
        throw new ApiError(400, "ไฟล์ 50 ทวิรองรับเฉพาะ JPG, PNG, PDF");
      }
      if (whtFile.size > 5 * 1024 * 1024) {
        throw new ApiError(400, "ไฟล์ 50 ทวิต้องไม่เกิน 5MB");
      }
    }

    if (payment.hasWht && !whtFile && !payment.whtCertUrl) {
      throw new ApiError(400, "กรุณาแนบไฟล์หนังสือรับรองหักภาษี ณ ที่จ่าย (50 ทวิ)");
    }

    const uploadedSlip = await storeUploadedFile({
      userId: session.id,
      scope: "payments",
      resourceId: id,
      kind: "slips",
      file,
    });
    const uploadedWht = whtFile
      ? await storeUploadedFile({
          userId: session.id,
          scope: "payments",
          resourceId: id,
          kind: "wht",
          file: whtFile,
        })
      : null;

    let updated;
    try {
      updated = await db.payment.update({
        where: { id },
        data: {
          slipUrl: uploadedSlip.ref,
          slipFileName: file.name,
          slipFileSize: file.size,
          ...(uploadedWht
            ? {
                whtCertUrl: uploadedWht.ref,
                whtCertVerified: false,
              }
            : {}),
        },
        select: {
          id: true,
          slipFileName: true,
          slipFileSize: true,
          whtCertVerified: true,
          status: true,
        },
      });
    } catch (error) {
      await Promise.allSettled([
        removeStoredFile(uploadedSlip.ref),
        uploadedWht ? removeStoredFile(uploadedWht.ref) : Promise.resolve(),
      ]);
      throw error;
    }

    return apiResponse({
      id: updated.id,
      paymentId: updated.id,
      status: updated.status,
      hasSlip: true,
      slipFileName: updated.slipFileName,
      slipFileSize: updated.slipFileSize,
      hasWhtCert: Boolean(whtFile || payment.whtCertUrl),
      whtCertVerified: updated.whtCertVerified,
      slipUrl: resolveStoredFileUrl(uploadedSlip.ref),
      whtCertUrl: uploadedWht ? resolveStoredFileUrl(uploadedWht.ref) : resolveStoredFileUrl(payment.whtCertUrl),
    });
  } catch (error) {
    if (error instanceof StorageUploadError) {
      return apiError(new ApiError(503, "ระบบอัปโหลดไฟล์ยังไม่พร้อม กรุณาลองใหม่"));
    }
    return apiError(error);
  }
}

// PATCH /api/payments/:id/upload-slip — upload slip image
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return handleUpload(req, ctx);
}

// POST /api/payments/:id/upload-slip — upload slip image + optional WHT cert
export async function POST(req: NextRequest, ctx: Ctx) {
  return handleUpload(req, ctx);
}
