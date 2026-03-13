import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { resolveStoredFileUrl } from "@/lib/storage/files";
import {
  removeStoredFile,
  StorageUploadError,
  storeUploadedFile,
} from "@/lib/storage/service";
import { coerceUploadedFile } from "@/lib/uploaded-file";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED_WHT_CERT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_WHT_CERT_BYTES = 5 * 1024 * 1024;

const whtCertSchema = z.object({
  payerName: z.string().trim().min(2, "กรุณากรอกชื่อผู้จ่ายเงิน"),
  payerTaxId: z
    .string()
    .trim()
    .length(13, "เลขผู้เสียภาษีต้องมี 13 หลัก")
    .regex(/^\d{13}$/, "เลขผู้เสียภาษีต้องเป็นตัวเลข"),
  whtDate: z.string().trim().min(1, "กรุณาระบุวันที่หัก ณ ที่จ่าย"),
  amount: z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    z.number().positive("จำนวนเงินต้องมากกว่า 0"),
  ),
  whtRate: z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    z
      .number()
      .positive("อัตราหัก ณ ที่จ่ายต้องมากกว่า 0")
      .max(100, "อัตราหัก ณ ที่จ่ายไม่ถูกต้อง")
      .optional(),
  ),
});

function serializeCertificate<T extends { fileUrl: string }>(certificate: T) {
  return {
    ...certificate,
    fileUrl: resolveStoredFileUrl(certificate.fileUrl) ?? certificate.fileUrl,
  };
}

// POST /api/v1/invoices/:id/wht-cert — upload 50 ทวิ (WHT certificate)
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await authenticateRequest(req);

    const { applyRateLimit } = await import("@/lib/rate-limit");
    const rl = await applyRateLimit(user.id, "wht_upload");
    if (rl.blocked) return rl.blocked;

    const { id: invoiceId } = await ctx.params;

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, userId: user.id },
      select: {
        id: true,
        organizationId: true,
        subtotal: true,
        whtRate: true,
        whtAmount: true,
        transactionId: true,
      },
    });
    if (!invoice) throw new ApiError(404, "ไม่พบใบแจ้งหนี้");
    if (!invoice.whtRate) {
      throw new ApiError(400, "ใบแจ้งหนี้นี้ไม่มีการหัก ณ ที่จ่าย");
    }

    const formData = await req.formData();
    const input = whtCertSchema.parse({
      payerName: formData.get("payerName"),
      payerTaxId: formData.get("payerTaxId"),
      whtDate: formData.get("whtDate"),
      amount: formData.get("amount"),
      whtRate: formData.get("whtRate"),
    });
    const file =
      coerceUploadedFile(formData.get("file")) ||
      coerceUploadedFile(formData.get("whtCert")) ||
      coerceUploadedFile(formData.get("certificate"));
    if (!file || file.size === 0) {
      throw new ApiError(400, "กรุณาแนบไฟล์ 50 ทวิ");
    }
    if (!ALLOWED_WHT_CERT_TYPES.includes(file.type)) {
      throw new ApiError(400, "รองรับเฉพาะไฟล์ PDF, JPG, PNG, WebP");
    }
    if (file.size > MAX_WHT_CERT_BYTES) {
      throw new ApiError(400, "ไฟล์ 50 ทวิต้องไม่เกิน 5MB");
    }

    const whtRate = input.whtRate ?? Number(invoice.whtRate);
    const whtAmount = Math.round(input.amount * (whtRate / 100) * 100) / 100;
    const uploadedFile = await storeUploadedFile({
      userId: user.id,
      scope: "payments",
      resourceId: invoice.id,
      kind: "wht",
      file,
    });

    let cert;
    try {
      cert = await db.whtCertificate.create({
        data: {
          userId: user.id,
          organizationId: invoice.organizationId,
          invoiceId: invoice.id,
          transactionId: invoice.transactionId,
          payerName: input.payerName,
          payerTaxId: input.payerTaxId,
          whtDate: new Date(input.whtDate),
          amount: input.amount,
          whtRate,
          whtAmount,
          fileUrl: uploadedFile.ref,
          status: "PENDING",
        },
      });
    } catch (error) {
      await removeStoredFile(uploadedFile.ref);
      throw error;
    }

    return apiResponse(
      {
        id: cert.id,
        status: cert.status,
        whtAmount,
        fileUrl: resolveStoredFileUrl(cert.fileUrl),
        message: "อัพโหลด 50 ทวิ สำเร็จ รอตรวจสอบ",
      },
      201,
    );
  } catch (error) {
    if (error instanceof StorageUploadError) {
      return apiError(new ApiError(503, "ระบบอัปโหลดไฟล์ยังไม่พร้อม กรุณาลองใหม่"));
    }
    return apiError(error);
  }
}

// GET /api/v1/invoices/:id/wht-cert — get WHT certificate for invoice
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const user = await authenticateRequest(req);

    const { id: invoiceId } = await ctx.params;

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, userId: user.id },
      select: { id: true, transactionId: true },
    });
    if (!invoice) throw new ApiError(404, "ไม่พบใบแจ้งหนี้");

    const where = invoice.transactionId
      ? {
          userId: user.id,
          OR: [
            { invoiceId },
            { invoiceId: null, transactionId: invoice.transactionId },
          ],
        }
      : {
          userId: user.id,
          invoiceId,
        };

    const certs = await db.whtCertificate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return apiResponse({ certificates: certs.map(serializeCertificate) });
  } catch (error) {
    return apiError(error);
  }
}
