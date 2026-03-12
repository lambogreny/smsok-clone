import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { createOrderHistory, serializeOrder } from "@/lib/orders/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const cancellableStatuses = new Set(["PENDING", "SLIP_UPLOADED", "PENDING_REVIEW"]);

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

export async function POST(_req: Request, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const { id } = await ctx.params;
    const order = await db.order.findFirst({
      where: { id, userId: session.id },
      select: { id: true, status: true },
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");
    if (!cancellableStatuses.has(order.status)) {
      throw new ApiError(400, "คำสั่งซื้อนี้ไม่สามารถยกเลิกได้");
    }

    const updated = await db.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
        select: orderSelect,
      });
      await createOrderHistory(tx, order.id, "CANCELLED", {
        fromStatus: order.status,
        changedBy: session.id,
        note: "Customer cancelled order",
      });
      return next;
    });

    return apiResponse(serializeOrder(updated));
  } catch (error) {
    return apiError(error);
  }
}
