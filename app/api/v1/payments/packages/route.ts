import { apiResponse, apiError } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";

export async function GET() {
  try {
    const tiers = await db.packageTier.findMany({
      where: { isActive: true, isTrial: false },
      orderBy: { sortOrder: "asc" },
    });

    const packages = tiers.map((tier: (typeof tiers)[number], index: number) => ({
      id: tier.id,
      packageId: tier.id,
      tierCode: tier.tierCode,
      name: tier.name,
      sms: tier.totalSms,
      smsQuota: tier.smsQuota,
      price: Number(tier.price),
      perSms: Number((Number(tier.price) / Math.max(tier.totalSms, 1)).toFixed(2)),
      bonusPercent: tier.bonusPercent,
      expiryMonths: tier.expiryMonths,
      badge: index === 1 || tier.bonusPercent >= 15 ? "BEST" : undefined,
    }));

    return apiResponse({ packages });
  } catch (error) {
    return apiError(error);
  }
}
