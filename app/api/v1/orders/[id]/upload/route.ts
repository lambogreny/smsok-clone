import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { verifySlipByBase64 } from "@/lib/easyslip";
import {
  activateOrderPurchase,
  buildSlipDataUrl,
  buildSlipFileKey,
  ensureOrderDocument,
  orderSummarySelect,
} from "@/lib/orders/api";
import { createOrderHistory, serializeOrder } from "@/lib/orders/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

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
        payAmount: true,
        hasWht: true,
        status: true,
        expiresAt: true,
        whtCertUrl: true,
      },
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");
    if (order.expiresAt < new Date()) {
      throw new ApiError(400, "คำสั่งซื้อนี้หมดอายุแล้ว");
    }
    if (!["PENDING_PAYMENT", "VERIFYING"].includes(order.status)) {
      throw new ApiError(400, "คำสั่งซื้อนี้ไม่สามารถอัปโหลดสลิปได้");
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      throw new ApiError(400, "กรุณาแนบสลิป");
    }
    const slip = formData.get("slip");
    const whtCert = formData.get("wht_cert");

    if (!(slip instanceof File) || slip.size === 0) {
      throw new ApiError(400, "กรุณาแนบสลิป");
    }
    if (!["image/jpeg", "image/png"].includes(slip.type)) {
      throw new ApiError(400, "รองรับเฉพาะไฟล์ JPEG หรือ PNG");
    }
    if (slip.size > 5 * 1024 * 1024) {
      throw new ApiError(400, "ไฟล์สลิปต้องไม่เกิน 5MB");
    }
    if (order.hasWht && (!(whtCert instanceof File) || whtCert.size === 0) && !order.whtCertUrl) {
      throw new ApiError(400, "กรุณาแนบใบหัก ณ ที่จ่าย (50 ทวิ)");
    }

    const slipBuffer = Buffer.from(await slip.arrayBuffer());
    const slipUrl = buildSlipDataUrl(slip, slip.type || "image/png", slipBuffer);
    const slipKey = buildSlipFileKey(order.id, slip);

    let whtCertUrl: string | null = order.whtCertUrl;
    if (whtCert instanceof File && whtCert.size > 0) {
      const whtBuffer = Buffer.from(await whtCert.arrayBuffer());
      whtCertUrl = buildSlipDataUrl(whtCert, whtCert.type || "application/pdf", whtBuffer);
    }

    const verification = await verifySlipByBase64(slipUrl);

    const amountMatch =
      verification.success && verification.data
        ? Math.abs(verification.data.amount - Number(order.payAmount)) <= 1
        : false;

    if (!verification.success) {
      throw new ApiError(400, verification.error ?? "ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่");
    }
    const verificationData = verification.data;
    if (!verificationData) {
      throw new ApiError(400, "ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่");
    }
    if (!amountMatch) {
      throw new ApiError(400, "จำนวนเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ");
    }

    const updated = await db.$transaction(async (tx) => {
      await tx.orderSlip.create({
        data: {
          orderId: order.id,
          fileUrl: slipUrl,
          fileKey: slipKey,
          fileSize: slip.size,
          fileType: slip.type || "image/png",
        },
      });

      const next = await tx.order.update({
        where: { id: order.id },
        data: {
          slipUrl,
          slipFileName: slip.name,
          slipFileSize: slip.size,
          whtCertUrl,
          whtCertVerified: whtCertUrl ? null : false,
          easyslipVerified: true,
          easyslipResponse: verificationData,
          status: "PAID",
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

      return next;
    });

    return apiResponse(serializeOrder(updated));
  } catch (error) {
    return apiError(error);
  }
}
