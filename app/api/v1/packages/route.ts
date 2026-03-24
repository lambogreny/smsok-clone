import { apiResponse, apiError } from "@/lib/api-auth";
import { calculateVat } from "@/lib/accounting/vat";
import { prisma as db } from "@/lib/db";

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
    const result = tiers.map((t: (typeof tiers)[number]) => {
      const price = Number(t.price);
      const vat = calculateVat(price);
      return {
        id: t.id,
        name: t.name,
        tierCode: t.tierCode,
        group: ["A", "B", "C", "D"].includes(t.tierCode) ? "sme" : "enterprise",
        price,
        smsQuota: t.smsQuota,
        bonusPercent: t.bonusPercent,
        totalSms: t.totalSms,
        senderNameLimit: t.senderNameLimit,
        expiryMonths: t.expiryMonths,
        pricePerSms: Number((price / Math.max(t.totalSms, 1)).toFixed(3)),
        vat: {
          subtotal: vat.subtotal,
          vat: vat.vat7pct,
          total: vat.total,
        },
      };
    });

    return apiResponse({ tiers: result });
  } catch (error) {
    return apiError(error);
  }
}
