import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { getUserConsentStatus, logRegistrationConsent } from "@/lib/actions/consent";

// GET /api/v1/consent — get current user's consent status
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const status = await getUserConsentStatus(user.id);
    return apiResponse({ consents: status });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/consent — log consent (registration or update)
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const { consents } = body as { consents: Array<{ consentType: string; action: string }> };
    if (!Array.isArray(consents) || consents.length === 0) {
      throw new ApiError(400, "กรุณาระบุ consents array");
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ua = req.headers.get("user-agent") ?? undefined;

    const result = await logRegistrationConsent({
      userId: user.id,
      consents: consents as any,
      ipAddress: ip,
      userAgent: ua,
    });

    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
