import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

const bankAccountSchema = z.object({
  bankName: z.string().min(1).max(100),
  accountName: z.string().min(1).max(200),
  accountNumber: z.string().min(10).max(20),
  branch: z.string().max(200).optional(),
  isActive: z.boolean().default(true),
});

// GET /api/admin/settings/bank-account — get bank account settings
export async function GET(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, ["SUPER_ADMIN", "FINANCE"]);
    const settings = await db.systemSetting.findMany({
      where: { key: { startsWith: "bank_account" } },
      select: { key: true, value: true, updatedAt: true },
    });

    // Parse stored JSON values
    const bankAccounts = settings
      .filter((s: (typeof settings)[number]) => s.key.startsWith("bank_account_"))
      .map((s: (typeof settings)[number]) => {
        try {
          return { id: s.key, ...JSON.parse(s.value), updatedAt: s.updatedAt };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return apiResponse({ bankAccounts });
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/admin/settings/bank-account — upsert bank account
export async function PUT(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, ["SUPER_ADMIN"]);
    const body = await req.json();
    const data = bankAccountSchema.parse(body);

    const key = `bank_account_${data.accountNumber.replace(/\D/g, "")}`;
    const value = JSON.stringify({ ...data, updatedBy: admin.id });

    await db.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    return apiResponse({ key, ...data });
  } catch (error) {
    return apiError(error);
  }
}
