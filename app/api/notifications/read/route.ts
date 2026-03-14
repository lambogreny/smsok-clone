import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateRequestUser } from "@/lib/request-auth";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequestUser(req);
    const rl = await applyRateLimit(user.id, "api");
    if (rl.blocked) return rl.blocked;
    await prisma.user.update({
      where: { id: user.id },
      data: { notificationsReadAt: new Date() },
    });
    return apiResponse({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
