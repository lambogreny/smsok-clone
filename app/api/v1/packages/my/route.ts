import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

// GET /api/v1/packages/my — my active packages + remaining SMS
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const now = new Date();

    const tierSelect = { name: true, tierCode: true, senderNameLimit: true } as const;

    const [packages, expiredPackages] = await Promise.all([
      db.packagePurchase.findMany({
        where: { userId: session.id, isActive: true, expiresAt: { gt: now } },
        include: { tier: { select: tierSelect } },
        orderBy: { expiresAt: "asc" }, // FIFO
      }),
      db.packagePurchase.findMany({
        where: {
          userId: session.id,
          OR: [{ isActive: false }, { expiresAt: { lte: now } }],
        },
        include: { tier: { select: tierSelect } },
        orderBy: { expiresAt: "desc" },
        take: 20, // limit expired history
      }),
    ]);

    // Count senders used
    const sendersUsed = await db.senderName.count({
      where: { userId: session.id, status: { in: ["APPROVED", "PENDING"] } },
    });

    // Max sender limit across all packages (null = unlimited)
    let sendersMax = 0;
    let totalSms = 0;
    let totalUsed = 0;

    for (const pkg of packages) {
      totalSms += pkg.smsTotal;
      totalUsed += pkg.smsUsed;
      if (pkg.tier.senderNameLimit === null) {
        sendersMax = -1;
      } else if (sendersMax !== -1) {
        sendersMax = Math.max(sendersMax, pkg.tier.senderNameLimit);
      }
    }

    const totalRemaining = totalSms - totalUsed;

    const mapPkg = (pkg: typeof packages[number], i: number) => {
      const daysLeft = Math.max(
        0,
        Math.ceil((pkg.expiresAt.getTime() - now.getTime()) / 86400000),
      );
      return {
        id: pkg.id,
        name: pkg.tier.name,
        tier: pkg.tier.name,
        tierCode: pkg.tier.tierCode,
        smsTotal: pkg.smsTotal,
        smsUsed: pkg.smsUsed,
        smsRemaining: pkg.smsTotal - pkg.smsUsed,
        sendersUsed,
        sendersMax: sendersMax === -1 ? null : sendersMax,
        purchasedAt: pkg.purchasedAt,
        expiresAt: pkg.expiresAt,
        daysLeft,
        autoRenew: pkg.autoRenew,
        isFifoFirst: i === 0,
        isActive: pkg.isActive,
      };
    };

    return apiResponse({
      active: packages.map(mapPkg),
      expired: expiredPackages.map(mapPkg),
      summary: {
        totalSms,
        totalUsed,
        totalRemaining,
        senderNameLimit: sendersMax === -1 ? null : sendersMax,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
