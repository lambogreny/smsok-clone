import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { checkReconsentNeeded, getUserConsentStatus } from "@/lib/actions/consent";

// GET /api/v1/consent/status — check user's PDPA consent status
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const [consents, needsReconsent] = await Promise.all([
      getUserConsentStatus(user.id),
      checkReconsentNeeded(user.id),
    ]);

    const allAccepted = consents.every(
      (c) => c.status === "OPT_IN",
    );
    const requiredAccepted = consents
      .filter((c) => c.type === "SERVICE" || c.type === "THIRD_PARTY")
      .every((c) => c.status === "OPT_IN");

    return apiResponse({
      consents,
      allAccepted,
      requiredAccepted,
      needsReconsent,
    });
  } catch (error) {
    return apiError(error);
  }
}
