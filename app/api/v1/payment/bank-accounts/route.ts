import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

const bankAccountSchema = z.object({
  bankCode: z.string().min(2).max(10),
  bankName: z.string().min(1).max(100),
  accountNumber: z.string().min(5).max(20),
  accountName: z.string().min(1).max(200),
  isDefault: z.boolean().optional().default(false),
});

// GET /api/v1/payment/bank-accounts — list user's bank accounts
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const accounts = await db.bankAccount.findMany({
      where: { userId: session.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
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

    return apiResponse({ accounts });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/payment/bank-accounts — create bank account
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const input = bankAccountSchema.parse(body);

    // Limit max 5 bank accounts per user
    const count = await db.bankAccount.count({ where: { userId: session.id } });
    if (count >= 5) {
      throw new ApiError(400, "บัญชีธนาคารครบ 5 บัญชีแล้ว");
    }

    // If setting as default, unset others
    if (input.isDefault) {
      await db.bankAccount.updateMany({
        where: { userId: session.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If first account, make it default
    const isFirst = count === 0;

    const account = await db.bankAccount.create({
      data: {
        userId: session.id,
        bankCode: input.bankCode,
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        accountName: input.accountName,
        isDefault: input.isDefault || isFirst,
      },
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

    return apiResponse({ account }, 201);
  } catch (error) {
    return apiError(error);
  }
}
