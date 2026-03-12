import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { updateCustomField, deleteCustomField } from "@/lib/actions/custom-fields";

type RouteContext = { params: Promise<{ id: string }> };

// PUT /api/v1/custom-fields/:id — update custom field
export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "update", "contact");
    if (denied) return denied;

    const { id } = await ctx.params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const { name, type, options, required } = body as Record<string, unknown>;
    const field = await updateCustomField(user.id, id, {
      name: typeof name === "string" ? name : undefined,
      type: typeof type === "string" ? type : undefined,
      options: Array.isArray(options) ? options.filter((o): o is string => typeof o === "string") : undefined,
      required: typeof required === "boolean" ? required : undefined,
    });
    return apiResponse(field);
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/v1/custom-fields/:id — delete custom field
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "delete", "contact");
    if (denied) return denied;

    const { id } = await ctx.params;
    await deleteCustomField(user.id, id);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
