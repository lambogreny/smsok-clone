import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { getContacts, createContact } from "@/lib/actions/contacts";
import { createContactSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "50";
    const tagId = searchParams.get("tagId") || undefined;

    const result = await getContacts(user.id, { page, limit, tagId });
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();
    const input = createContactSchema.parse(body);
    const contact = await createContact(user.id, input);
    return apiResponse(contact, 201);
  } catch (error) {
    return apiError(error);
  }
}
