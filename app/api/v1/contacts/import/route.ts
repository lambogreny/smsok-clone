import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { importContacts } from "@/lib/actions/contacts";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { contactsImportSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);

    const limit = checkRateLimit(user.id, "import");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();
    const input = contactsImportSchema.parse(body);
    const result = await importContacts(user.id, input.contacts);
    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
