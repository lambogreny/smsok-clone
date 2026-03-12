import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const validateSchema = z.object({
  content: z.string().min(1).max(5000),
});

// Blocked URL shorteners
const BLOCKED_SHORTENERS = ["bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd"];

// POST /api/v1/templates/validate — content compliance check
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "template");
    if (rl.blocked) return rl.blocked;

    const input = validateSchema.parse(await req.json());
    const warnings: Array<{ type: string; message: string; word?: string }> = [];

    // 1. Scan against blocked_words table (shared DB)
    const blockedWords = await db.$queryRaw<
      Array<{ word: string; category: string }>
    >`SELECT word, category FROM blocked_words`;

    const contentLower = input.content.toLowerCase();
    for (const bw of blockedWords) {
      if (contentLower.includes(bw.word.toLowerCase())) {
        warnings.push({
          type: "BLOCKED_WORD",
          message: `พบคำต้องห้าม (หมวด: ${bw.category})`,
          word: bw.word,
        });
      }
    }

    // 2. URL shortener check
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = input.content.match(urlPattern) ?? [];
    for (const url of urls) {
      const lower = url.toLowerCase();
      for (const shortener of BLOCKED_SHORTENERS) {
        if (lower.includes(shortener)) {
          warnings.push({
            type: "URL_SHORTENER",
            message: `URL shortener ไม่อนุญาต: ${shortener}`,
          });
        }
      }
    }

    // 3. Segment info
    const hasThai = /[\u0E00-\u0E7F]/.test(input.content);
    const hasNonGsm = /[^\x00-\x7F]/.test(input.content);
    const encoding = hasThai || hasNonGsm ? "UCS-2" : "GSM-7";
    const charsPerSegment = encoding === "UCS-2" ? 70 : 160;
    const segmentCount = Math.max(1, Math.ceil(input.content.length / charsPerSegment));

    return apiResponse({
      valid: warnings.length === 0,
      warnings,
      encoding,
      charCount: input.content.length,
      charsPerSegment,
      segmentCount,
    });
  } catch (error) {
    return apiError(error);
  }
}
