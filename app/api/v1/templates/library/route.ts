import { NextRequest } from "next/server";
import { apiResponse, apiError, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

const listSchema = z.object({
  category: z.enum(["OTP", "TRANSACTIONAL", "MARKETING", "NOTIFICATION", "GENERAL"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// GET /api/v1/templates/library — pre-built public templates
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const input = listSchema.parse(params);

    const where: Record<string, unknown> = { isPublic: true, deletedAt: null };
    if (input.category) where.category = input.category;

    const [templates, total] = await Promise.all([
      db.messageTemplate.findMany({
        where,
        select: {
          id: true,
          name: true,
          content: true,
          category: true,
          variables: true,
          segmentCount: true,
        },
        orderBy: { name: "asc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      db.messageTemplate.count({ where }),
    ]);

    return apiResponse({
      templates,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
