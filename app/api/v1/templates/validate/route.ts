import { NextRequest } from "next/server";
import { apiResponse, apiError, authenticateRequest } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { prisma as db } from "@/lib/db";
import { getSmsSegmentMetrics } from "@/lib/package/quota";
import { buildTemplatePreview, extractVariables, findTemplateSyntaxWarnings } from "@/lib/template-utils";
import { z } from "zod";

const validateSchema = z.object({
  content: z.string().min(1).max(1000),
});

// Blocked URL shorteners
const BLOCKED_SHORTENERS = ["bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd"];

// POST /api/v1/templates/validate — content compliance check
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "template");
    if (denied) return denied;

    const input = validateSchema.parse(await req.json());
    const warnings: Array<{ type: string; message: string; word?: string }> = [];

    // 1. Scan against blocked_words table (shared DB) — skip if table doesn't exist
    try {
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
    } catch {
      // blocked_words table may not exist yet — skip word filtering
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
    const metrics = getSmsSegmentMetrics(input.content);
    const charsPerSegment = metrics.segments > 1 ? metrics.multiLimit : metrics.singleLimit;
    const syntaxWarnings = findTemplateSyntaxWarnings(input.content);
    const preview = buildTemplatePreview(input.content);
    const previewMetrics = getSmsSegmentMetrics(preview.rendered);
    const worstCaseMetrics = getSmsSegmentMetrics(preview.worstCaseRendered);

    for (const warning of syntaxWarnings) {
      warnings.push({
        type: "TEMPLATE_SYNTAX",
        message: warning,
      });
    }

    if (metrics.hasGsmExtendedChars) {
      warnings.push({
        type: "GSM_EXTENDED",
        message: `GSM-7 extended characters detected (${metrics.extendedCharCount})`,
      });
    }

    return apiResponse({
      valid: warnings.length === 0,
      warnings,
      variables: extractVariables(input.content),
      encoding: metrics.encoding,
      charCount: metrics.charCount,
      rawCharCount: metrics.rawCharCount,
      charsPerSegment,
      singleCharLimit: metrics.singleLimit,
      multiCharLimit: metrics.multiLimit,
      segmentCount: metrics.segments,
      extendedCharCount: metrics.extendedCharCount,
      hasGsmExtendedChars: metrics.hasGsmExtendedChars,
      previewText: preview.rendered,
      previewVariables: preview.previewVariables,
      previewCharCount: previewMetrics.charCount,
      previewSegmentCount: previewMetrics.segments,
      worstCaseCharCount: worstCaseMetrics.charCount,
      worstCaseSegmentCount: worstCaseMetrics.segments,
    });
  } catch (error) {
    return apiError(error);
  }
}
