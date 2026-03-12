import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { getUserConsentStatus } from "@/lib/actions/consent";

// GET /api/v1/consent/status — check user's PDPA consent status
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const consents = await getUserConsentStatus(user.id);

    const allAccepted = consents.every(
      (c) => c.status === "OPT_IN",
    );

    return apiResponse({
      consents,
      allAccepted,
      needsReconsent: !allAccepted,
    });
  } catch (error) {
    console.error("[consent/status GET]", error instanceof Error ? error.stack : error);
    return apiError(error);
  }
}
