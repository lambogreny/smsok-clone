import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { enforceSupportTicketRateLimit } from "@/lib/tickets/rate-limit";
import { sanitizedTextBlockSchema } from "@/lib/validations";
import { z } from "zod";

const replySchema = z.object({
  content: sanitizedTextBlockSchema(1, 5000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 5000 ตัวอักษร"),
});

type Ctx = { params: Promise<{ id: string }> };

// POST /api/v1/tickets/:id/reply — add reply to ticket
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const session = await authenticateRequest(req);
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    await enforceSupportTicketRateLimit(req.headers, session.id, "reply");
    const { id } = await ctx.params;
    const input = replySchema.parse(await req.json());

    // Auth-first: query with userId to prevent IDOR
    const ticket = await db.supportTicket.findFirst({
      where: { id, userId: session.id },
      select: { id: true, status: true },
    });

    if (!ticket) throw new ApiError(404, "ไม่พบ Ticket");
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
