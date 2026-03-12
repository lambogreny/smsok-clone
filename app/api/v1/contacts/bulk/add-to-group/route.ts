import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { addContactsToGroup } from "@/lib/actions/contacts";
import { z } from "zod";

const schema = z.object({
  contactIds: z.array(z.string().cuid()).min(1).max(1000),
  groupId: z.string().cuid(),
});

// POST /api/v1/contacts/bulk/add-to-group
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json();
    const input = schema.parse(body);

    await addContactsToGroup(user.id, input.groupId, input.contactIds);
    return apiResponse({ success: true, added: input.contactIds.length });
  } catch (error) {
    return apiError(error);
  }
}
