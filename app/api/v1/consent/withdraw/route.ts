import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { withdrawConsent } from "@/lib/actions/consent";

// POST /api/v1/consent/withdraw — withdraw marketing/cookie consent
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const { consentType } = body as { consentType: string };
    if (!consentType) throw new ApiError(400, "กรุณาระบุ consentType");

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ua = req.headers.get("user-agent") ?? undefined;

    const result = await withdrawConsent({
      userId: user.id,
      consentType: consentType as any,
      ipAddress: ip,
      userAgent: ua,
    });

    return apiResponse({ success: true, log: result });
  } catch (error) {
    return apiError(error);
  }
}
