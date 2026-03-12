import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

async function fileToDataUrl(file: File) {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${file.type};base64,${base64}`;
}

async function handleUpload(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "slip");
    if (rl.blocked) return rl.blocked;

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
    const file = formData.get("slip") as File | null;
    const whtFile =
      (formData.get("whtCert") as File | null) ||
      (formData.get("whtCertificate") as File | null) ||
      (formData.get("withholdingCert") as File | null);
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

    const slipUrl = await fileToDataUrl(file);
    const whtCertUrl = whtFile ? await fileToDataUrl(whtFile) : null;

    const updated = await db.payment.update({
      where: { id },
      data: {
        slipUrl,
        slipFileName: file.name,
        slipFileSize: file.size,
        ...(whtCertUrl
          ? {
              whtCertUrl,
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

    return apiResponse({
      id: updated.id,
      paymentId: updated.id,
      status: updated.status,
      hasSlip: true,
      slipFileName: updated.slipFileName,
      slipFileSize: updated.slipFileSize,
      hasWhtCert: Boolean(whtFile || payment.whtCertUrl),
      whtCertVerified: updated.whtCertVerified,
    });
  } catch (error) {
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
