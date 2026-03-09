import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { createContactGroup, getContactsByGroup, addContactsToGroup } from "@/lib/actions/contacts";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();

    if (body.action === "add_contacts") {
      await addContactsToGroup(user.id, body.groupId, body.contactIds);
      return apiResponse({ success: true });
    }

    const group = await createContactGroup(user.id, body.name);
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
