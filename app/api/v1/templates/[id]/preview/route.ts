import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const previewSchema = z.object({
  variables: z.record(z.string(), z.string()).default({}),
});

function calculateSegments(content: string): number {
  const hasThai = /[\u0E00-\u0E7F]/.test(content);
  const hasNonGsm = /[^\x00-\x7F]/.test(content);
  const charsPerSegment = hasThai || hasNonGsm ? 70 : 160;
  return Math.max(1, Math.ceil(content.length / charsPerSegment));
}

type Ctx = { params: Promise<{ id: string }> };

// POST /api/v1/templates/:id/preview — preview with sample data
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "template");
    if (rl.blocked) return rl.blocked;

    const { id } = await ctx.params;
    const input = previewSchema.parse(await req.json());

    const template = await db.messageTemplate.findUnique({
      where: { id },
      select: { id: true, userId: true, content: true, isPublic: true, deletedAt: true },
    });

    if (!template || template.deletedAt) throw new ApiError(404, "ไม่พบ Template");
    if (template.userId !== session.id && !template.isPublic) {
      throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง Template นี้");
    }

    // Replace {{varName}} and {{varName|default}} with provided values or defaults
    const rendered = template.content.replace(
      /\{\{(\w+)(?:\|([^}]*))?\}\}/g,
      (_, varName: string, defaultVal?: string) => {
        return input.variables[varName] ?? defaultVal ?? `{{${varName}}}`;
      },
    );

    const hasThai = /[\u0E00-\u0E7F]/.test(rendered);
    const hasNonGsm = /[^\x00-\x7F]/.test(rendered);
    const encoding = hasThai || hasNonGsm ? "UCS-2" : "GSM-7";
    const charsPerSegment = encoding === "UCS-2" ? 70 : 160;

    return apiResponse({
      rendered,
      encoding,
      charCount: rendered.length,
      charsPerSegment,
      segmentCount: calculateSegments(rendered),
    });
  } catch (error) {
    return apiError(error);
  }
}
