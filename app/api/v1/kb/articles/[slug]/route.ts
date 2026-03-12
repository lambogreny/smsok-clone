import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ slug: string }> };

// GET /api/v1/kb/articles/:slug — single article by slug
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    const userId = session?.id ?? "anon";

    const rl = await applyRateLimit(userId, "kb_read");
    if (rl.blocked) return rl.blocked;

    const { slug } = await ctx.params;

    const article = await db.knowledgeBase.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        content: true,
        slug: true,
        category: true,
        viewCount: true,
        helpfulCount: true,
        notHelpfulCount: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    if (!article || !article.publishedAt) {
      throw new ApiError(404, "ไม่พบบทความ");
    }

    // Increment view count (fire and forget)
    db.knowledgeBase.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return apiResponse(article);
  } catch (error) {
    return apiError(error);
  }
}
