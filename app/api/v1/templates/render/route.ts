import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { buildTemplatePreview, substituteVariables, extractVariables, findTemplateSyntaxWarnings } from "@/lib/template-utils";
import { prisma as db } from "@/lib/db";
import { templateRenderSchema } from "@/lib/validations";
import { getSmsSegmentMetrics } from "@/lib/package/quota";

// POST /api/v1/templates/render
// Body: { templateId: "xxx", variables: { name: "John", phone: "089..." } }
// OR:   { content: "Hello {name}!", variables: { name: "John" } }
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "template");
    if (denied) return denied;

    const body = await req.json();
    const input = templateRenderSchema.parse(body);

    let content: string;

    if (input.templateId) {
      const template = await db.messageTemplate.findFirst({
        where: { id: input.templateId, userId: user.id, deletedAt: null },
      });
      if (!template) {
        return apiResponse({ error: "Template not found" }, 404);
      }
      content = template.content;
    } else if (input.content) {
      content = input.content;
    } else {
      return apiResponse({ error: "Provide templateId or content" }, 400);
    }

    const variables = input.variables || {};
    const requiredVars = extractVariables(content);
    const rendered = substituteVariables(content, variables);
    const missingVars = requiredVars.filter((v) => !Object.prototype.hasOwnProperty.call(variables, v));
    const syntaxWarnings = findTemplateSyntaxWarnings(content);
    const preview = buildTemplatePreview(content, variables);

    const metrics = getSmsSegmentMetrics(rendered);
    const worstCaseMetrics = getSmsSegmentMetrics(preview.worstCaseRendered);

    return apiResponse({
      rendered,
      variables: requiredVars,
      missing: missingVars,
      charCount: metrics.charCount,
      rawCharCount: metrics.rawCharCount,
      encoding: metrics.encoding,
      charsPerSegment: metrics.segments > 1 ? metrics.multiLimit : metrics.singleLimit,
      extendedCharCount: metrics.extendedCharCount,
      hasGsmExtendedChars: metrics.hasGsmExtendedChars,
      segmentCount: metrics.segments,
      syntaxWarnings,
      worstCaseCharCount: worstCaseMetrics.charCount,
      worstCaseCharsPerSegment: worstCaseMetrics.segments > 1 ? worstCaseMetrics.multiLimit : worstCaseMetrics.singleLimit,
      worstCaseSegmentCount: worstCaseMetrics.segments,
    });
  } catch (error) {
    return apiError(error);
  }
}
