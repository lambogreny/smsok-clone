import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const listSchema = z.object({
  category: z.string().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// GET /api/v1/kb/articles — list published KB articles
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.id ?? "anon";

    const rl = await applyRateLimit(userId, "kb_read");
    if (rl.blocked) return rl.blocked;

    const params = Object.fromEntries(new URL(req.url).searchParams);
    const input = listSchema.parse(params);

    const where: Record<string, unknown> = { published: true };
    if (input.category) where.category = input.category;
    if (input.search) {
      where.OR = [
        { title: { contains: input.search, mode: "insensitive" } },
        { content: { contains: input.search, mode: "insensitive" } },
      ];
    }

    const [articles, total] = await Promise.all([
      db.knowledgeBase.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          viewCount: true,
          helpfulCount: true,
          publishedAt: true,
        },
        orderBy: { viewCount: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      db.knowledgeBase.count({ where }),
    ]);

    // Get category counts for filter UI
    const categories = await db.knowledgeBase.groupBy({
      by: ["category"],
      where: { published: true },
      _count: { _all: true },
    });

    return apiResponse({
      articles,
      categories: categories.map((c) => ({ category: c.category, count: c._count._all })),
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
