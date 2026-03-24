import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma as db } from "@/lib/db";
import { apiError } from "@/lib/api-auth";
import { getRemainingQuota } from "@/lib/package/quota";
import { ensureMembershipRoleAssignment, hasPermission } from "@/lib/rbac";

const DEFAULT_TEST_EMAIL = "demo@smsok.local";
const resetCreditsSchema = z.object({
  credits: z.number().int().min(0).default(0),
  email: z.string().email().optional(),
  userId: z.string().min(1).optional(),
});

function hasValidDevSecret(req: NextRequest) {
  const devSecret = process.env.DEV_SECRET;
  if (!devSecret) return false;

  const headerSecret = req.headers.get("x-dev-secret");
  return headerSecret === devSecret;
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const input = resetCreditsSchema.parse(body);
    if (!hasValidDevSecret(req)) {
      return NextResponse.json(
        { error: "DEV_SECRET required" },
        { status: 403 },
      );
    }

    const email = input.email?.trim().toLowerCase() || DEFAULT_TEST_EMAIL;
    const userId = input.userId?.trim() || null;

    const user = await db.user.findFirst({
      where: userId ? { id: userId } : { email },
      select: { id: true, email: true, memberships: { select: { organizationId: true, role: true } } },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const before = await getRemainingQuota(user.id);

    const activePackages = await db.packagePurchase.findMany({
      where: {
        userId: user.id,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, smsTotal: true, smsUsed: true, expiresAt: true },
      orderBy: { expiresAt: "asc" },
    });

    const totalCapacity = activePackages.reduce((sum: number, pkg: (typeof activePackages)[number]) => sum + pkg.smsTotal, 0);

    if (input.credits > totalCapacity) {
      return NextResponse.json(
        {
          error: "Requested credits exceed active package capacity",
          requestedCredits: input.credits,
          maxCredits: totalCapacity,
        },
        { status: 400 },
      );
    }

    let remainingToAllocate = input.credits;
    await db.$transaction(
      activePackages.map((pkg: (typeof activePackages)[number]) => {
        const allocated = Math.min(pkg.smsTotal, remainingToAllocate);
        remainingToAllocate -= allocated;

        return db.packagePurchase.update({
          where: { id: pkg.id },
          data: { smsUsed: pkg.smsTotal - allocated },
        });
      }),
    );

    const membership = user.memberships[0] ?? null;
    if (membership) {
      await ensureMembershipRoleAssignment(
        user.id,
        membership.organizationId,
        membership.role,
      );
    }

    const after = await getRemainingQuota(user.id);
    const canCreateSms = membership
      ? await hasPermission(user.id, membership.organizationId, "create", "sms")
      : false;

    return NextResponse.json({
      ok: true,
      userId: user.id,
      email: user.email,
      packagesUpdated: activePackages.length,
      guardMode: "dev_secret",
      requestedCredits: input.credits,
      maxCredits: totalCapacity,
      creditsBefore: before.totalRemaining,
      creditsAfter: after.totalRemaining,
      permission: {
        organizationId: membership?.organizationId ?? null,
        membershipRole: membership?.role ?? null,
        canCreateSms,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
