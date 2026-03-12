
import { prisma as db } from "../db";

const ONBOARDING_STEPS = [
  "emailVerified",
  "phoneVerified",
  "senderNameSet",
  "contactsImported",
  "testSmsSent",
  "toppedUp",
  "firstCampaign",
] as const;

type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export async function getOnboardingStatus(userId: string) {
  // Upsert onboarding record
  let onboarding = await db.userOnboarding.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  // Auto-detect completed steps from actual data
  const [user, senderNameCount, contactCount, messageCount, completedTxCount, campaignCount] =
    await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { emailVerified: true, phoneVerified: true },
      }),
      db.senderName.count({ where: { userId } }),
      db.contact.count({ where: { userId } }),
      db.message.count({ where: { userId } }),
      db.transaction.count({ where: { userId, status: "completed" } }),
      db.campaign.count({ where: { userId } }),
    ]);

  const actualState = {
    emailVerified: user?.emailVerified ?? false,
    phoneVerified: user?.phoneVerified ?? false,
    senderNameSet: senderNameCount > 0,
    contactsImported: contactCount > 0,
    testSmsSent: messageCount > 0,
    toppedUp: completedTxCount > 0,
    firstCampaign: campaignCount > 0,
  };

  // Update onboarding record with actual state
  onboarding = await db.userOnboarding.update({
    where: { userId },
    data: actualState,
  });

  const steps = ONBOARDING_STEPS.map((step) => ({
    step,
    completed: onboarding[step],
  }));

  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = ONBOARDING_STEPS.length;
  const isComplete = completedCount === totalSteps;

  return {
    steps,
    completedCount,
    totalSteps,
    isComplete,
    completedAt: onboarding.completedAt,
  };
}

export async function updateOnboardingProgress(userId: string, step: string) {
  if (!ONBOARDING_STEPS.includes(step as OnboardingStep)) {
    throw new Error(`ขั้นตอนไม่ถูกต้อง: ${step}`);
  }

  await db.userOnboarding.upsert({
    where: { userId },
    create: { userId, [step]: true },
    update: { [step]: true },
  });

  return getOnboardingStatus(userId);
}

export async function completeOnboarding(userId: string) {
  const status = await getOnboardingStatus(userId);

  if (!status.isComplete) {
    throw new Error("ยังทำขั้นตอนไม่ครบทุกขั้นตอน");
  }

  const onboarding = await db.userOnboarding.findUnique({
    where: { userId },
  });

  if (onboarding?.completedAt) {
    return { completed: true, bonusSms: 0, alreadyCompleted: true };
  }

  // Award bonus SMS via adding to first active package
  await db.$transaction(async (tx) => {
    const activePackage = await tx.packagePurchase.findFirst({
      where: { userId, isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: "asc" },
    });

    if (activePackage) {
      await tx.packagePurchase.update({
        where: { id: activePackage.id },
        data: { smsTotal: { increment: 50 } },
      });
    }

    await tx.userOnboarding.update({
      where: { userId },
      data: {
        completedAt: new Date(),
        bonusCredited: true,
      },
    });
  });

  return { completed: true, bonusSms: 50 };
}
