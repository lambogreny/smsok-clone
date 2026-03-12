import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

const autoRenewSchema = z.object({
  enabled: z.boolean(),
});

// POST /api/v1/packages/[id]/auto-renew — toggle auto-renew
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { id } = await params;

    const { applyRateLimit } = await import("@/lib/rate-limit");
    const rl = await applyRateLimit(session.id, "purchase");
    if (rl.blocked) return rl.blocked;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const { enabled } = autoRenewSchema.parse(body);

    const pkg = await db.packagePurchase.findUnique({
      where: { id },
      select: { userId: true, isActive: true, expiresAt: true },
    });

    if (!pkg) throw new ApiError(404, "ไม่พบ package");
    if (pkg.userId !== session.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง package นี้");
    if (!pkg.isActive || pkg.expiresAt <= new Date()) {
      throw new ApiError(400, "ไม่สามารถเปลี่ยน auto-renew สำหรับ package ที่หมดอายุ");
    }

    await db.packagePurchase.update({
      where: { id },
      data: { autoRenew: enabled },
    });

    return apiResponse({ success: true, autoRenew: enabled });
  } catch (error) {
    return apiError(error);
  }
}
