import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

// GET /api/v1/credits — credit balance + recent transaction history
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const type = searchParams.get("type") || undefined;
    const offset = (page - 1) * limit;

    const where = {
      userId: user.id,
      ...(type ? { type } : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          amount: true,
          balance: true,
          type: true,
          description: true,
          refId: true,
          createdAt: true,
        },
      }),
      prisma.creditTransaction.count({ where }),
    ]);

    return apiResponse({
      credits: user.credits,
      userId: user.id,
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError(error);
  }
}
