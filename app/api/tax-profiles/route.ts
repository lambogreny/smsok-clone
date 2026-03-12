import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const taxProfileSchema = z
  .object({
    id: z.string().min(1).optional(),
    organizationId: z.string().min(1).optional(),
    companyName: z.string().trim().min(2).max(200),
    taxId: z.string().regex(/^\d{13}$/, "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก"),
    address: z.string().trim().min(10).max(1000),
    branchType: z.enum(["HEAD", "BRANCH"]).default("HEAD"),
    branchNumber: z.string().regex(/^\d{5}$/).optional(),
    isDefault: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.branchType === "BRANCH" && !value.branchNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["branchNumber"],
        message: "กรุณาระบุเลขสาขา 5 หลัก",
      });
    }
  });

async function getAccessibleOrgIds(userId: string) {
  const memberships = await db.membership.findMany({
    where: { userId },
    select: { organizationId: true },
  });

  return memberships.map((membership) => membership.organizationId);
}

// GET /api/tax-profiles — list accessible tax profiles
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "tax_profile");
    if (rl.blocked) return rl.blocked;

    const organizationIds = await getAccessibleOrgIds(session.id);

    let profiles = await db.taxProfile.findMany({
      where: {
        OR: [
          { userId: session.id },
          ...(organizationIds.length > 0
            ? [{ organizationId: { in: organizationIds } }]
            : []),
        ],
      },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        organizationId: true,
        userId: true,
        companyName: true,
        taxId: true,
        address: true,
        branchType: true,
        branchNumber: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Soft-bridge legacy tax profile so new API works before the settings page migrates.
    if (profiles.length === 0) {
      const legacy = await db.customerTaxInfo.findUnique({
        where: { userId: session.id },
        select: {
          companyName: true,
          taxId: true,
          address: true,
          branch: true,
          branchCode: true,
        },
      });

      if (legacy) {
        const created = await db.taxProfile.create({
          data: {
            userId: session.id,
            organizationId: organizationIds[0] ?? null,
            companyName: legacy.companyName,
            taxId: legacy.taxId,
            address: legacy.address,
            branchType: legacy.branch === "สำนักงานใหญ่" ? "HEAD" : "BRANCH",
            branchNumber:
              legacy.branch === "สำนักงานใหญ่" ? null : legacy.branchCode || "00000",
            isDefault: true,
          },
          select: {
            id: true,
            organizationId: true,
            userId: true,
            companyName: true,
            taxId: true,
            address: true,
            branchType: true,
            branchNumber: true,
            isDefault: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        profiles = [created];
      }
    }

    return apiResponse({ taxProfiles: profiles });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/tax-profiles — create or update tax profile
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "tax_profile");
    if (rl.blocked) return rl.blocked;

    const input = taxProfileSchema.parse(await req.json());
    const organizationIds = await getAccessibleOrgIds(session.id);
    const resolvedOrganizationId =
      input.organizationId ?? organizationIds[0] ?? null;

    if (input.organizationId && !organizationIds.includes(input.organizationId)) {
      throw new ApiError(403, "ไม่มีสิทธิ์จัดการข้อมูลภาษีขององค์กรนี้");
    }

    if (input.isDefault) {
      await db.taxProfile.updateMany({
        where: {
          OR: [
            { userId: session.id, organizationId: resolvedOrganizationId },
            ...(resolvedOrganizationId
              ? [{ organizationId: resolvedOrganizationId }]
              : []),
          ],
        },
        data: { isDefault: false },
      });
    }

    if (input.id) {
      const existing = await db.taxProfile.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: session.id },
            ...(organizationIds.length > 0
              ? [{ organizationId: { in: organizationIds } }]
              : []),
          ],
        },
        select: { id: true },
      });

      if (!existing) throw new ApiError(404, "ไม่พบข้อมูลออกใบกำกับภาษี");
    }

    const profile = input.id
      ? await db.taxProfile.update({
          where: { id: input.id },
          data: {
            organizationId: resolvedOrganizationId,
            companyName: input.companyName,
            taxId: input.taxId,
            address: input.address,
            branchType: input.branchType,
            branchNumber: input.branchType === "HEAD" ? null : input.branchNumber ?? null,
            isDefault: input.isDefault,
          },
          select: {
            id: true,
            organizationId: true,
            userId: true,
            companyName: true,
            taxId: true,
            address: true,
            branchType: true,
            branchNumber: true,
            isDefault: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : await db.taxProfile.create({
          data: {
            userId: session.id,
            organizationId: resolvedOrganizationId,
            companyName: input.companyName,
            taxId: input.taxId,
            address: input.address,
            branchType: input.branchType,
            branchNumber: input.branchType === "HEAD" ? null : input.branchNumber ?? null,
            isDefault: input.isDefault,
          },
          select: {
            id: true,
            organizationId: true,
            userId: true,
            companyName: true,
            taxId: true,
            address: true,
            branchType: true,
            branchNumber: true,
            isDefault: true,
            createdAt: true,
            updatedAt: true,
          },
        });

    await db.customerTaxInfo.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        organizationId: resolvedOrganizationId,
        companyName: profile.companyName,
        taxId: profile.taxId,
        address: profile.address,
        branch: profile.branchType === "HEAD" ? "สำนักงานใหญ่" : "สาขา",
        branchCode: profile.branchType === "HEAD" ? "00000" : profile.branchNumber ?? "00000",
      },
      update: {
        organizationId: resolvedOrganizationId,
        companyName: profile.companyName,
        taxId: profile.taxId,
        address: profile.address,
        branch: profile.branchType === "HEAD" ? "สำนักงานใหญ่" : "สาขา",
        branchCode: profile.branchType === "HEAD" ? "00000" : profile.branchNumber ?? "00000",
      },
    });

    return apiResponse({ taxProfile: profile }, input.id ? 200 : 201);
  } catch (error) {
    return apiError(error);
  }
}
