import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";

export { GET } from "@/app/api/v1/senders/name/[id]/route";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/v1/senders/:id — delete sender
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    const sender = await db.senderName.findFirst({
      where: { id, userId: user.id },
    });
    if (!sender) throw new ApiError(404, "ไม่พบชื่อผู้ส่ง");

    if (sender.status === "APPROVED" || sender.status === "ACTIVE") {
      throw new ApiError(400, "ไม่สามารถลบชื่อผู้ส่งที่ได้รับอนุมัติแล้ว");
    }

    await db.senderName.delete({ where: { id } });
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
