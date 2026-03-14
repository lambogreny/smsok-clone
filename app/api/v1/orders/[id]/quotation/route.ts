import { NextRequest } from "next/server";
import { ApiError, apiError, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { renderOrderQuotationPdf } from "@/lib/orders/pdf";
type RouteContext = {
  params: Promise<{ id: string }>;
};

const orderSelect = {
  id: true,
  orderNumber: true,
  customerType: true,
  packageName: true,
  smsCount: true,
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
  quotationNumber: true,
  expiresAt: true,
  createdAt: true,
  user: {
    select: {
      email: true,
      phone: true,
    },
  },
} as const;

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await ctx.params;
    const order = await db.order.findFirst({
      where: { id, userId: user.id },
      select: orderSelect,
    });
    if (!order || !order.quotationNumber) {
      throw new ApiError(404, "ไม่พบใบเสนอราคา");
    }

    const pdfBuffer = await renderOrderQuotationPdf(order);
    const download = req.nextUrl.searchParams.get("download") === "1";

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${order.quotationNumber}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
