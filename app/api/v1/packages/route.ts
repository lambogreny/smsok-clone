import { apiResponse, apiError } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";

const VAT_RATE = 7;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// GET /api/v1/packages — list available package tiers (public)
export async function GET() {
  try {
    const tiers = await db.packageTier.findMany({
      where: { isActive: true, isTrial: false },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        tierCode: true,
        price: true,
        smsQuota: true,
        bonusPercent: true,
        totalSms: true,
        senderNameLimit: true,
        expiryMonths: true,
      },
    });

    // Serialize Decimal → number + add VAT breakdown
    const result = tiers.map((t) => {
      const price = Number(t.price);
      const subtotal = round2(price / (1 + VAT_RATE / 100));
      const vat = round2(price - subtotal);
      return {
        id: t.id,
        name: t.name,
        tierCode: t.tierCode,
        price,
        smsQuota: t.smsQuota,
        bonusPercent: t.bonusPercent,
        totalSms: t.totalSms,
        senderNameLimit: t.senderNameLimit,
        expiryMonths: t.expiryMonths,
        vat: { subtotal, vat, total: price },
      };
    });

    return apiResponse({ tiers: result });
  } catch (error) {
    return apiError(error);
  }
}
