import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/tickets/:id — ticket detail with replies + attachments
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const { id } = await ctx.params;

    const ticket = await db.supportTicket.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        subject: true,
        description: true,
        status: true,
        priority: true,
        category: true,
        resolvedAt: true,
        closedAt: true,
        createdAt: true,
        updatedAt: true,
        replies: {
          where: { isInternal: false },
          select: {
            id: true,
            senderType: true,
            content: true,
            createdAt: true,
            attachments: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
                fileSize: true,
                mimeType: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) throw new ApiError(404, "ไม่พบ Ticket");
    if (ticket.userId !== session.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง Ticket นี้");

    const { userId: _, ...ticketData } = ticket;
    return apiResponse(ticketData);
  } catch (error) {
    return apiError(error);
  }
}
