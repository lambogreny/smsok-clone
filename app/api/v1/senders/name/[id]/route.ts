import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

// GET /api/v1/senders/name/[id] — detail + docs + history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { id } = await params;

    const senderName = await db.senderName.findUnique({
      where: { id },
      include: {
        documents: {
          select: {
            id: true,
            type: true,
            fileName: true,
            fileUrl: true,
            mimeType: true,
            verified: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        urls: {
          select: { id: true, domain: true },
        },
        history: {
          select: {
            id: true,
            action: true,
            fromStatus: true,
            toStatus: true,
            note: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!senderName) throw new ApiError(404, "ไม่พบ sender name");
    if (senderName.userId !== session.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง");

    return apiResponse({
      senderName: {
        id: senderName.id,
        name: senderName.name,
        status: senderName.status,
        accountType: senderName.accountType,
        rejectNote: senderName.rejectNote,
        submittedAt: senderName.submittedAt,
        approvedAt: senderName.approvedAt,
        expiresAt: senderName.expiresAt,
        createdAt: senderName.createdAt,
        documents: senderName.documents,
        urls: senderName.urls,
        history: senderName.history,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
