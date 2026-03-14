import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateRequestUser } from "@/lib/request-auth";
import { prisma } from "@/lib/db";
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequestUser(req);

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { notificationsReadAt: new Date() },
      });
    } catch {
      // Keep the bell usable even if the read marker column is unavailable in the current DB.
    }

    return apiResponse({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
