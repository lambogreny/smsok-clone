import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { requireApiPermission } from "@/lib/rbac";
import { z } from "zod";
import { buildTemplatePreview } from "@/lib/template-utils";
import { getSmsSegmentMetrics } from "@/lib/package/quota";

const previewSchema = z.object({
  variables: z.record(z.string(), z.string()).default({}),
});

type Ctx = { params: Promise<{ id: string }> };

// POST /api/v1/templates/:id/preview — preview with sample data
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await authenticateRequest(req);
    const denied = await requireApiPermission(user.id, "read", "template");
    if (denied) return denied;
    const { id } = await ctx.params;
    const input = previewSchema.parse(await req.json());

    const template = await db.messageTemplate.findUnique({
      where: { id },
      select: { id: true, userId: true, content: true, isPublic: true, deletedAt: true },
    });

    if (!template || template.deletedAt) throw new ApiError(404, "ไม่พบ Template");
    if (template.userId !== user.id && !template.isPublic) {
      throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง Template นี้");
    }

    const preview = buildTemplatePreview(template.content, input.variables);
    const metrics = getSmsSegmentMetrics(preview.rendered);
    const worstCaseMetrics = getSmsSegmentMetrics(preview.worstCaseRendered);

    return apiResponse({
      rendered: preview.rendered,
      variables: preview.variables,
      missing: preview.missing,
      encoding: metrics.encoding,
      charCount: metrics.charCount,
      rawCharCount: metrics.rawCharCount,
      charsPerSegment: metrics.segments > 1 ? metrics.multiLimit : metrics.singleLimit,
      segmentCount: metrics.segments,
      extendedCharCount: metrics.extendedCharCount,
      hasGsmExtendedChars: metrics.hasGsmExtendedChars,
      previewVariables: preview.previewVariables,
      syntaxWarnings: preview.syntaxWarnings,
      worstCaseCharCount: worstCaseMetrics.charCount,
      worstCaseCharsPerSegment: worstCaseMetrics.segments > 1 ? worstCaseMetrics.multiLimit : worstCaseMetrics.singleLimit,
      worstCaseSegmentCount: worstCaseMetrics.segments,
    });
  } catch (error) {
    return apiError(error);
  }
}
