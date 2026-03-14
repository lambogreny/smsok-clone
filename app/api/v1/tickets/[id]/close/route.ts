import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
type Ctx = { params: Promise<{ id: string }> };

// PUT /api/v1/tickets/:id/close — customer closes ticket
export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const { id } = await ctx.params;

    const ticket = await db.supportTicket.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!ticket) throw new ApiError(404, "ไม่พบ Ticket");
    if (ticket.userId !== session.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง Ticket นี้");
    if (ticket.status === "CLOSED") throw new ApiError(400, "Ticket นี้ปิดแล้ว");

    const updated = await db.supportTicket.update({
      where: { id },
      data: { status: "CLOSED", closedAt: new Date() },
      select: { id: true, status: true, closedAt: true },
    });

    return apiResponse(updated);
  } catch (error) {
    return apiError(error);
  }
}
