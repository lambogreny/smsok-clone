import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const whtCertSchema = z.object({
  payerName: z.string().min(2, "กรุณากรอกชื่อผู้จ่ายเงิน"),
  payerTaxId: z
    .string()
    .length(13, "เลขผู้เสียภาษีต้องมี 13 หลัก")
    .regex(/^\d{13}$/, "เลขผู้เสียภาษีต้องเป็นตัวเลข"),
  whtDate: z.string().min(1, "กรุณาระบุวันที่หัก ณ ที่จ่าย"),
  amount: z.number().positive("จำนวนเงินต้องมากกว่า 0"),
  whtRate: z.number().default(3),
  fileUrl: z
    .string()
    .url("URL ไฟล์ไม่ถูกต้อง")
    .max(2048, "URL ยาวเกินไป")
    .refine(
      (url) => {
        const lower = url.toLowerCase();
        return (
          lower.startsWith("https://") &&
          /\.(pdf|jpg|jpeg|png|webp)(\?.*)?$/i.test(lower)
        );
      },
      "รองรับเฉพาะไฟล์ PDF, JPG, PNG, WebP ผ่าน HTTPS เท่านั้น",
    ),
});

// POST /api/v1/invoices/:id/wht-cert — upload 50 ทวิ (WHT certificate)
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { applyRateLimit } = await import("@/lib/rate-limit");
    const rl = await applyRateLimit(session.id, "wht_upload");
    if (rl.blocked) return rl.blocked;

    const { id: invoiceId } = await ctx.params;

    // Verify invoice ownership
    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, userId: session.id },
      select: {
        id: true,
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

    const body = await req.json();
    const input = whtCertSchema.parse(body);

    // Calculate WHT amount
    const whtAmount =
      Math.round(input.amount * (input.whtRate / 100) * 100) / 100;

    // Create WHT certificate record
    const cert = await db.whtCertificate.create({
      data: {
        userId: session.id,
        transactionId: invoice.transactionId,
        payerName: input.payerName,
        payerTaxId: input.payerTaxId,
        whtDate: new Date(input.whtDate),
        amount: input.amount,
        whtRate: input.whtRate,
        whtAmount,
        fileUrl: input.fileUrl,
        status: "PENDING",
      },
    });

    return apiResponse(
      {
        id: cert.id,
        status: cert.status,
        whtAmount,
        message: "อัพโหลด 50 ทวิ สำเร็จ รอตรวจสอบ",
      },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}

// GET /api/v1/invoices/:id/wht-cert — get WHT certificate for invoice
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { id: invoiceId } = await ctx.params;

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, userId: session.id },
      select: { transactionId: true },
    });
    if (!invoice) throw new ApiError(404, "ไม่พบใบแจ้งหนี้");

    const certs = await db.whtCertificate.findMany({
      where: {
        userId: session.id,
        transactionId: invoice.transactionId,
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse({ certificates: certs });
  } catch (error) {
    return apiError(error);
  }
}
