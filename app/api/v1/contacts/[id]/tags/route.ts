import { NextRequest } from "next/server";
import { apiError, apiResponse, authenticateRequest } from "@/lib/api-auth";
import { assignTagToContact, unassignTagFromContact } from "@/lib/actions/tags";
import { assignContactTagSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json();
    const input = assignContactTagSchema.parse(body);
    const { id } = await params;
    const result = await assignTagToContact(user.id, id, input);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json();
    const input = assignContactTagSchema.parse(body);
    const { id } = await params;
    const result = await unassignTagFromContact(user.id, id, input);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
