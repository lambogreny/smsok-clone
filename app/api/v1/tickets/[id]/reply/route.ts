import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

const replySchema = z.object({
  content: z.string().min(1).max(5000),
});

type Ctx = { params: Promise<{ id: string }> };

// POST /api/v1/tickets/:id/reply — add reply to ticket
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const { id } = await ctx.params;
    const input = replySchema.parse(await req.json());

    // Verify ticket belongs to user and is not closed
    const ticket = await db.supportTicket.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!ticket) throw new ApiError(404, "ไม่พบ Ticket");
    if (ticket.userId !== session.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง Ticket นี้");
    if (ticket.status === "CLOSED") throw new ApiError(400, "Ticket นี้ปิดแล้ว ไม่สามารถตอบกลับได้");

    // Create reply + update ticket status to OPEN (customer replied)
    const [reply] = await db.$transaction([
      db.ticketReply.create({
        data: {
          ticketId: id,
          userId: session.id,
          senderType: "CUSTOMER",
          content: input.content,
        },
        select: {
          id: true,
          senderType: true,
          content: true,
          createdAt: true,
        },
      }),
      db.supportTicket.update({
        where: { id },
        data: {
          status: ticket.status === "RESOLVED" || ticket.status === "AWAITING_RESPONSE" ? "OPEN" : undefined,
        },
      }),
    ]);

    return apiResponse(reply, 201);
  } catch (error) {
    return apiError(error);
  }
}
