import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";
import { extractVatFromInclusive } from "@/lib/accounting/vat";

const TIER_ORDER: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8 };

const purchaseSchema = z.object({
  tierId: z.string().min(1, "กรุณาเลือก package"),
  couponCode: z.string().optional(),
});

// POST /api/v1/packages/purchase — buy package (+ optional coupon)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { applyRateLimit } = await import("@/lib/rate-limit");
    const rl = await applyRateLimit(session.id, "purchase");
    if (rl.blocked) return rl.blocked;

    const body = await req.json();
    const { tierId, couponCode } = purchaseSchema.parse(body);

    const tier = await db.packageTier.findUnique({ where: { id: tierId } });
    if (!tier || !tier.isActive) throw new ApiError(404, "ไม่พบ package");
    if (tier.isTrial) throw new ApiError(400, "ไม่สามารถซื้อ Trial package ได้");

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + tier.expiryMonths);

    // ALL coupon validation + purchase creation inside $transaction (TOCTOU fix)
    const result = await db.$transaction(async (tx) => {
      let extraSms = 0;
      let priceDiscount = 0;
      let couponId: string | null = null;
      let discountInfo: { type: string; value: number; priceDiscount: number } | null = null;

      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode.toUpperCase() },
        });
        if (!coupon || !coupon.isActive) throw new ApiError(400, "Coupon ไม่ถูกต้อง");
        if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, "Coupon หมดอายุ");

        // Usage limit check INSIDE transaction (TOCTOU fix #7)
        if (coupon.usageLimit && coupon.currentUsage >= coupon.usageLimit) {
          throw new ApiError(400, "Coupon ถูกใช้ครบแล้ว");
        }

        // Per-user limit check INSIDE transaction
        const userUsage = await tx.couponUsage.count({
          where: { couponId: coupon.id, userId: session.id },
        });
        if (userUsage >= coupon.perUserLimit) {
          throw new ApiError(400, "คุณใช้ coupon นี้ครบแล้ว");
        }

        // Tier validation (#6): check applicableTiers + minTier
        if (coupon.applicableTiers.length > 0 && !coupon.applicableTiers.includes(tier.tierCode)) {
          throw new ApiError(400, "Coupon ไม่สามารถใช้กับ package นี้ได้");
        }
        if (coupon.minTier && (TIER_ORDER[tier.tierCode] ?? 0) < (TIER_ORDER[coupon.minTier] ?? 0)) {
          throw new ApiError(400, `Coupon ต้องใช้กับ package tier ${coupon.minTier} ขึ้นไป`);
        }

        // Apply discount by type (#5)
        const discountValue = Number(coupon.discountValue);
        if (coupon.discountType === "extra_sms") {
          extraSms = discountValue;
        } else if (coupon.discountType === "percent") {
          priceDiscount = Math.round(Number(tier.price) * (discountValue / 100) * 100) / 100;
        } else if (coupon.discountType === "fixed") {
          priceDiscount = Math.min(discountValue, Number(tier.price));
        } else if (coupon.discountType === "extra_sender") {
          // extra_sender: tracked via coupon on purchase, enforced at sender name validation
        }

        discountInfo = {
          type: coupon.discountType,
          value: discountValue,
          priceDiscount,
        };
        couponId = coupon.id;
      }

      // Create PackagePurchase
      const pkg = await tx.packagePurchase.create({
        data: {
          userId: session.id,
          tierId: tier.id,
          smsTotal: tier.totalSms + extraSms,
          smsUsed: 0,
          expiresAt,
          isActive: true,
          couponId,
        },
        include: { tier: { select: { name: true, tierCode: true } } },
      });

      // Track coupon usage (atomic inside same transaction)
      if (couponId) {
        await tx.couponUsage.create({
          data: {
            couponId,
            userId: session.id,
            purchaseId: pkg.id,
          },
        });
        await tx.coupon.update({
          where: { id: couponId },
          data: { currentUsage: { increment: 1 } },
        });
      }

      return { pkg, discountInfo };
    });

    const originalPrice = Number(tier.price);
    const finalPrice = result.discountInfo
      ? originalPrice - result.discountInfo.priceDiscount
      : originalPrice;
    const vatBreakdown = extractVatFromInclusive(finalPrice);

    return apiResponse({
      purchase: {
        id: result.pkg.id,
        tier: result.pkg.tier.name,
        tierCode: result.pkg.tier.tierCode,
        smsTotal: result.pkg.smsTotal,
        expiresAt: result.pkg.expiresAt,
        originalPrice,
        finalPrice,
        vat: vatBreakdown,
        ...(result.discountInfo && { discount: result.discountInfo }),
      },
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
