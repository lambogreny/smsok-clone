import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { getUserConsentStatus, logRegistrationConsent } from "@/lib/actions/consent";
import { getClientIp } from "@/lib/session-utils";
import { z } from "zod";

const consentTypeSchema = z.enum(["SERVICE", "MARKETING", "THIRD_PARTY", "COOKIE"]);
const consentActionSchema = z.enum(["OPT_IN", "OPT_OUT"]);
const consentRequestSchema = z.object({
  consents: z
    .array(
      z.object({
        consentType: consentTypeSchema,
        action: consentActionSchema,
      }),
    )
    .min(1, "กรุณาระบุ consents array"),
});

async function getOptionalUser(req: NextRequest) {
  try {
    return await authenticateRequest(req);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

// GET /api/v1/consent — get current user's consent status
export async function GET(req: NextRequest) {
  try {
    const user = await getOptionalUser(req);
    if (!user) {
      return apiResponse({ consents: [] });
    }

    const status = await getUserConsentStatus(user.id);
    return apiResponse({ consents: status });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/consent — log consent (registration or update)
export async function POST(req: NextRequest) {
  try {
    const user = await getOptionalUser(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const input = consentRequestSchema.parse(body);

    if (!user) {
      return apiResponse({ accepted: true, persisted: false }, 202);
    }

    const ip = getClientIp(req.headers);
    const ua = req.headers.get("user-agent") ?? undefined;

    const result = await logRegistrationConsent({
      userId: user.id,
      consents: input.consents,
      ipAddress: ip,
      userAgent: ua,
    });

    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
