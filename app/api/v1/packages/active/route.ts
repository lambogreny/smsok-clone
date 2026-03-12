import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

// GET /api/v1/packages/active — user's active packages + remaining SMS
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const now = new Date();

    const packages = await db.packagePurchase.findMany({
      where: {
        userId: session.id,
        isActive: true,
        expiresAt: { gt: now },
      },
      include: {
        tier: {
          select: { name: true, tierCode: true, senderNameLimit: true, price: true },
        },
      },
      orderBy: { expiresAt: "asc" }, // FIFO
    });

    let totalSms = 0;
    let totalUsed = 0;
    let maxSenderNames = 0;

    for (const pkg of packages) {
      totalSms += pkg.smsTotal;
      totalUsed += pkg.smsUsed;
      if (pkg.tier.senderNameLimit === null) {
        maxSenderNames = -1;
      } else if (maxSenderNames !== -1) {
        maxSenderNames = Math.max(maxSenderNames, pkg.tier.senderNameLimit);
      }
    }

    return apiResponse({
      packages: packages.map((pkg, i) => {
        const daysLeft = Math.max(
          0,
          Math.ceil((pkg.expiresAt.getTime() - now.getTime()) / 86400000),
        );
        return {
          id: pkg.id,
          name: pkg.tier.name,
          tierCode: pkg.tier.tierCode,
          smsTotal: pkg.smsTotal,
          smsUsed: pkg.smsUsed,
          smsRemaining: pkg.smsTotal - pkg.smsUsed,
          purchasedAt: pkg.purchasedAt,
          expiresAt: pkg.expiresAt,
          daysLeft,
          autoRenew: pkg.autoRenew,
          isFifoFirst: i === 0,
          isActive: pkg.isActive,
        };
      }),
      summary: {
        totalSms,
        totalUsed,
        totalRemaining: totalSms - totalUsed,
        senderNameLimit: maxSenderNames === -1 ? null : maxSenderNames,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
