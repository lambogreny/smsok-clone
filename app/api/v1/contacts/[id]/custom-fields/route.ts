import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { getCustomFieldValues, setCustomFieldValues } from "@/lib/actions/custom-fields";
import { customFieldValuesSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/v1/contacts/:id/custom-fields — get custom field values for contact
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await authenticateRequest(req);
    const { id: contactId } = await ctx.params;
    const values = await getCustomFieldValues(user.id, contactId);
    return apiResponse({ values });
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/contacts/:id/custom-fields — set custom field values for contact
export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await authenticateRequest(req);
    const { id: contactId } = await ctx.params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new Error("กรุณาส่งข้อมูล JSON");
    }
    const { values } = customFieldValuesSchema.parse(body);

    await setCustomFieldValues(user.id, contactId, values);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
