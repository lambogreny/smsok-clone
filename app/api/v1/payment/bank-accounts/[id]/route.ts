import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

const updateBankAccountSchema = z.object({
  bankCode: z.string().min(2).max(10).optional(),
  bankName: z.string().min(1).max(100).optional(),
  accountNumber: z.string().min(5).max(20).optional(),
  accountName: z.string().min(1).max(200).optional(),
  isDefault: z.boolean().optional(),
});

// PUT /api/v1/payment/bank-accounts/[id] — update bank account
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { applyRateLimit } = await import("@/lib/rate-limit");
    const rl = await applyRateLimit(session.id, "purchase");
    if (rl.blocked) return rl.blocked;

    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const input = updateBankAccountSchema.parse(body);

    const existing = await db.bankAccount.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) throw new ApiError(404, "ไม่พบบัญชีธนาคาร");
    if (existing.userId !== session.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึงบัญชีนี้");

    // If setting as default, unset others
    if (input.isDefault) {
      await db.bankAccount.updateMany({
        where: { userId: session.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await db.bankAccount.update({
      where: { id },
      data: input,
      select: {
        id: true,
        bankCode: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return apiResponse({ account });
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/v1/payment/bank-accounts/[id] — delete bank account
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { applyRateLimit } = await import("@/lib/rate-limit");
    const rl = await applyRateLimit(session.id, "purchase");
    if (rl.blocked) return rl.blocked;

    const { id } = await params;

    const existing = await db.bankAccount.findUnique({
      where: { id },
      select: { userId: true, isDefault: true },
    });

    if (!existing) throw new ApiError(404, "ไม่พบบัญชีธนาคาร");
    if (existing.userId !== session.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึงบัญชีนี้");

    await db.bankAccount.delete({ where: { id } });

    // If deleted account was default, set next one as default
    if (existing.isDefault) {
      const next = await db.bankAccount.findFirst({
        where: { userId: session.id },
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await db.bankAccount.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
