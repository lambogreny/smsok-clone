import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { createContactGroup, getContactsByGroup, addContactsToGroup } from "@/lib/actions/contacts";
import { addContactsToGroupSchema, createContactGroupSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();

    if (body.action === "add_contacts") {
      const input = addContactsToGroupSchema.parse(body);
      await addContactsToGroup(user.id, input.groupId, input.contactIds);
      return apiResponse({ success: true });
    }

    const input = createContactGroupSchema.parse(body);
    const group = await createContactGroup(user.id, input.name);
    return apiResponse(group, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return apiResponse({ error: "groupId is required" }, 400);
    }

    const contacts = await getContactsByGroup(user.id, groupId);
    return apiResponse({ contacts });
  } catch (error) {
    return apiError(error);
  }
}
