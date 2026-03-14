import { prisma as db } from "../db";
import { logger } from "../logger";
import { getRemainingQuota } from "../package/quota";

/**
 * Get user's auto top-up settings
 */
export async function getAutoTopupSetting(userId: string) {
  return db.autoTopupSetting.findUnique({
    where: { userId },
    include: { tier: { select: { name: true, tierCode: true, price: true } } },
  });
}

/**
 * Create or update auto top-up settings
 */
export async function upsertAutoTopupSetting(
  userId: string,
  data: {
    isEnabled: boolean;
    tierId: string;
    threshold?: number;
    maxPerMonth?: number;
  },
) {
  // Validate tier exists
  const tier = await db.packageTier.findUnique({ where: { id: data.tierId } });
  if (!tier || !tier.isActive || tier.isTrial) {
    throw new Error("ไม่พบ package tier ที่เลือก");
  }

  const threshold = Math.max(1, data.threshold ?? 100);
  const maxPerMonth = Math.max(1, Math.min(10, data.maxPerMonth ?? 3));

  return db.autoTopupSetting.upsert({
    where: { userId },
    create: {
      userId,
      isEnabled: data.isEnabled,
      tierId: data.tierId,
      threshold,
      maxPerMonth,
      purchasedThisMonth: 0,
      monthResetAt: new Date(),
    },
    update: {
      isEnabled: data.isEnabled,
      tierId: data.tierId,
      threshold,
      maxPerMonth,
    },
    include: { tier: { select: { name: true, tierCode: true, price: true } } },
  });
}

/**
 * Check and trigger auto top-up if quota is below threshold.
 * Called after SMS deduction (fire-and-forget).
 */
export async function checkAndAutoTopup(userId: string): Promise<{
  triggered: boolean;
  purchaseId?: string;
  reason?: string;
}> {
  const setting = await db.autoTopupSetting.findUnique({
    where: { userId },
    include: { tier: true },
  });

  if (!setting || !setting.isEnabled) {
    return { triggered: false, reason: "auto_topup_disabled" };
  }

  // Reset monthly counter if new month
  const now = new Date();
  if (
    now.getMonth() !== setting.monthResetAt.getMonth() ||
    now.getFullYear() !== setting.monthResetAt.getFullYear()
  ) {
    await db.autoTopupSetting.update({
      where: { userId },
      data: { purchasedThisMonth: 0, monthResetAt: now },
    });
    setting.purchasedThisMonth = 0;
  }

  // Check monthly limit
  if (setting.purchasedThisMonth >= setting.maxPerMonth) {
    return { triggered: false, reason: "monthly_limit_reached" };
  }

  // Check quota
  const quota = await getRemainingQuota(userId);
  if (quota.totalRemaining > setting.threshold) {
    return { triggered: false, reason: "quota_above_threshold" };
  }

  // Tier must still be active
  if (!setting.tier.isActive) {
    return { triggered: false, reason: "tier_inactive" };
  }

  // Auto-purchase: create package + increment counter
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + setting.tier.expiryMonths);

  const purchase = await db.$transaction(async (tx) => {
    // Package NOT active yet — needs payment verification first
    const pkg = await tx.packagePurchase.create({
      data: {
        userId,
        tierId: setting.tierId,
        smsTotal: setting.tier.totalSms,
        smsUsed: 0,
        expiresAt,
        isActive: false, // activated after payment verification
      },
    });

    await tx.autoTopupSetting.update({
      where: { userId },
      data: { purchasedThisMonth: { increment: 1 } },
    });

    // Create transaction as pending — requires slip/payment verification
    await tx.transaction.create({
      data: {
        userId,
        packageId: setting.tierId,
        amount: Number(setting.tier.price),
        credits: 0,
        method: "auto_topup",
        status: "pending",
        expiresAt,
      },
    });

    return pkg;
  });

  logger.info("auto-topup purchase created", {
    userId,
    tierName: setting.tier.name,
    smsTotal: setting.tier.totalSms,
    purchaseId: purchase.id,
  });

  return { triggered: true, purchaseId: purchase.id };
}
