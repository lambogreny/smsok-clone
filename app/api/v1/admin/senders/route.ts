import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { prisma as db } from "@/lib/db";
import { approveSenderNameSchema } from "@/lib/validations";
// GET /api/v1/admin/senders — list pending sender names
export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req);

    const pending = await db.senderName.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return apiResponse({ senders: pending });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/admin/senders — approve/reject sender name
export async function POST(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, ["SUPER_ADMIN", "OPERATIONS"]);
    const body = await req.json();
    const input = approveSenderNameSchema.parse(body);

    // All reads + checks + writes inside $transaction to prevent TOCTOU
    await db.$transaction(async (tx) => {
      const senderName = await tx.senderName.findUnique({
        where: { id: input.id },
      });
      if (!senderName) throw new ApiError(404, "ไม่พบชื่อผู้ส่ง");
      if (senderName.status !== "PENDING") throw new ApiError(400, "ชื่อผู้ส่งนี้ดำเนินการแล้ว");

      if (input.action === "approve") {
        await tx.senderName.update({
          where: { id: input.id },
          data: { status: "APPROVED", approvedAt: new Date(), approvedBy: admin.id },
        });
        await tx.senderNameHistory.create({
          data: {
            senderNameId: input.id,
            action: "approved",
            fromStatus: senderName.status,
            toStatus: "APPROVED",
            performedBy: admin.id,
          },
        });
      } else {
        await tx.senderName.update({
          where: { id: input.id },
          data: { status: "REJECTED", rejectNote: input.rejectNote },
        });
        await tx.senderNameHistory.create({
          data: {
            senderNameId: input.id,
            action: "rejected",
            fromStatus: senderName.status,
            toStatus: "REJECTED",
            note: input.rejectNote,
            performedBy: admin.id,
          },
        });
      }
    });

    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
