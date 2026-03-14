import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

const TIER_ORDER: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8 };

const validateCouponSchema = z.object({
  code: z.string().min(1, "กรุณากรอก coupon code"),
  tierId: z.string().optional(),
});

// POST /api/v1/packages/coupon/validate — validate coupon code
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const body = await req.json();
    const { code, tierId } = validateCouponSchema.parse(body);

    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return apiResponse({ valid: false, reason: "Coupon ไม่ถูกต้อง" });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return apiResponse({ valid: false, reason: "Coupon หมดอายุ" });
    }

    if (coupon.usageLimit && coupon.currentUsage >= coupon.usageLimit) {
      return apiResponse({ valid: false, reason: "Coupon ถูกใช้ครบแล้ว" });
    }

    const userUsage = await db.couponUsage.count({
      where: { couponId: coupon.id, userId: session.id },
    });
    if (userUsage >= coupon.perUserLimit) {
      return apiResponse({ valid: false, reason: "คุณใช้ coupon นี้ครบแล้ว" });
    }

    // Tier validation (#6): if tierId provided, check applicableTiers + minTier
    if (tierId) {
      const tier = await db.packageTier.findUnique({ where: { id: tierId } });
      if (tier) {
        if (coupon.applicableTiers.length > 0 && !coupon.applicableTiers.includes(tier.tierCode)) {
          return apiResponse({ valid: false, reason: "Coupon ไม่สามารถใช้กับ package นี้ได้" });
        }
        if (coupon.minTier && (TIER_ORDER[tier.tierCode] ?? 0) < (TIER_ORDER[coupon.minTier] ?? 0)) {
          return apiResponse({ valid: false, reason: `Coupon ต้องใช้กับ package tier ${coupon.minTier} ขึ้นไป` });
        }
      }
    }

    return apiResponse({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minTier: coupon.minTier,
        applicableTiers: coupon.applicableTiers,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
