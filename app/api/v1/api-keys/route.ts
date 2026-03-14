import { NextRequest } from "next/server";
import { apiResponse, apiError, authenticateRequest } from "@/lib/api-auth";
import {
  createApiKeyForUser,
  listApiKeysForUser,
} from "@/lib/api-keys/service";
import { createApiKeySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const keys = await listApiKeysForUser(user.id);
    return apiResponse({ apiKeys: keys });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json();
    const input = createApiKeySchema.parse(body);
    const apiKey = await createApiKeyForUser(user.id, input);
    return apiResponse(apiKey, 201);
  } catch (error) {
    return apiError(error);
  }
}
