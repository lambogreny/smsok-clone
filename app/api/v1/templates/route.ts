import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { createTemplate } from "@/lib/actions/templates";
import { prisma as db } from "@/lib/db";
import { templateSchema } from "@/lib/validations";
import { z } from "zod";

const listSchema = z.object({
  category: z.enum(["OTP", "TRANSACTIONAL", "MARKETING", "NOTIFICATION", "GENERAL"]).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "template");
    if (denied) return denied;
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const input = listSchema.parse(params);

    const where: Record<string, unknown> = { userId: user.id, deletedAt: null };
    if (input.category) where.category = input.category;
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" } },
        { content: { contains: input.search, mode: "insensitive" } },
      ];
    }

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
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
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

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "create", "template");
    if (denied) return denied;
    const body = await req.json();
    const input = templateSchema.parse(body);
    const template = await createTemplate(user.id, input);
    return apiResponse(template, 201);
  } catch (error) {
    return apiError(error);
  }
}
