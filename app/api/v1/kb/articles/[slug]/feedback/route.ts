import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const feedbackSchema = z.object({
  helpful: z.boolean(),
});

type Ctx = { params: Promise<{ slug: string }> };

// POST /api/v1/kb/articles/:slug/feedback — helpful/not helpful vote
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    const userId = session?.id ?? "anon";

    const rl = await applyRateLimit(userId, "kb_read");
    if (rl.blocked) return rl.blocked;

    const { slug } = await ctx.params;
    const input = feedbackSchema.parse(await req.json());

    const article = await db.knowledgeBase.findUnique({
      where: { slug },
      select: { id: true, published: true },
    });

    if (!article || !article.published) {
      throw new ApiError(404, "ไม่พบบทความ");
    }

    const updated = await db.knowledgeBase.update({
      where: { slug },
      data: input.helpful
        ? { helpfulCount: { increment: 1 } }
        : { notHelpfulCount: { increment: 1 } },
      select: { id: true, helpfulCount: true, notHelpfulCount: true },
    });

    return apiResponse(updated);
  } catch (error) {
    return apiError(error);
  }
}
