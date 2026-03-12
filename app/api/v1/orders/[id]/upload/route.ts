import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { verifySlipByBase64 } from "@/lib/easyslip";
import { createOrderHistory, serializeOrder } from "@/lib/orders/service";
import { generateOrderDocumentNumber } from "@/lib/orders/numbering";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const orderSelect = {
  id: true,
  orderNumber: true,
  packageTierId: true,
  packageName: true,
  smsCount: true,
  customerType: true,
  taxName: true,
  taxId: true,
  taxAddress: true,
  taxBranchType: true,
  taxBranchNumber: true,
  netAmount: true,
  vatAmount: true,
  totalAmount: true,
  hasWht: true,
  whtAmount: true,
  payAmount: true,
  status: true,
  expiresAt: true,
  quotationNumber: true,
  quotationUrl: true,
  invoiceNumber: true,
  invoiceUrl: true,
  slipUrl: true,
  whtCertUrl: true,
  easyslipVerified: true,
  rejectReason: true,
  adminNote: true,
  paidAt: true,
  createdAt: true,
} as const;

function fileToDataUrl(file: File, mimeType: string, buffer: Buffer) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

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
        payAmount: true,
        hasWht: true,
        status: true,
        whtCertUrl: true,
        invoiceNumber: true,
      },
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");
    if (!["PENDING", "PENDING_REVIEW", "SLIP_UPLOADED"].includes(order.status)) {
      throw new ApiError(400, "คำสั่งซื้อนี้ไม่สามารถอัปโหลดสลิปได้");
    }

    const formData = await req.formData();
    const slip = formData.get("slip");
    const whtCert = formData.get("wht_cert");

    if (!(slip instanceof File) || slip.size === 0) {
      throw new ApiError(400, "กรุณาแนบสลิป");
    }
    if (order.hasWht && (!(whtCert instanceof File) || whtCert.size === 0) && !order.whtCertUrl) {
      throw new ApiError(400, "กรุณาแนบใบหัก ณ ที่จ่าย (50 ทวิ)");
    }

    const slipBuffer = Buffer.from(await slip.arrayBuffer());
    const slipUrl = fileToDataUrl(slip, slip.type || "image/png", slipBuffer);

    let whtCertUrl: string | null = order.whtCertUrl;
    if (whtCert instanceof File && whtCert.size > 0) {
      const whtBuffer = Buffer.from(await whtCert.arrayBuffer());
      whtCertUrl = fileToDataUrl(whtCert, whtCert.type || "application/pdf", whtBuffer);
    }

    const verification = await verifySlipByBase64(slipUrl);

    const amountMatch =
      verification.success && verification.data
        ? Math.abs(verification.data.amount - Number(order.payAmount)) <= 1
        : false;

    const nextStatus = amountMatch ? "COMPLETED" : "PENDING_REVIEW";

    const updated = await db.$transaction(async (tx) => {
      const invoiceNumber =
        nextStatus === "COMPLETED" && !order.invoiceNumber
          ? await generateOrderDocumentNumber("invoice", tx)
          : order.invoiceNumber;

      const next = await tx.order.update({
        where: { id: order.id },
        data: {
          slipUrl,
          slipFileName: slip.name,
          slipFileSize: slip.size,
          whtCertUrl,
          whtCertVerified: whtCertUrl ? null : false,
          easyslipVerified: amountMatch,
          easyslipResponse: verification.success ? verification.data : { error: verification.error ?? "verification_failed" },
          status: nextStatus,
          paidAt: nextStatus === "COMPLETED" ? new Date() : null,
          completedAt: nextStatus === "COMPLETED" ? new Date() : null,
          invoiceNumber,
          invoiceUrl: invoiceNumber ? `/api/v1/orders/${order.id}/invoice` : null,
        },
        select: orderSelect,
      });

      if (nextStatus === "COMPLETED") {
        await tx.packagePurchase.create({
          data: {
            userId: order.userId,
            organizationId: order.organizationId,
            tierId: order.packageTierId,
            smsTotal: order.smsCount,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isActive: true,
            transactionId: order.id,
          },
        });
      }

      await createOrderHistory(tx, order.id, nextStatus, {
        fromStatus: order.status,
        changedBy: session.id,
        note: amountMatch
          ? "Slip verified and credits activated"
          : "Slip uploaded and awaiting manual review",
      });

      return next;
    });

    return apiResponse(serializeOrder(updated));
  } catch (error) {
    return apiError(error);
  }
}
