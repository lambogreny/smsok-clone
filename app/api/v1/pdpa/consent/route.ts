import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { recordConsent, getContactConsents, getConsentStatus } from "@/lib/actions/pdpa";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    if (!contactId) throw new Error("กรุณาระบุ contactId");

    const summary = searchParams.get("summary") === "true";
    if (summary) {
      const status = await getConsentStatus(user.id, contactId);
      return apiResponse({ contactId, consents: status });
    }

    const consents = await getContactConsents(user.id, contactId);
    return apiResponse({ consents });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticatePublicApiKey(req);
    const body = await req.json();
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const consent = await recordConsent(user.id, null, body, ipAddress);
    return apiResponse(consent, 201);
  } catch (error) {
    return apiError(error);
  }
}
