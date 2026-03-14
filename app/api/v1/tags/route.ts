import { NextRequest } from "next/server";
import { apiError, apiResponse, authenticateRequest } from "@/lib/api-auth";
import { createTag, getTags } from "@/lib/actions/tags";
import { createTagSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const tags = await getTags(user.id);
    return apiResponse({ tags });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json();
    const input = createTagSchema.parse(body);
    const tag = await createTag(user.id, input);
    return apiResponse(tag, 201);
  } catch (error) {
    return apiError(error);
  }
}
