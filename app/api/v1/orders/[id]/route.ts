import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { serializeOrder } from "@/lib/orders/service";

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

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const { id } = await ctx.params;
    const order = await db.order.findFirst({
      where: { id, userId: session.id },
      select: orderSelect,
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");

    return apiResponse(serializeOrder(order));
  } catch (error) {
    return apiError(error);
  }
}
