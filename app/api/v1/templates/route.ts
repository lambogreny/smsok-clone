import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { getTemplates, createTemplate } from "@/lib/actions/templates";
import { templateSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const templates = await getTemplates(user.id);
    return apiResponse({ templates });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();
    const input = templateSchema.parse(body);
    const template = await createTemplate(user.id, input);
    return apiResponse(template, 201);
  } catch (error) {
    return apiError(error);
  }
}
