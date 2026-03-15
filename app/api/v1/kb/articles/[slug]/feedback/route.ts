import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { getClientIp } from "@/lib/session-utils";
import { z } from "zod";

const feedbackSchema = z.object({
  helpful: z.boolean(),
});

type Ctx = { params: Promise<{ slug: string }> };

const VOTE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function voteKey(slug: string, identifier: string) {
  return `kb:vote:${slug}:${identifier}`;
}

// POST /api/v1/kb/articles/:slug/feedback — helpful/not helpful vote (1 per user)
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    const userId = session?.id;
    const clientIp = getClientIp(req.headers) || "unknown";

    // Use userId if logged in, fallback to IP for anonymous
    const identifier = userId || `ip:${clientIp}`;
    const { slug } = await ctx.params;
    const input = feedbackSchema.parse(await req.json());

    const article = await db.knowledgeBase.findUnique({
      where: { slug },
      select: { id: true, published: true },
    });

    if (!article || !article.published) {
      throw new ApiError(404, "ไม่พบบทความ");
    }

    // Check if user already voted on this article
    const key = voteKey(slug, identifier);
    const existingVote = await redis.get(key);

    if (existingVote) {
      throw new ApiError(429, "คุณได้ให้ feedback บทความนี้แล้ว");
    }

    // Record vote and update count
    await redis.set(key, input.helpful ? "helpful" : "not_helpful", "EX", VOTE_TTL_SECONDS);

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
