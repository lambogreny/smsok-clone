import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { getAutoTopupSetting, upsertAutoTopupSetting } from "@/lib/actions/auto-topup";
import { z } from "zod";

const autoTopupSchema = z.object({
  isEnabled: z.boolean(),
  tierId: z.string().min(1, "กรุณาเลือก package"),
  threshold: z.number().int().min(1).max(10000).optional().default(100),
  maxPerMonth: z.number().int().min(1).max(10).optional().default(3),
});

// GET /api/v1/packages/auto-topup — get auto top-up settings
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const setting = await getAutoTopupSetting(session.id);
    return apiResponse({ autoTopup: setting });
  } catch (error) {
    console.error("[auto-topup GET]", error instanceof Error ? error.stack : error);
    return apiError(error);
  }
}

// POST /api/v1/packages/auto-topup — create/update auto top-up settings
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const { applyRateLimit } = await import("@/lib/rate-limit");
    const rl = await applyRateLimit(session.id, "purchase");
    if (rl.blocked) return rl.blocked;

    const input = autoTopupSchema.parse(body);

    const setting = await upsertAutoTopupSetting(session.id, input);

    return apiResponse({ autoTopup: setting });
  } catch (error) {
    return apiError(error);
  }
}
